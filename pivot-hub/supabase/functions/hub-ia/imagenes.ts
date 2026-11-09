// Imágenes del moodboard: generación con IA y búsqueda de fotos de stock.
//  - IA: Cloudflare Workers AI (FLUX.1 schnell, cupo diario gratuito). Alternativa: OpenAI con IMAGENES_PROVEEDOR=openai.
//  - Fotos reales: Pexels (gratis, uso comercial permitido).
import { decodeBase64 } from "jsr:@std/encoding@1.0.5/base64";
import { ErrorGeneracion } from "../_shared/claude.ts";

export interface Imagen { bytes: Uint8Array; tipo: string; extension: string }

const proveedor = () => (Deno.env.get("IMAGENES_PROVEEDOR") ?? "cloudflare").toLowerCase();

export function imagenesConfiguradas(): boolean {
  if (proveedor() === "openai") return Boolean(Deno.env.get("OPENAI_API_KEY"));
  return Boolean(Deno.env.get("CLOUDFLARE_ACCOUNT_ID") && Deno.env.get("CLOUDFLARE_API_TOKEN"));
}

export async function generarImagen(prompt: string): Promise<Imagen> {
  if (!imagenesConfiguradas()) {
    throw new ErrorGeneracion("La generación de imágenes no está configurada (faltan las claves de Cloudflare).");
  }
  return proveedor() === "openai" ? await conOpenAI(prompt) : await conCloudflare(prompt);
}

async function conCloudflare(prompt: string): Promise<Imagen> {
  const cuenta = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
  const modelo = Deno.env.get("IMAGENES_MODELO") ?? "@cf/black-forest-labs/flux-1-schnell";
  const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cuenta}/ai/run/${modelo}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("CLOUDFLARE_API_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, steps: 4 }),
  });
  const cuerpo = await resp.json().catch(() => ({}));
  const b64 = cuerpo?.result?.image;
  if (!resp.ok || !b64) {
    console.error("cloudflare", resp.status, JSON.stringify(cuerpo?.errors ?? cuerpo).slice(0, 300));
    if (resp.status === 429 || /neuron|limit|quota/i.test(JSON.stringify(cuerpo?.errors ?? ""))) {
      throw new ErrorGeneracion("Se acabó el cupo gratuito de imágenes de hoy. Mañana se renueva; mientras tanto busca fotos o sube las tuyas.");
    }
    throw new ErrorGeneracion("No se pudo generar la imagen. Inténtalo de nuevo o prueba con otra descripción.");
  }
  return { bytes: decodeBase64(b64), tipo: "image/jpeg", extension: "jpg" };
}

async function conOpenAI(prompt: string): Promise<Imagen> {
  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: Deno.env.get("IMAGENES_MODELO") ?? "gpt-image-1", prompt, size: "1024x1024", n: 1 }),
  });
  const cuerpo = await resp.json().catch(() => ({}));
  const b64 = cuerpo?.data?.[0]?.b64_json;
  if (!resp.ok || !b64) {
    console.error("openai", resp.status, cuerpo?.error?.message);
    throw new ErrorGeneracion(resp.status === 400 ? "El proveedor rechazó esa descripción. Prueba con otra." : "No se pudo generar la imagen. Inténtalo de nuevo.");
  }
  return { bytes: decodeBase64(b64), tipo: "image/png", extension: "png" };
}

// ---------- Pexels ----------

export const pexelsConfigurado = () => Boolean(Deno.env.get("PEXELS_API_KEY"));

export interface FotoPexels {
  id: number;
  miniatura: string;
  grande: string;
  autor: string;
  autor_url: string;
  enlace: string;
  alt: string;
  color: string | null;
}

export async function buscarFotos(consulta: string, pagina = 1): Promise<{ fotos: FotoPexels[]; hay_mas: boolean }> {
  if (!pexelsConfigurado()) throw new ErrorGeneracion("La búsqueda de fotos no está configurada (falta la clave de Pexels).");
  const q = consulta.trim().slice(0, 100);
  if (!q) throw new ErrorGeneracion("Escribe qué fotos buscar.");
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", q);
  url.searchParams.set("per_page", "18");
  url.searchParams.set("page", String(Math.max(1, Math.min(50, Math.round(pagina)))));
  url.searchParams.set("locale", "es-ES");
  const resp = await fetch(url, { headers: { Authorization: Deno.env.get("PEXELS_API_KEY")! } });
  if (resp.status === 429) throw new ErrorGeneracion("Pexels limitó las búsquedas por esta hora. Inténtalo más tarde.");
  const cuerpo = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("pexels", resp.status);
    throw new ErrorGeneracion("No se pudo buscar en Pexels. Inténtalo de nuevo.");
  }
  // deno-lint-ignore no-explicit-any
  const fotos = (cuerpo.photos ?? []).map((f: any) => ({
    id: f.id,
    miniatura: f.src?.medium,
    grande: f.src?.large2x ?? f.src?.large,
    autor: f.photographer,
    autor_url: f.photographer_url,
    enlace: f.url,
    alt: f.alt ?? "",
    color: f.avg_color ?? null,
  }));
  return { fotos, hay_mas: Boolean(cuerpo.next_page) };
}

/** Descarga una foto de Pexels (solo de su servidor de imágenes) para guardarla en el moodboard. */
export async function descargarFotoPexels(url: string): Promise<Imagen> {
  let destino: URL;
  try { destino = new URL(url); } catch (_e) { throw new ErrorGeneracion("Dirección de foto inválida."); }
  if (destino.protocol !== "https:" || destino.hostname !== "images.pexels.com") {
    throw new ErrorGeneracion("Solo se pueden agregar fotos de Pexels.");
  }
  const resp = await fetch(destino);
  const tipo = resp.headers.get("content-type")?.split(";")[0] ?? "";
  if (!resp.ok || !["image/jpeg", "image/png", "image/webp"].includes(tipo)) {
    throw new ErrorGeneracion("No se pudo descargar la foto. Prueba con otra.");
  }
  const bytes = new Uint8Array(await resp.arrayBuffer());
  if (bytes.length > 10 * 1024 * 1024) throw new ErrorGeneracion("La foto es demasiado grande.");
  return { bytes, tipo, extension: tipo.split("/")[1].replace("jpeg", "jpg") };
}
