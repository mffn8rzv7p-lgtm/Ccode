// Función "hub-informe": genera un informe por etapas.
//   POST { informe_id, etapa: "datos" | "auditoria" | "estrategia" }
// Cada etapa guarda su resultado en la tabla `informes`; la página las llama en orden.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import { encodeBase64 } from "jsr:@std/encoding@1.0.5/base64";
import { clienteDelEquipo, responder } from "../_shared/http.ts";
import { ErrorGeneracion, generar, type Imagen } from "../_shared/claude.ts";
import { leerCuentaPublica, metaConfigurada } from "./meta.ts";
import { calcularMetricas, type Metricas } from "./metricas.ts";
import { ESQUEMA_AUDITORIA, ESQUEMA_ESTRATEGIA, promptAuditoria, promptEstrategia, SISTEMA } from "./prompts.ts";

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
    const { data, error } = await db.storage.from("hub-capturas").download(ruta);
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
      fuente: "hub-capturas",
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
  const acceso = await clienteDelEquipo(req);
  if ("respuesta" in acceso) return acceso.respuesta;
  const { db } = acceso;

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

  const { data: fila, error: errLeer } = await db.from("hub_informes").select("*").eq("id", informe_id).single<Fila>();
  if (errLeer || !fila) return responder(req, { error: "No encontré ese informe." }, 404);

  const guardar = (cambios: Record<string, unknown>) => db.from("hub_informes").update(cambios).eq("id", informe_id);

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
        SISTEMA,
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
      SISTEMA,
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
