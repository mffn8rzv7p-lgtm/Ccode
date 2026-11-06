// Funciones puras (sin red) para leer lo que llega de WhatsApp y armar lo que se responde.

export type TipoMensaje = "texto" | "audio" | "eleccion" | "otro";

export interface MensajeEntrante {
  id: string;
  tipo: TipoMensaje;
  texto: string;
  telefono: string;
  nombre: string;
  audioId: string | null;
  // Solo cuando la persona toca un botón de horario:
  inicio: string | null;
  urgente: boolean;
  motivo: string;
}

// Lo que va dentro del id de cada botón de horario (máximo 256 caracteres).
interface EleccionBoton {
  i: string; // inicio ISO 8601
  u: 0 | 1; // urgente
  m: string; // motivo
  n: string; // nombre
}

// deno-lint-ignore no-explicit-any
type Json = any;

/** Un mensaje limpio por cada mensaje entrante. Ignora los avisos de estado (enviado, entregado, leído). */
export function leerMensajes(payload: Json): MensajeEntrante[] {
  const salida: MensajeEntrante[] = [];
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const v = change?.value ?? {};
      const contacto = v.contacts?.[0] ?? {};
      for (const msg of v.messages ?? []) {
        let tipo: TipoMensaje = "otro";
        let texto = "";
        let eleccion: EleccionBoton | null = null;

        if (msg.type === "text") {
          tipo = "texto";
          texto = msg.text?.body ?? "";
        } else if (msg.type === "interactive") {
          const r = msg.interactive?.button_reply ?? msg.interactive?.list_reply ?? {};
          tipo = "texto";
          texto = r.title ?? "";
          try {
            const p = JSON.parse(r.id);
            if (p && typeof p.i === "string") {
              eleccion = p;
              tipo = "eleccion";
            }
          } catch { /* botón que no es de horario */ }
        } else if (msg.type === "button") {
          // Respuesta rápida a una plantilla (por ejemplo, el recordatorio).
          tipo = "texto";
          texto = msg.button?.text ?? "";
        } else if (msg.type === "audio") {
          tipo = "audio";
        } else {
          texto = `[La persona envió un mensaje de tipo "${msg.type}" que no se puede leer]`;
        }

        salida.push({
          id: msg.id,
          tipo,
          texto,
          telefono: msg.from,
          nombre: eleccion?.n || contacto.profile?.name || "",
          audioId: msg.audio?.id ?? null,
          inicio: eleccion?.i ?? null,
          urgente: eleccion ? eleccion.u === 1 : false,
          motivo: eleccion?.m ?? "",
        });
      }
    }
  }
  return salida;
}

export const corta = (s: unknown, n: number) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

export type Accion = "responder" | "ofrecer_horarios" | "reservar" | "derivar";

export interface SalidaAgente {
  respuesta: string;
  accion: Accion;
  botones: { titulo: string; inicio: string }[];
  urgente: boolean;
  motivo: string;
  nombre_paciente: string;
  cita_inicio: string;
}

export interface BotonWhatsApp {
  type: "reply";
  reply: { id: string; title: string };
}

export interface RespuestaPreparada {
  accion: Accion;
  respuesta: string;
  botones: BotonWhatsApp[];
  urgente: boolean;
  motivo: string;
  nombre: string;
  inicio: string | null;
}

/** Convierte la salida del agente en lo que WhatsApp acepta (máx. 3 botones, títulos únicos de 20 caracteres). */
export function prepararRespuesta(o: Partial<SalidaAgente>, nombreContacto: string): RespuestaPreparada {
  const nombre = corta(o.nombre_paciente || nombreContacto, 40);
  const urgente = o.urgente === true;
  const motivo = corta(o.motivo, 40);

  const vistos = new Set<string>();
  const botones: BotonWhatsApp[] = [];
  for (const b of Array.isArray(o.botones) ? o.botones : []) {
    const titulo = corta(b?.titulo, 20);
    if (!b?.inicio || !titulo || vistos.has(titulo)) continue;
    vistos.add(titulo);
    let n = nombre;
    let m = motivo;
    const armar = () => JSON.stringify({ i: b.inicio, u: urgente ? 1 : 0, m, n } satisfies EleccionBoton);
    // El id no puede pasar de 256 caracteres: se recortan motivo y nombre, nunca la fecha.
    while (armar().length > 256 && (m || n)) {
      if (m) m = m.slice(0, -5);
      else n = n.slice(0, -5);
    }
    botones.push({ type: "reply", reply: { id: armar(), title: titulo } });
    if (botones.length === 3) break;
  }

  let accion: Accion = o.accion ?? "responder";
  if (accion === "ofrecer_horarios" && botones.length === 0) accion = "responder";
  if (accion === "reservar" && !o.cita_inicio) accion = "responder";

  return {
    accion,
    respuesta: corta(o.respuesta, 1000) || "Gracias por escribir. En un momento te respondemos.",
    botones,
    urgente,
    motivo,
    nombre,
    inicio: o.cita_inicio || null,
  };
}

/** Los parámetros de una plantilla de WhatsApp no pueden tener saltos de línea, tabs ni más de 4 espacios seguidos. */
export function paramPlantilla(s: unknown, max = 900): string {
  return corta(s, max) || "-";
}

/** Verifica la firma X-Hub-Signature-256 que Meta pone en cada webhook. */
export async function firmaValida(cuerpo: string, firma: string | null, secreto: string): Promise<boolean> {
  if (!firma?.startsWith("sha256=")) return false;
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(cuerpo)));
  const esperado = "sha256=" + Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  if (esperado.length !== firma.length) return false;
  let dif = 0;
  for (let i = 0; i < esperado.length; i++) dif |= esperado.charCodeAt(i) ^ firma.charCodeAt(i);
  return dif === 0;
}
