// Generación de la auditoría y la propuesta estratégica con la API de Claude.
import Anthropic from "npm:@anthropic-ai/sdk@1.6.0";

export const MODELO = "claude-opus-5-5";

export interface Imagen {
  media_type: "image/jpeg" | "image/png" | "image/webp";
  data: string; // base64
}

// ---------- Formatos de salida (JSON Schema) ----------

const texto = { type: "string" } as const;
const listaTextos = { type: "array", items: texto } as const;

function objeto(propiedades: Record<string, unknown>) {
  return {
    type: "object",
    properties: propiedades,
    required: Object.keys(propiedades),
    additionalProperties: false,
  };
}

const hallazgo = objeto({ titulo: texto, detalle: texto, evidencia: texto });

export const ESQUEMA_AUDITORIA = objeto({
  resumen: texto,
  accion_principal: texto,
  salud: objeto({ comunidad: texto, interaccion: texto, constancia: texto, formatos: texto }),
  puntuaciones: {
    type: "array",
    items: objeto({ area: texto, nota: { type: "integer" }, porque: texto }),
  },
  que_funciona: { type: "array", items: hallazgo },
  que_no_funciona: { type: "array", items: hallazgo },
  perfil: objeto({
    diagnostico: texto,
    biografias_propuestas: listaTextos,
    recomendaciones: listaTextos,
  }),
  competencia: {
    type: "array",
    items: objeto({ cuenta: texto, que_les_funciona: texto, oportunidad: texto }),
  },
  acciones_prioritarias: {
    type: "array",
    items: objeto({ accion: texto, porque: texto }),
  },
  limites: listaTextos,
});

export const ESQUEMA_ESTRATEGIA = objeto({
  titulo: texto,
  la_oportunidad: texto,
  objetivo: texto,
  pilares: {
    type: "array",
    items: objeto({ nombre: texto, porcentaje: { type: "integer" }, descripcion: texto }),
  },
  ideas: {
    type: "array",
    items: objeto({
      titulo: texto,
      formato: { type: "string", enum: ["Reel", "Carrusel", "Historia", "Foto"] },
      pilar: texto,
      objetivo: { type: "string", enum: ["Alcance", "Confianza", "Venta"] },
      gancho: texto,
      desarrollo: listaTextos,
      llamado_a_la_accion: texto,
      texto_publicacion: texto,
      hashtags: listaTextos,
      por_que: texto,
      dificultad: { type: "string", enum: ["Fácil", "Media", "Alta"] },
    }),
  },
  calendario: {
    type: "array",
    items: objeto({ semana: { type: "integer" }, dia: texto, formato: texto, idea: texto }),
  },
  servicios_recomendados: {
    type: "array",
    items: objeto({ servicio: texto, que_incluye: listaTextos, por_que: texto }),
  },
  indicadores: {
    type: "array",
    items: objeto({ indicador: texto, hoy: texto, meta_90_dias: texto }),
  },
  siguiente_paso: texto,
});

// ---------- Instrucciones ----------

const SISTEMA = `Eres el estratega senior de redes sociales de Pivot Agencia (Medellín, Colombia). Pivot hace marketing digital, pauta digital, creación de contenido, redes sociales, branding y diseño web. Su voz es cercana, segura y directa: "tu marca necesita moverse", "el giro".

Preparas informes que el equipo comercial de Pivot muestra a un cliente potencial antes de cotizar. Deben demostrar que entendimos su cuenta y dejarle ganas de trabajar con Pivot.

Reglas:
- Escribe en español de Colombia, claro y sin jerga. Si usas un término técnico, explícalo en la misma frase.
- Cada número que menciones debe salir de los datos entregados (métricas calculadas o capturas). Nunca inventes cifras, clientes, casos de éxito ni años de experiencia de Pivot.
- Los datos públicos no muestran alcance, guardados, compartidos, visitas al perfil ni datos del público. Cuando una conclusión dependa de eso, dilo como suposición.
- La interacción es (me gusta + comentarios) ÷ seguidores × 100. Explícala en palabras simples ("de cada 100 seguidores, X reaccionan").
- Sé concreto: cada recomendación dice qué hacer y en qué dato se basa. Prohibidos los consejos genéricos ("publica con constancia", "usa hashtags relevantes") sin el cómo.
- No menciones precios ni valores en pesos.
- Habla al cliente de tú, con respeto, sin exagerar ni prometer resultados garantizados.`;

function bloqueContexto(contexto: Record<string, unknown>): string {
  return `Contexto del negocio (lo escribió el equipo de Pivot):\n${JSON.stringify(contexto, null, 2)}`;
}

export function promptAuditoria(contexto: Record<string, unknown>, datos: unknown, hayCapturas: boolean): string {
  return `${bloqueContexto(contexto)}

Datos públicos de Instagram (calculados por el sistema; los números son exactos):
${JSON.stringify(datos, null, 2)}

${hayCapturas ? "También van capturas de pantalla de la cuenta. Úsalas para lo que los datos no traen (destacadas, estética de la cuadrícula, reproducciones de reels, comentarios) y cita solo números que se lean con claridad.\n\n" : ""}Escribe la auditoría de la cuenta principal:
- resumen: 3 frases sobre cómo está la cuenta.
- accion_principal: la única cosa que más cambiaría sus resultados.
- salud: una o dos frases por tema, con números.
- puntuaciones: exactamente estas 6 áreas, nota de 1 a 10: Perfil, Constancia, Ganchos, Variedad de formatos, Conversación con la comunidad, Llamado a la venta.
- que_funciona y que_no_funciona: 3 a 5 hallazgos cada uno, con la evidencia (publicación, fecha o número).
- perfil: diagnóstico de nombre, biografía, enlace y destacadas; 2 biografías propuestas (máximo 150 caracteres cada una); recomendaciones.
- competencia: una entrada por competidor con datos; vacía si no hay.
- acciones_prioritarias: 3 acciones para las próximas 2 semanas.
- limites: qué no se pudo ver o medir en este análisis.`;
}

export function promptEstrategia(contexto: Record<string, unknown>, datosResumidos: unknown, auditoria: unknown): string {
  return `${bloqueContexto(contexto)}

Resumen de datos públicos:
${JSON.stringify(datosResumidos, null, 2)}

Auditoría ya entregada:
${JSON.stringify(auditoria, null, 2)}

Escribe la propuesta estratégica de Pivot para los próximos 90 días:
- titulo: nombre corto de la propuesta (máximo 7 palabras).
- la_oportunidad: 2-3 frases con el hueco que vemos (en su cuenta y frente a la competencia).
- objetivo: el objetivo de 90 días, medible con datos públicos.
- pilares: 3 o 4 temas fijos; los porcentajes suman 100.
- ideas: exactamente 8 ideas listas para producir, mezclando formatos según lo que mejor le funciona y lo que puede producir. El gancho es la primera frase o texto de los primeros 2 segundos. desarrollo es el guion por escenas (reel) o lámina por lámina (carrusel). texto_publicacion listo para copiar. 3 a 5 hashtags específicos. por_que cita un dato de la auditoría.
- calendario: 2 semanas usando las ideas, con una frecuencia que el negocio pueda sostener; usa los días con mejor interacción si hay datos.
- servicios_recomendados: 2 a 4 servicios de Pivot que harían realidad este plan (por ejemplo gestión de redes, producción de contenido, pauta digital, branding, diseño web), cada uno con lo que incluye y por qué. Sin precios.
- indicadores: 3 o 4 indicadores con su valor de hoy (de los datos) y la meta a 90 días.
- siguiente_paso: invitación concreta a cotizar con Pivot.`;
}

// ---------- Llamada ----------

export class ErrorGeneracion extends Error {}

export async function generar(
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
    system: SISTEMA,
    messages: [{ role: "user", content: contenido }],
  });
  const respuesta = await stream.finalMessage();

  if (respuesta.stop_reason === "refusal") {
    throw new ErrorGeneracion("El modelo no pudo generar este informe. Revisa el contexto e inténtalo de nuevo.");
  }
  if (respuesta.stop_reason === "max_tokens") {
    throw new ErrorGeneracion("El informe quedó incompleto por su longitud. Inténtalo de nuevo.");
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
