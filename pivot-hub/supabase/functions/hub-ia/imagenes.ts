// Generación de imágenes para el botón mágico del moodboard.
// Proveedor por defecto: OpenAI (gpt-image-1). Se cambia con IMAGENES_PROVEEDOR si se agrega otro.
import { decodeBase64 } from "jsr:@std/encoding@1.0.5/base64";
import { ErrorGeneracion } from "../_shared/claude.ts";

export function imagenesConfiguradas(): boolean {
  return (Deno.env.get("IMAGENES_PROVEEDOR") ?? "openai") === "openai" && Boolean(Deno.env.get("OPENAI_API_KEY"));
}

export async function generarImagen(prompt: string): Promise<Uint8Array> {
  if (!imagenesConfiguradas()) {
    throw new ErrorGeneracion("La generación de imágenes no está configurada (falta la clave del proveedor de imágenes).");
  }
  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("IMAGENES_MODELO") ?? "gpt-image-1",
      prompt,
      size: "1024x1024",
      n: 1,
    }),
  });
  const cuerpo = await resp.json().catch(() => ({}));
  const b64 = cuerpo?.data?.[0]?.b64_json;
  if (!resp.ok || !b64) {
    console.error("imagenes", resp.status, cuerpo?.error?.message);
    throw new ErrorGeneracion(
      resp.status === 400 ? "El proveedor rechazó esa descripción. Prueba con otra." : "No se pudo generar la imagen. Inténtalo de nuevo.",
    );
  }
  return decodeBase64(b64);
}
