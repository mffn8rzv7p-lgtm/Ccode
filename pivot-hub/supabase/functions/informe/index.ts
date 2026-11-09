// Función "informe": genera un informe por etapas.
//   POST { informe_id, etapa: "datos" | "auditoria" | "estrategia" }
// Cada etapa guarda su resultado en la tabla `informes`; la página las llama en orden.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import { encodeBase64 } from "jsr:@std/encoding@1.0.5/base64";
import { leerCuentaPublica, metaConfigurada } from "./meta.ts";
import { calcularMetricas, type Metricas } from "./metricas.ts";
import {
  ErrorGeneracion,
  ESQUEMA_AUDITORIA,
  ESQUEMA_ESTRATEGIA,
  generar,
  type Imagen,
  promptAuditoria,
  promptEstrategia,
} from "./claude.ts";

const ORIGENES = (Deno.env.get("ORIGENES_PERMITIDOS") ?? "*").split(",").map((s) => s.trim());

function cors(req: Request): HeadersInit {
  const origen = req.headers.get("Origin") ?? "";
  const permitido = ORIGENES.includes("*") ? "*" : (ORIGENES.includes(origen) ? origen : ORIGENES[0]);
  return {
    "Access-Control-Allow-Origin": permitido,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function responder(req: Request, cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });
}

type Fila = {
  id: string;
  cuenta: string;
  competidores: string[];
  contexto: Record<string, unknown>;
  capturas: string[];
  estado: string;
  datos: Record<string, unknown> | null;
  auditoria: Record<string, unknown> | null;
};

const MAX_CAPTURAS = 12;

async function leerCapturas(db: SupabaseClient, rutas: string[]): Promise<Imagen[]> {
  const imagenes: Imagen[] = [];
  for (const ruta of rutas.slice(0, MAX_CAPTURAS)) {
    const { data, error } = await db.storage.from("capturas").download(ruta);
    if (error || !data) continue;
    const tipo = data.type === "image/png" || data.type === "image/webp" ? data.type : "image/jpeg";
    imagenes.push({ media_type: tipo, data: encodeBase64(new Uint8Array(await data.arrayBuffer())) });
  }
  return imagenes;
}

async function etapaDatos(fila: Fila) {
  const cuentas = [fila.cuenta, ...fila.competidores];
  if (!metaConfigurada()) {
    return {
      fuente: "capturas",
      obtenido_en: new Date().toISOString(),
      aviso: "La conexión con Meta no está configurada; el análisis se hace solo con las capturas.",
      cuenta: null,
      competidores: [],
    };
  }
  const resultados = await Promise.all(
    cuentas.map((u, i) => leerCuentaPublica(u, i === 0 ? 50 : 30)),
  );
  const empaquetar = (u: string, r: (typeof resultados)[number]) =>
    r.ok ? { usuario: u, disponible: true, metricas: calcularMetricas(r.perfil) }
         : { usuario: u, disponible: false, motivo: r.motivo };
  return {
    fuente: "meta",
    obtenido_en: new Date().toISOString(),
    cuenta: empaquetar(fila.cuenta, resultados[0]),
    competidores: fila.competidores.map((u, i) => empaquetar(u, resultados[i + 1])),
  };
}

// Versión corta de los datos para la etapa de estrategia (sin la lista completa de publicaciones).
function resumirDatos(datos: Record<string, unknown> | null) {
  if (!datos) return null;
  const quitar = (c: unknown) => {
    const x = c as { metricas?: Metricas } | null;
    if (!x?.metricas) return x;
    const { publicaciones: _p, peores: _w, ...resto } = x.metricas;
    return { ...x, metricas: resto };
  };
  return {
    ...datos,
    cuenta: quitar(datos.cuenta),
    competidores: ((datos.competidores as unknown[]) ?? []).map(quitar),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return responder(req, { error: "Método no permitido" }, 405);

  const auth = req.headers.get("Authorization");
  if (!auth) return responder(req, { error: "Inicia sesión para continuar." }, 401);

  // Cliente con la sesión de quien llama: las reglas de la base de datos deciden qué puede ver.
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });

  const { data: miembro } = await db.rpc("es_miembro");
  if (miembro !== true) return responder(req, { error: "Tu cuenta no tiene acceso a Pivot Hub." }, 403);

  let cuerpo: { informe_id?: string; etapa?: string };
  try {
    cuerpo = await req.json();
  } catch (_e) {
    return responder(req, { error: "Solicitud inválida." }, 400);
  }
  const { informe_id, etapa } = cuerpo;
  if (!informe_id || !["datos", "auditoria", "estrategia"].includes(etapa ?? "")) {
    return responder(req, { error: "Falta el informe o la etapa." }, 400);
  }

  const { data: fila, error: errLeer } = await db.from("informes").select("*").eq("id", informe_id).single<Fila>();
  if (errLeer || !fila) return responder(req, { error: "No encontré ese informe." }, 404);

  const guardar = (cambios: Record<string, unknown>) => db.from("informes").update(cambios).eq("id", informe_id);

  try {
    if (etapa === "datos") {
      const datos = await etapaDatos(fila);
      const cuentaOk = (datos.cuenta as { disponible?: boolean } | null)?.disponible === true;
      if (!cuentaOk && fila.capturas.length === 0) {
        const motivo = (datos.cuenta as { motivo?: string } | null)?.motivo ?? datos.aviso;
        throw new ErrorGeneracion(`${motivo} Agrega capturas de pantalla de la cuenta y vuelve a intentarlo.`);
      }
      await guardar({ datos, estado: "datos", error: null });
      return responder(req, { ok: true, estado: "datos" });
    }

    if (etapa === "auditoria") {
      if (!fila.datos) throw new ErrorGeneracion("Primero hay que leer los datos de la cuenta.");
      const imagenes = await leerCapturas(db, fila.capturas);
      const auditoria = await generar(
        promptAuditoria(fila.contexto, fila.datos, imagenes.length > 0),
        ESQUEMA_AUDITORIA,
        imagenes,
      );
      await guardar({ auditoria, estado: "auditoria", error: null });
      return responder(req, { ok: true, estado: "auditoria" });
    }

    // estrategia
    if (!fila.auditoria) throw new ErrorGeneracion("Primero hay que generar la auditoría.");
    const estrategia = await generar(
      promptEstrategia(fila.contexto, resumirDatos(fila.datos), fila.auditoria),
      ESQUEMA_ESTRATEGIA,
    );
    await guardar({ estrategia, estado: "listo", error: null });
    return responder(req, { ok: true, estado: "listo" });
  } catch (e) {
    const mensaje = e instanceof ErrorGeneracion
      ? e.message
      : "Algo falló al generar el informe. Inténtalo de nuevo en unos minutos.";
    console.error("informe", etapa, informe_id, e);
    await guardar({ estado: "error", error: mensaje });
    return responder(req, { error: mensaje }, 500);
  }
});
