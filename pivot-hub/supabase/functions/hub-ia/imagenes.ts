// Imágenes del moodboard: generación con IA y búsqueda de fotos de stock.
//  - IA: Cloudflare Workers AI (FLUX.1 schnell, cupo diario gratuito). Alternativa: OpenAI con IMAGENES_PROVEEDOR=openai.
//  - Fotos reales: Pixabay o Pexels (gratis, uso comercial permitido; las fotos se guardan en nuestro almacenamiento).
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

// ---------- Bancos de fotos gratuitos: Pexels o Pixabay (el que tenga clave) ----------

const fuenteFotos = (): "pexels" | "pixabay" | null =>
  Deno.env.get("PEXELS_API_KEY") ? "pexels" : Deno.env.get("PIXABAY_API_KEY") ? "pixabay" : null;

export const fotosConfiguradas = () => fuenteFotos() !== null;

export interface Foto {
  id: number;
  miniatura: string;
  grande: string;
  autor: string;
  enlace: string;
  alt: string;
  color: string | null;
  fuente: "Pexels" | "Pixabay";
}

export async function buscarFotos(consulta: string, pagina = 1): Promise<{ fotos: Foto[]; hay_mas: boolean }> {
  const fuente = fuenteFotos();
  if (!fuente) throw new ErrorGeneracion("La búsqueda de fotos no está configurada (falta la clave de Pixabay o Pexels).");
  const q = consulta.trim().slice(0, 100);
  if (!q) throw new ErrorGeneracion("Escribe qué fotos buscar.");
  const p = String(Math.max(1, Math.min(50, Math.round(pagina))));

  let resp: Response;
  if (fuente === "pexels") {
    const url = new URL("https://api.pexels.com/v1/search");
    url.search = new URLSearchParams({ query: q, per_page: "18", page: p, locale: "es-ES" }).toString();
    resp = await fetch(url, { headers: { Authorization: Deno.env.get("PEXELS_API_KEY")! } });
  } else {
    const url = new URL("https://pixabay.com/api/");
    url.search = new URLSearchParams({ key: Deno.env.get("PIXABAY_API_KEY")!, q, per_page: "18", page: p, lang: "es", image_type: "photo", safesearch: "true" }).toString();
    resp = await fetch(url);
  }
  if (resp.status === 429) throw new ErrorGeneracion("El banco de fotos limitó las búsquedas por un momento. Inténtalo en un minuto.");
  const cuerpo = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error(fuente, resp.status);
    throw new ErrorGeneracion("No se pudo buscar fotos. Inténtalo de nuevo.");
  }

  if (fuente === "pexels") {
    // deno-lint-ignore no-explicit-any
    const fotos = (cuerpo.photos ?? []).map((f: any) => ({
      id: f.id, miniatura: f.src?.medium, grande: f.src?.large2x ?? f.src?.large,
      autor: f.photographer, enlace: f.url, alt: f.alt ?? "", color: f.avg_color ?? null, fuente: "Pexels" as const,
    }));
    return { fotos, hay_mas: Boolean(cuerpo.next_page) };
  }
  // deno-lint-ignore no-explicit-any
  const fotos = (cuerpo.hits ?? []).map((f: any) => ({
    id: f.id, miniatura: f.webformatURL, grande: f.largeImageURL ?? f.webformatURL,
    autor: f.user, enlace: f.pageURL, alt: f.tags ?? "", color: null, fuente: "Pixabay" as const,
  }));
  return { fotos, hay_mas: Number(cuerpo.totalHits ?? 0) > Number(p) * 18 };
}

const HOSTS_FOTOS = ["images.pexels.com", "pixabay.com", "cdn.pixabay.com"];

/** Descarga una foto del banco (solo de sus servidores) para guardarla en el moodboard. */
export async function descargarFoto(url: string): Promise<Imagen> {
  let destino: URL;
  try { destino = new URL(url); } catch (_e) { throw new ErrorGeneracion("Dirección de foto inválida."); }
  if (destino.protocol !== "https:" || !HOSTS_FOTOS.includes(destino.hostname)) {
    throw new ErrorGeneracion("Solo se pueden agregar fotos de Pexels o Pixabay.");
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
