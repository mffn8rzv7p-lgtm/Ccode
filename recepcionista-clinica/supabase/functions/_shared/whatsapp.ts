// Envíos a la API de Cloud de WhatsApp (Meta).
import { env } from "./env.ts";
import type { BotonWhatsApp } from "./mensaje.ts";

const GRAPH = "https://graph.facebook.com/v23.0";

async function graph(ruta: string, cuerpo: unknown): Promise<unknown> {
  const r = await fetch(`${GRAPH}/${ruta}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`WhatsApp ${r.status}: ${JSON.stringify(datos)}`);
  return datos;
}

const enviar = (telefono: string, mensaje: Record<string, unknown>) =>
  graph(`${env("WHATSAPP_PHONE_NUMBER_ID")}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: telefono,
    ...mensaje,
  });

export const enviarTexto = (telefono: string, texto: string) =>
  enviar(telefono, { type: "text", text: { body: texto } });

export const enviarBotones = (telefono: string, texto: string, botones: BotonWhatsApp[]) =>
  enviar(telefono, { type: "interactive", interactive: { type: "button", body: { text: texto }, action: { buttons: botones } } });

export const enviarUbicacion = (telefono: string, lat: number, lng: number, nombre: string, direccion: string) =>
  enviar(telefono, { type: "location", location: { latitude: lat, longitude: lng, name: nombre, address: direccion } });

export const enviarPlantilla = (telefono: string, plantilla: string, idioma: string, parametros: string[]) =>
  enviar(telefono, {
    type: "template",
    template: {
      name: plantilla,
      language: { code: idioma },
      components: [{ type: "body", parameters: parametros.map((text) => ({ type: "text", text })) }],
    },
  });

/** Marca el mensaje como leído (los dos chulitos azules). */
export const marcarLeido = (mensajeId: string) =>
  graph(`${env("WHATSAPP_PHONE_NUMBER_ID")}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: mensajeId,
  });

/** Descarga una nota de voz: primero se pide la URL temporal y luego el archivo, ambos con el token. */
export async function descargarMedia(mediaId: string): Promise<{ datos: Blob; tipo: string }> {
  const auth = { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}` };
  const info = await fetch(`${GRAPH}/${mediaId}`, { headers: auth });
  if (!info.ok) throw new Error(`No se pudo obtener el audio ${mediaId}: ${info.status}`);
  const { url, mime_type } = await info.json();
  const archivo = await fetch(url, { headers: auth });
  if (!archivo.ok) throw new Error(`No se pudo descargar el audio: ${archivo.status}`);
  return { datos: await archivo.blob(), tipo: mime_type ?? "audio/ogg" };
}
