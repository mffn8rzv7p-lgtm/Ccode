// Cálculos del cotizador hechos en código: piso, redondeo, alertas y fechas.

export interface Fase { fase: string; horas: number; detalle: string }
export interface Paquete { nombre: string; precio: number; recomendado: boolean; incluye: string[] }
export interface Item { concepto: string; valor: number }

/** Redondea a cifras limpias: miles de 50.000 por debajo de 1 millón, de 100.000 por encima. */
export function redondearPrecio(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 0;
  const paso = v < 1_000_000 ? 50_000 : 100_000;
  return Math.ceil(v / paso) * paso;
}

export function formatoCOP(v: number): string {
  return "$" + Math.round(v).toLocaleString("es-CO").replace(/,/g, ".");
}

export interface BriefPrecio {
  tarifa_hora: number;
  margen_minimo: number; // porcentaje, ej. 25
  costos_terceros: number;
}

export function calcularPiso(fases: Fase[], brief: BriefPrecio) {
  const horas = fases.reduce((a, f) => a + Math.max(0, Math.round(f.horas)), 0);
  const trabajo = horas * brief.tarifa_hora;
  const costo = trabajo + brief.costos_terceros;
  const piso = redondearPrecio(costo * (1 + brief.margen_minimo / 100));
  return { horas_total: horas, costo_trabajo: trabajo, costo_total: costo, piso };
}

export function alertasPrecio(
  piso: number,
  recomendado: number,
  paquetes: Paquete[],
  items: Item[],
  negociacionHasta: number,
): string[] {
  const alertas: string[] = [];
  if (negociacionHasta < piso) alertas.push(`El límite de negociación (${formatoCOP(negociacionHasta)}) está por debajo del piso: no bajes de ${formatoCOP(piso)}.`);
  if (recomendado < piso) alertas.push(`El precio recomendado (${formatoCOP(recomendado)}) está por debajo del piso (${formatoCOP(piso)}).`);
  for (const p of paquetes) {
    if (p.precio < piso && p.recomendado) alertas.push(`El paquete recomendado "${p.nombre}" está por debajo del piso.`);
  }
  const totalItems = items.reduce((a, i) => a + i.valor, 0);
  if (items.length && totalItems < piso) alertas.push(`La suma de los conceptos (${formatoCOP(totalItems)}) está por debajo del piso.`);
  return alertas;
}

const FECHA = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" });

export function fechaLarga(d: Date): string {
  return FECHA.format(d);
}

export function sumarDias(d: Date, dias: number): Date {
  return new Date(d.getTime() + dias * 24 * 3600 * 1000);
}
