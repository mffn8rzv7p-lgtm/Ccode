// Instrucciones y formatos de salida del cotizador (voz comercial de Pivot).
import { entero, listaTextos, objeto, texto } from "../_shared/claude.ts";

export const SISTEMA = `Eres el agente comercial senior de Pivot Agencia (Medellín, Colombia). Pivot hace marketing digital, pauta digital, creación de contenido, gestión de redes sociales, branding y diseño web. Su voz es cercana, segura y profesional: "el giro", "tu marca necesita moverse".

Ayudas al equipo a (1) llegar al precio ideal de un proyecto y (2) escribir una carta de cotización breve y persuasiva que se envía al cliente por WhatsApp.

Reglas:
- Español de Colombia, frases cortas, beneficios antes que características, cero jerga innecesaria.
- Moneda: pesos colombianos (COP), valores enteros sin decimales. Pivot no es responsable de IVA: nunca sumes IVA.
- Nunca inventes clientes, casos de éxito, cifras de resultados ni años de experiencia de Pivot. Nada que Pivot no pueda cumplir.
- Usa la palabra "inversión", no "costo", cuando hables con el cliente.
- Nunca bajes precio sin quitar algo a cambio (alcance, pago anticipado, contrato más largo).`;

// ---------- Precio ----------

export const ESQUEMA_PRECIO = objeto({
  fases: { type: "array", items: objeto({ fase: texto, horas: entero, detalle: texto }) },
  mercado: objeto({ minimo: entero, maximo: entero, explicacion: texto }),
  valor: objeto({ explicacion: texto }),
  precio_recomendado: entero,
  razonamiento: texto,
  usar_paquetes: { type: "boolean" },
  paquetes: {
    type: "array",
    items: objeto({ nombre: texto, precio: entero, recomendado: { type: "boolean" }, incluye: listaTextos }),
  },
  items: { type: "array", items: objeto({ concepto: texto, valor: entero }) },
  negociacion: objeto({ hasta: entero, a_cambio_de: listaTextos }),
  preguntas: listaTextos,
});

export function promptPrecio(brief: unknown, contextoInforme: unknown, tarifa: { tarifa_hora: number; margen_minimo: number; costos_terceros: number }): string {
  return `Brief del proyecto:
${JSON.stringify(brief, null, 2)}

${contextoInforme ? `Este cliente ya tiene una auditoría de Instagram hecha por Pivot. Resumen:\n${JSON.stringify(contextoInforme, null, 2)}\n\n` : ""}Datos para el piso: tarifa por hora del equipo ${tarifa.tarifa_hora} COP, margen mínimo ${tarifa.margen_minimo} %, costos de terceros ${tarifa.costos_terceros} COP. El sistema calcula el piso con tus horas: (horas × tarifa + terceros) × (1 + margen).

Propón el precio en tres capas:
- fases: las fases del trabajo con horas realistas del equipo (enteros) y qué incluye cada una.
- mercado: rango de referencia en COP para este servicio en Medellín/Colombia. No tienes acceso a internet: es una estimación con tu conocimiento; dilo así en la explicación y sugiere verificarlo.
- valor: cuánto vale el resultado para el cliente (ventas, tiempo, imagen), en 2-3 frases.
- precio_recomendado y razonamiento en 2-3 líneas. Cifras limpias (terminadas en 00.000).
- usar_paquetes: true si el proyecto permite 3 paquetes (Básico / Recomendado / Premium, con nombres propios del proyecto, el Premium como ancla y exactamente uno recomendado). Si no, false: deja paquetes vacío y llena items con los conceptos de una tabla simple. Si es true, deja items vacío.
- negociacion: hasta qué valor se puede bajar y a cambio de qué.
- preguntas: lo que convendría confirmar con el cliente antes de enviar (máximo 3; vacío si no falta nada).`;
}

// ---------- Carta ----------

export const ESQUEMA_CARTA = objeto({
  saludo: texto,
  tu_reto: texto,
  nuestra_propuesta: texto,
  que_incluye: listaTextos,
  no_incluye: listaTextos,
  tiempos: texto,
  por_que_pivot: listaTextos,
  condiciones_extra: listaTextos,
  cta: texto,
  mensaje_whatsapp: texto,
});

export function promptCarta(datos: unknown): string {
  return `Escribe la carta de cotización con estos datos (los precios ya están aprobados y el sistema los pone en la carta; no los repitas en el texto):
${JSON.stringify(datos, null, 2)}

- saludo: personal, con el nombre del contacto, 1-2 frases.
- tu_reto: 1-2 frases que demuestren que entendimos su necesidad.
- nuestra_propuesta: la solución en 2-3 frases, enfocada en el resultado.
- que_incluye: entregables concretos con cantidades.
- no_incluye: 2-3 límites claros.
- tiempos: cuándo arranca y cuánto dura.
- por_que_pivot: 2-3 razones cortas, sin datos inventados.
- condiciones_extra: solo condiciones propias de este proyecto (por ejemplo, que la pauta se paga directo a la plataforma). El sistema ya agrega forma de pago, vigencia y rondas de ajustes.
- cta: llamado a la acción para responder por WhatsApp, p. ej. "Responde Aprobado a este WhatsApp y agendamos el inicio esta semana."
- mensaje_whatsapp: 3-4 líneas que el equipo envía con el PDF: saludo con nombre, una línea de valor, mención del adjunto y el siguiente paso.`;
}
