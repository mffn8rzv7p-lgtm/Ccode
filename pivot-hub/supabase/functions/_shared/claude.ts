// Llamada a la API de Claude compartida por todas las herramientas del hub.
import Anthropic from "npm:@anthropic-ai/sdk@1.6.0";

export const MODELO = "claude-opus-5-5";

export const texto = { type: "string" } as const;
export const entero = { type: "integer" } as const;
export const listaTextos = { type: "array", items: texto } as const;

/** Objeto JSON Schema estricto: todas las propiedades obligatorias y ninguna extra. */
export function objeto(propiedades: Record<string, unknown>) {
  return {
    type: "object",
    properties: propiedades,
    required: Object.keys(propiedades),
    additionalProperties: false,
  };
}

export interface Imagen {
  media_type: "image/jpeg" | "image/png" | "image/webp";
  data: string; // base64
}

// ---------- Llamada ----------

export class ErrorGeneracion extends Error {}

export async function generar(
  sistema: string,
  prompt: string,
  esquema: Record<string, unknown>,
  imagenes: Imagen[] = [],
): Promise<unknown> {
  const client = new Anthropic(); // lee ANTHROPIC_API_KEY

  const contenido: Anthropic.Beta.BetaContentBlockParam[] = [
    ...imagenes.map((img) => ({
      type: "image" as const,
      source: { type: "base64" as const, media_type: img.media_type, data: img.data },
    })),
    { type: "text", text: prompt },
  ];

  const stream = client.beta.messages.stream({
    model: MODELO,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema: esquema } },
    system: sistema,
    messages: [{ role: "user", content: contenido }],
  });
  const respuesta = await stream.finalMessage();

  if (respuesta.stop_reason === "refusal") {
    throw new ErrorGeneracion("El modelo no pudo generar este contenido. Revisa los datos e inténtalo de nuevo.");
  }
  if (respuesta.stop_reason === "max_tokens") {
    throw new ErrorGeneracion("La respuesta quedó incompleta por su longitud. Inténtalo de nuevo.");
  }

  const json = respuesta.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  try {
    return JSON.parse(json);
  } catch (_e) {
    throw new ErrorGeneracion("La respuesta del modelo no llegó en el formato esperado. Inténtalo de nuevo.");
  }
}
