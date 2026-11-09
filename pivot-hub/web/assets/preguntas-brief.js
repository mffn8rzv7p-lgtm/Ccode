// Cuestionario del Brief de marca de Pivot (versión mejorada del documento "Brief de marca — Marketing digital").
// Lo usan la página que llena el cliente (/brief/) y la app interna de Briefs.
// tipo: "texto" (respuesta libre) · "opciones" (varias opciones + comentario) · "redes" (enlaces) · "rango" (una opción)

export const INTRO_BRIEF = "Queremos conocer tu marca desde tu propia experiencia. No necesitas saber de marketing para responder: cuéntanos las cosas de la manera más natural posible. Puedes dejar preguntas en blanco y volver después; lo que escribas se guarda solo.";

export const SECCIONES_BRIEF = [
  {
    id: "marca",
    titulo: "Sobre la marca",
    preguntas: [
      { id: "a_que_se_dedica", pregunta: "¿Cómo se llama la marca y a qué se dedica?", ayuda: "Qué hace, qué ofrece y qué encuentra una persona cuando llega a ella.", requerida: true },
      { id: "por_que_nacio", pregunta: "¿Por qué nació la marca?", ayuda: "¿Qué motivó su creación? ¿Qué necesidad, idea o propósito hay detrás?" },
      { id: "que_ofrece", pregunta: "¿Qué productos o servicios son los más importantes para el negocio?", ayuda: "Los que más venden, los que más margen dejan o los que quieren impulsar. Si quieres, incluye un rango de precios." },
      { id: "diferencia", pregunta: "¿Qué hace diferente a la marca?", ayuda: "¿Qué los distingue de otras marcas que ofrecen algo similar?" },
      { id: "recordar", pregunta: "Si alguien conoce la marca por primera vez, ¿qué te gustaría que recordara?", ayuda: "Una frase o una idea es suficiente." },
    ],
  },
  {
    id: "identidad",
    titulo: "Personalidad e identidad",
    preguntas: [
      { id: "persona", pregunta: "Si tu marca fuera una persona, ¿cómo sería?", ayuda: "¿Cómo hablaría, cómo se comportaría y qué personalidad tendría?" },
      { id: "sentir", pregunta: "¿Cómo quieres que se sientan las personas cuando tienen contacto con la marca?", ayuda: "Cuando ven su contenido, compran o hablan con ustedes." },
      { id: "elementos", pregunta: "¿Qué elementos representan visualmente a la marca?", ayuda: "Colores, estilos, imágenes, formas, lugares, texturas, palabras…" },
      { id: "no_representa", pregunta: "¿Hay algo que definitivamente NO represente a la marca?", ayuda: "Una forma de hablar, colores, estilos visuales o tipos de contenido que prefieran evitar." },
      { id: "archivos", pregunta: "¿Tienen logo, manual de marca o fotos que podamos ver?", ayuda: "Pega el enlace a una carpeta de Google Drive, Dropbox o similar.", tipo: "enlace" },
    ],
  },
  {
    id: "clientes",
    titulo: "Clientes",
    preguntas: [
      { id: "quienes_compran", pregunta: "¿Quiénes son las personas que normalmente compran o usan lo que ofrecen?", ayuda: "Cómo son, qué les interesa, qué necesitan y qué buscan.", requerida: true },
      { id: "a_quien_llegar", pregunta: "¿Hay algún tipo de persona a la que les gustaría llegar y que todavía no los conoce?" },
      { id: "necesidad", pregunta: "¿Qué problema, necesidad o deseo tiene su cliente?", ayuda: "¿Qué espera encontrar, solucionar o conseguir cuando llega a la marca?" },
      {
        id: "convence", pregunta: "¿Qué suele convencer a una persona de comprarles?", tipo: "opciones",
        opciones: ["Precio", "Calidad", "Confianza", "Recomendación", "Diseño", "Atención", "Promociones", "Rapidez", "Ubicación"],
        ayuda: "Marca las que apliquen y cuéntanos más si quieres.",
      },
      { id: "dudas", pregunta: "¿Qué dudas o preguntas suelen tener antes de comprar?", ayuda: "Las que más reciben por redes, WhatsApp, tienda o página web." },
    ],
  },
  {
    id: "competencia",
    titulo: "Competencia",
    preguntas: [
      { id: "competidores", pregunta: "¿Con qué marcas los comparan o cuáles consideran su competencia?", ayuda: "Nombres o cuentas de Instagram. ¿Qué hacen bien y qué hacen mal?" },
    ],
  },
  {
    id: "contenido",
    titulo: "Contenido y redes sociales",
    preguntas: [
      { id: "redes", pregunta: "¿Dónde podemos encontrar la marca hoy?", ayuda: "Deja en blanco las que no tengan.", tipo: "redes" },
      { id: "mostrar", pregunta: "¿Qué te gustaría que las personas conocieran de la marca?", ayuda: "Historias, productos, personas, procesos, valores o experiencias." },
      { id: "contenido_si", pregunta: "¿Qué tipo de contenido sienten que representa mejor a la marca?", ayuda: "Formatos o temas que disfruten hacer o que hayan funcionado bien." },
      { id: "contenido_no", pregunta: "¿Qué tipo de contenido NO quieren hacer?", ayuda: "Temas, formatos o estilos que no tienen nada que ver con la marca." },
      { id: "referencias", pregunta: "¿Qué marcas, cuentas o personas les gustan como referencia?", ayuda: "No tienen que ser de la misma categoría. ¿Qué admiras de su comunicación?" },
    ],
  },
  {
    id: "objetivos",
    titulo: "Objetivos y publicidad",
    preguntas: [
      { id: "hoy", pregunta: "¿Qué están haciendo hoy para darse a conocer y conseguir clientes?", ayuda: "Canales, tipo de contenido, si han hecho publicidad y qué creen que ha funcionado o no." },
      { id: "exito", pregunta: "Pensando en los próximos 6 a 12 meses, ¿qué tendría que pasar para decir \"la estrategia funcionó\"?", requerida: true },
      { id: "fechas", pregunta: "¿Hay fechas importantes que debamos tener en cuenta?", ayuda: "Temporadas altas, lanzamientos, eventos, aniversarios." },
      {
        id: "presupuesto", pregunta: "¿Cuánto podrían invertir al mes en publicidad pagada (aparte de nuestros servicios)?", tipo: "rango",
        opciones: ["Todavía no sé", "Menos de $500.000", "$500.000 a $1.500.000", "$1.500.000 a $3.000.000", "Más de $3.000.000"],
      },
      { id: "aprobacion", pregunta: "¿Quién aprueba el contenido y cómo prefieren comunicarse con nosotros?", ayuda: "Nombre de la persona y canal: WhatsApp, correo, reuniones…" },
    ],
  },
];

export const REDES_BRIEF = [
  ["instagram", "Instagram"], ["tiktok", "TikTok"], ["facebook", "Facebook"],
  ["web", "Página web"], ["whatsapp", "WhatsApp de ventas"], ["otra", "Otra"],
];

/** Convierte respuestas { id: valor } en una lista legible para la IA y para mostrar. */
export function cuestionarioLegible(valores = {}) {
  const lista = [];
  for (const s of SECCIONES_BRIEF) {
    for (const p of s.preguntas) {
      const v = valores[p.id];
      let texto = "";
      if (p.tipo === "opciones") texto = [...(v?.elegidas ?? []), v?.comentario].filter(Boolean).join(" · ");
      else if (p.tipo === "redes") texto = REDES_BRIEF.filter(([k]) => v?.[k]).map(([k, n]) => `${n}: ${v[k]}`).join(" · ");
      else texto = String(v ?? "").trim();
      if (texto) lista.push({ seccion: s.titulo, pregunta: p.pregunta, respuesta: texto });
    }
  }
  return lista;
}

/** Cuántas preguntas tienen respuesta. */
export function avanceBrief(valores = {}) {
  const total = SECCIONES_BRIEF.reduce((a, s) => a + s.preguntas.length, 0);
  return { respondidas: cuestionarioLegible(valores).length, total };
}
