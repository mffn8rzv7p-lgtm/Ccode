// Función "hub-ia": IA de Briefs, Parrillas y Moodboards.
//   POST { accion: "brief_mejorar", brief_id }
//   POST { accion: "parrilla_generar", parrilla_id, frecuencia: { instagram: 3, ... }, reemplazar?: boolean }
//   POST { accion: "moodboard_autofill", moodboard_id, descripcion? }
//   POST { accion: "moodboard_imagen", moodboard_id, prompt }  → { ruta } (la página la agrega al moodboard)
import { clienteDelEquipo, responder } from "../_shared/http.ts";
import { ErrorGeneracion, generar } from "../_shared/claude.ts";
import { generarImagen, imagenesConfiguradas } from "./imagenes.ts";
import {
  ESQUEMA_BRIEF,
  ESQUEMA_MOODBOARD,
  ESQUEMA_PARRILLA,
  promptBrief,
  promptMoodboard,
  promptParrilla,
  SISTEMA,
} from "./prompts.ts";

type Cuerpo = {
  accion?: string;
  brief_id?: string;
  parrilla_id?: string;
  moodboard_id?: string;
  frecuencia?: Record<string, number>;
  reemplazar?: boolean;
  descripcion?: string;
  prompt?: string;
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

Deno.serve(async (req) => {
  const acceso = await clienteDelEquipo(req);
  if ("respuesta" in acceso) return acceso.respuesta;
  const { db } = acceso;

  let c: Cuerpo;
  try {
    c = await req.json();
  } catch (_e) {
    return responder(req, { error: "Solicitud inválida." }, 400);
  }

  try {
    // ---------- Brief ----------
    if (c.accion === "brief_mejorar") {
      const { data: fila } = await db.from("hub_briefs").select("id, cliente, proyecto, respuestas").eq("id", c.brief_id).single();
      if (!fila) return responder(req, { error: "No encontré ese brief." }, 404);
      const documento = await generar(SISTEMA, promptBrief(fila), ESQUEMA_BRIEF);
      const { error } = await db.from("hub_briefs").update({ documento, estado: "listo" }).eq("id", fila.id);
      if (error) throw error;
      return responder(req, { ok: true });
    }

    // ---------- Parrilla ----------
    if (c.accion === "parrilla_generar") {
      const { data: p } = await db.from("hub_parrillas").select("*").eq("id", c.parrilla_id).single();
      if (!p) return responder(req, { error: "No encontré esa parrilla." }, 404);
      const frecuencia = Object.fromEntries(
        Object.entries(c.frecuencia ?? {}).filter(([red, n]) => p.redes.includes(red) && Number(n) > 0)
          .map(([red, n]) => [red, Math.min(31, Math.round(Number(n)))]),
      );
      if (!Object.keys(frecuencia).length) throw new ErrorGeneracion("Indica cuántas publicaciones por semana va en cada red.");

      let brief = null;
      if (p.brief_id) {
        const { data } = await db.from("hub_briefs").select("documento").eq("id", p.brief_id).single();
        brief = data?.documento ?? null;
      }
      const mes = String(p.mes).slice(0, 7); // AAAA-MM
      const resultado = await generar(SISTEMA, promptParrilla({
        cliente: p.cliente,
        mes,
        publicaciones_por_semana_por_red: frecuencia,
        pilares: p.pilares,
        objetivo: p.objetivo,
        notas: p.notas,
        brief,
      }), ESQUEMA_PARRILLA) as { publicaciones: Record<string, unknown>[] };

      const filas = resultado.publicaciones
        .filter((x) => FECHA.test(String(x.fecha)) && String(x.fecha).startsWith(mes) && p.redes.includes(String(x.red)))
        .map((x, i) => ({
          parrilla_id: p.id,
          fecha: x.fecha,
          hora: HORA.test(String(x.hora)) ? x.hora : null,
          red: x.red,
          formato: x.formato,
          pilar: x.pilar,
          titulo: x.titulo,
          copy: x.copy,
          hashtags: (x.hashtags as string[]).map((h) => (h.startsWith("#") ? h : `#${h}`)),
          idea_visual: x.idea_visual,
          orden: i,
        }));
      if (!filas.length) throw new ErrorGeneracion("No salieron publicaciones válidas para ese mes. Inténtalo de nuevo.");
      if (c.reemplazar) await db.from("hub_publicaciones").delete().eq("parrilla_id", p.id).eq("estado", "idea");
      const { error } = await db.from("hub_publicaciones").insert(filas);
      if (error) throw error;
      return responder(req, { ok: true, creadas: filas.length });
    }

    // ---------- Moodboard ----------
    if (c.accion === "moodboard_autofill") {
      const { data: m } = await db.from("hub_moodboards").select("*").eq("id", c.moodboard_id).single();
      if (!m) return responder(req, { error: "No encontré ese moodboard." }, 404);
      let brief = null;
      if (m.brief_id) {
        const { data } = await db.from("hub_briefs").select("documento").eq("id", m.brief_id).single();
        brief = data?.documento ?? null;
      }
      const actual = m.datos ?? {};
      const propuesta = await generar(SISTEMA, promptMoodboard({
        cliente: m.cliente,
        nombre: m.nombre,
        descripcion: c.descripcion ?? actual.descripcion ?? "",
        colores_existentes: actual.colores ?? [],
        brief,
      }), ESQUEMA_MOODBOARD) as Record<string, unknown> & { colores: { hex: string }[] };

      propuesta.colores = propuesta.colores.filter((x) => HEX.test(x.hex)).map((x) => ({ ...x, hex: x.hex.toUpperCase() }));
      const datos = {
        ...actual,
        ...propuesta,
        descripcion: c.descripcion ?? actual.descripcion ?? "",
        imagenes: actual.imagenes ?? [], // las imágenes subidas se conservan
        prompts_sugeridos: propuesta.imagenes,
        imagenes_ia_disponibles: imagenesConfiguradas(),
      };
      const { error } = await db.from("hub_moodboards").update({ datos }).eq("id", m.id);
      if (error) throw error;
      return responder(req, { ok: true, imagenes_ia_disponibles: imagenesConfiguradas() });
    }

    if (c.accion === "moodboard_imagen") {
      const prompt = String(c.prompt ?? "").trim().slice(0, 2000);
      if (!c.moodboard_id || !prompt) return responder(req, { error: "Falta el moodboard o la descripción." }, 400);
      const { data: m } = await db.from("hub_moodboards").select("id").eq("id", c.moodboard_id).single();
      if (!m) return responder(req, { error: "No encontré ese moodboard." }, 404);
      const bytes = await generarImagen(prompt);
      const ruta = `${m.id}/ia-${crypto.randomUUID()}.png`;
      const { error } = await db.storage.from("hub-moodboards").upload(ruta, bytes, { contentType: "image/png" });
      if (error) throw error;
      return responder(req, { ok: true, ruta });
    }

    return responder(req, { error: "Acción desconocida." }, 400);
  } catch (e) {
    const mensaje = e instanceof ErrorGeneracion ? e.message : "Algo falló con la IA. Inténtalo de nuevo en unos minutos.";
    console.error("hub-ia", c.accion, e);
    return responder(req, { error: mensaje }, 500);
  }
});
