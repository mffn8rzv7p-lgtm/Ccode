// Webhook de WhatsApp: Meta llama a esta función con cada mensaje que escribe un paciente.
import { CLINICA } from "../_shared/config.ts";
import { env } from "../_shared/env.ts";
import { DateTime, dentroDeHorario, fechaLegible, leerFecha } from "../_shared/fechas.ts";
import { firmaValida, leerMensajes, type MensajeEntrante, paramPlantilla, prepararRespuesta } from "../_shared/mensaje.ts";
import { guardarEnMemoria, leerMemoria, marcarProcesado, bloquearHorario, liberarHorario } from "../_shared/db.ts";
import { crearCita, guardarFicha, ocupados } from "../_shared/google.ts";
import { atender } from "../_shared/agente.ts";
import { transcribir } from "../_shared/transcribir.ts";
import * as wa from "../_shared/whatsapp.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // 1) Verificación que hace Meta una sola vez al registrar el webhook.
  if (req.method === "GET") {
    const ok = url.searchParams.get("hub.mode") === "subscribe" &&
      url.searchParams.get("hub.verify_token") === env("WHATSAPP_VERIFY_TOKEN");
    return ok ? new Response(url.searchParams.get("hub.challenge") ?? "") : new Response("Token incorrecto", { status: 403 });
  }
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });

  // 2) Solo se aceptan mensajes firmados por Meta con el secreto de tu app.
  const cuerpo = await req.text();
  if (!(await firmaValida(cuerpo, req.headers.get("x-hub-signature-256"), env("WHATSAPP_APP_SECRET")))) {
    return new Response("Firma inválida", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(cuerpo);
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  // 3) Se responde a Meta de inmediato y el mensaje se atiende en segundo plano
  //    (si Meta no recibe respuesta rápido, reenvía el mismo mensaje).
  const trabajo = Promise.all(leerMensajes(payload).map((m) =>
    atenderMensaje(m).catch(async (e) => {
      console.error(`Error atendiendo ${m.id}`, e);
      // Que la persona no quede sin respuesta si algo falla (Claude, Google o Meta caídos).
      await wa.enviarTexto(m.telefono, "Gracias por escribirnos 🙏 En este momento no puedo responder; el equipo de la clínica te contesta pronto.")
        .catch(() => {});
    })
  ));
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(trabajo);
  else await trabajo;
  return new Response("ok");
});

async function atenderMensaje(m: MensajeEntrante): Promise<void> {
  if (!(await marcarProcesado(m.id))) return; // ya se había atendido
  wa.marcarLeido(m.id).catch(() => {});

  // Tocó un botón de horario: se reserva directo, sin pasar por la IA.
  if (m.tipo === "eleccion" && m.inicio) {
    await guardarEnMemoria(m.telefono, { rol: "user", contenido: `Elijo el horario: ${m.texto}` });
    await reservar(m.telefono, { inicio: m.inicio, nombre: m.nombre || "Paciente", motivo: m.motivo || "Consulta", urgente: m.urgente });
    return;
  }

  let texto = m.texto;
  let esNotaDeVoz = false;
  if (m.tipo === "audio" && m.audioId) {
    const audio = await wa.descargarMedia(m.audioId);
    const transcrito = await transcribir(audio.datos, audio.tipo);
    if (!transcrito) {
      await wa.enviarTexto(m.telefono, "Perdón, todavía no puedo escuchar notas de voz 🙏 ¿Me lo escribes en un mensaje?");
      return;
    }
    texto = transcrito;
    esNotaDeVoz = true;
  }

  const ahora = DateTime.now().setZone(CLINICA.zonaHoraria).setLocale("es-CO");
  const mensajeUsuario = `Fecha y hora actual en la clínica: ${ahora.toFormat("cccc d 'de' LLLL 'de' yyyy, h:mm a")}\n` +
    `Paciente: ${m.nombre || "sin nombre"} (WhatsApp +${m.telefono})\n` +
    `Mensaje${esNotaDeVoz ? " (nota de voz transcrita)" : ""}: ${texto}`;

  const memoria = await leerMemoria(m.telefono);
  const salida = await atender(memoria, mensajeUsuario);
  const r = prepararRespuesta(salida, m.nombre);

  // Se guarda en la memoria lo que dijo la persona y lo que se le respondió
  // (con los horarios ofrecidos, para que la IA los recuerde si luego los escribe en vez de tocar el botón).
  const ofrecidos = r.accion === "ofrecer_horarios"
    ? `\n[Horarios ofrecidos: ${r.botones.map((b) => `${b.reply.title} = ${JSON.parse(b.reply.id).i}`).join("; ")}]`
    : "";
  await guardarEnMemoria(
    m.telefono,
    { rol: "user", contenido: `${esNotaDeVoz ? "(nota de voz) " : ""}${texto}` },
    { rol: "assistant", contenido: r.respuesta + ofrecidos },
  );

  if (r.accion === "ofrecer_horarios") await wa.enviarBotones(m.telefono, r.respuesta, r.botones);
  else if (r.accion === "reservar" && r.inicio) {
    await reservar(m.telefono, { inicio: r.inicio, nombre: r.nombre || "Paciente", motivo: r.motivo || "Consulta", urgente: r.urgente });
  } else await wa.enviarTexto(m.telefono, r.respuesta);

  // Urgencias y casos que la IA no puede resolver: aviso a la clínica.
  if (r.urgente || r.accion === "derivar") {
    await wa.enviarPlantilla(CLINICA.telefonoClinica, "aviso_clinica", CLINICA.idiomaPlantillas, [
      r.urgente ? "URGENCIA" : "Revisión",
      paramPlantilla(`${r.nombre || "Sin nombre"} (+${m.telefono})`),
      paramPlantilla(texto || r.motivo, 180),
    ]).catch((e) => console.error("No se pudo avisar a la clínica", e));
  }
}

interface Reserva {
  inicio: string;
  nombre: string;
  motivo: string;
  urgente: boolean;
}

async function reservar(telefono: string, c: Reserva): Promise<void> {
  const z = CLINICA.zonaHoraria;
  const inicio = leerFecha(c.inicio, z);
  const avisarOcupado = async () => {
    const texto = "Uy, ese horario ya no está disponible 😅 ¿Te propongo otro?";
    await wa.enviarTexto(telefono, texto);
    await guardarEnMemoria(telefono, { rol: "assistant", contenido: texto });
  };

  if (!inicio.isValid || inicio < DateTime.now() || !dentroDeHorario(inicio, CLINICA)) return avisarOcupado();
  const fin = inicio.plus({ minutes: CLINICA.duracionCitaMin });
  const iniISO = inicio.toISO()!;

  if (!(await bloquearHorario(iniISO))) return avisarOcupado();
  try {
    if ((await ocupados(iniISO, fin.toISO()!)).length > 0) return avisarOcupado();

    const eventoId = await crearCita({
      inicio: iniISO,
      fin: fin.toISO()!,
      nombre: c.nombre,
      telefono,
      motivo: c.motivo,
      urgente: c.urgente,
      direccion: CLINICA.direccion,
    });

    const formato = "yyyy-MM-dd HH:mm";
    await guardarFicha([
      DateTime.now().setZone(z).toFormat(formato),
      c.nombre,
      telefono,
      c.motivo,
      c.urgente ? "Sí" : "No",
      inicio.setZone(z).toFormat(formato),
      eventoId,
    ]).catch((e) => console.error("La cita se creó, pero no se pudo guardar la ficha en Sheets", e));

    const confirmacion = `¡Listo, ${c.nombre}! ✅ Tu cita con la ${CLINICA.doctora} quedó para el ${fechaLegible(inicio, z)}. ` +
      "Te mando la ubicación para que llegues sin problema.";
    await wa.enviarTexto(telefono, confirmacion);
    await wa.enviarUbicacion(telefono, CLINICA.latitud, CLINICA.longitud, CLINICA.nombre, CLINICA.direccion);
    // Para que la IA sepa que la cita ya existe si la persona vuelve a escribir.
    await guardarEnMemoria(telefono, { rol: "assistant", contenido: `${confirmacion}\n[Cita agendada: ${iniISO}, motivo: ${c.motivo}]` });
  } finally {
    await liberarHorario(iniISO);
  }
}
