// Instrucciones y formatos de salida de Briefs, Parrillas y Moodboards.
import { entero, listaTextos, objeto, texto } from "../_shared/claude.ts";

export const SISTEMA = `Eres el director de estrategia y el director creativo de Pivot Agencia (Medellín, Colombia): marketing digital, pauta, contenido, redes sociales, branding y diseño web. Voz cercana, segura y directa.

Reglas:
- Español de Colombia, claro, sin jerga ni relleno.
- No inventes datos del cliente (cifras, nombres, fechas, presupuestos). Si algo no está en lo que te dieron, déjalo vacío o conviértelo en una pregunta pendiente.
- Sé concreto y accionable: cada punto debe poder usarse tal cual por el equipo.`;

// ---------- Brief ----------

export const ESQUEMA_BRIEF = objeto({
  resumen: texto,
  frase_creativa: texto,
  contexto: texto,
  objetivos: objeto({ negocio: texto, comunicacion: texto, indicadores: listaTextos }),
  publico: objeto({ descripcion: texto, insight: texto, accion_esperada: texto }),
  mensaje: objeto({ principal: texto, razones_para_creer: listaTextos, tono: texto }),
  entregables: { type: "array", items: objeto({ pieza: texto, cantidad: texto, formato: texto, canal: texto }) },
  marca: objeto({ lineamientos: texto, referencias: listaTextos, competencia: listaTextos }),
  mandatorios: listaTextos,
  restricciones: listaTextos,
  cronograma: { type: "array", items: objeto({ hito: texto, fecha: texto }) },
  presupuesto: texto,
  aprobaciones: objeto({ quien_aprueba: texto, rondas: texto }),
  preguntas_pendientes: listaTextos,
  riesgos: listaTextos,
});

export function promptBrief(fila: { cliente: string; proyecto: string; respuestas: Record<string, unknown> }): string {
  const { cuestionario: _ids, ...datos } = fila.respuestas ?? {};
  return `Cliente: ${fila.cliente}
Proyecto: ${fila.proyecto}

Información disponible. "respuestas_del_cliente" es lo que el cliente respondió en el Brief de marca de Pivot (con sus palabras); "respuestas_del_equipo", "notas" e "internos" son lo que anotó el equipo de Pivot (puede venir de una reunión). Si se contradicen, prioriza al cliente y menciónalo en preguntas_pendientes:
${JSON.stringify(datos, null, 2)}

Convierte esto en un brief profesional y accionable para el equipo creativo y de medios:
- resumen: 3-4 frases que cualquiera del equipo entienda en 30 segundos.
- frase_creativa: la idea única que debe comunicar todo (una sola frase, sin comas de relleno).
- objetivos.indicadores: métricas concretas para saber si funcionó (sin inventar cifras: si no hay meta numérica, dilo como "definir meta de…").
- publico.insight: la verdad del público que hace que el mensaje conecte.
- entregables: cada pieza con cantidad, formato y canal.
- preguntas_pendientes: lo que falta preguntarle al cliente antes de arrancar.
- riesgos: lo que podría salir mal y cómo evitarlo.
Deja en texto vacío o lista vacía lo que no se pueda saber.`;
}

// ---------- Parrilla ----------

export const ESQUEMA_PARRILLA = objeto({
  publicaciones: {
    type: "array",
    items: objeto({
      fecha: texto, // YYYY-MM-DD
      hora: texto, // HH:MM
      red: { type: "string", enum: ["instagram", "tiktok", "facebook", "linkedin", "youtube", "x"] },
      formato: { type: "string", enum: ["Reel", "Carrusel", "Foto", "Historia", "Video", "Texto", "En vivo"] },
      pilar: texto,
      titulo: texto,
      copy: texto,
      hashtags: listaTextos,
      idea_visual: texto,
    }),
  },
});

export function promptParrilla(datos: unknown): string {
  return `Arma la parrilla de contenido del mes con estos datos:
${JSON.stringify(datos, null, 2)}

- Una entrada por publicación, con fecha dentro del mes (formato AAAA-MM-DD) y hora (HH:MM, 24 h) en horario de Colombia.
- Respeta la frecuencia por red; reparte las publicaciones en la semana sin amontonarlas y evita repetir el mismo formato varios días seguidos.
- Usa los pilares dados (si no hay, propón 3-4 coherentes con el objetivo) y equilibra su peso.
- Incluye fechas especiales de Colombia del mes solo si encajan con la marca.
- titulo: nombre corto interno de la pieza. copy: el texto listo para publicar, con llamado a la acción. idea_visual: qué se ve (guion corto si es video). 3-5 hashtags específicos.
- No pongas precios ni promociones que no estén en los datos.`;
}

// ---------- Moodboard ----------

export const ESQUEMA_MOODBOARD = objeto({
  concepto: texto,
  palabras_clave: listaTextos,
  colores: { type: "array", items: objeto({ nombre: texto, hex: texto, uso: texto }) },
  tipografias: { type: "array", items: objeto({ familia: texto, uso: texto, por_que: texto }) },
  estilos: { type: "array", items: objeto({ nombre: texto, descripcion: texto }) },
  imagenes: { type: "array", items: objeto({ prompt: texto, para: texto }) },
});

export function promptMoodboard(datos: unknown): string {
  return `Propón la dirección visual (moodboard) con estos datos:
${JSON.stringify(datos, null, 2)}

- concepto: la idea visual en 2-3 frases.
- palabras_clave: 5-7 palabras que describan la sensación.
- colores: 5-6 colores con nombre evocador, hex (#RRGGBB) y uso (fondo, acento, texto…). Si ya hay colores de marca en los datos, respétalos y complétalos.
- tipografias: 2-3 familias que existan en Google Fonts (nombre exacto), con su uso (títulos, textos, detalles) y por qué.
- estilos: 4-5 estilos gráficos concretos (tipo de fotografía, ilustración, texturas, composición, tratamiento de color).
- imagenes: exactamente 6 descripciones para generar imágenes de referencia, en inglés, detalladas (sujeto, luz, encuadre, paleta, textura), sin texto ni logos dentro de la imagen; "para" dice en español qué referencia aporta.`;
}
