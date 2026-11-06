// @deno-types="npm:@types/luxon@3.7.1"
import { DateTime, Interval } from "npm:luxon@3.7.2";
import type { Franja } from "./config.ts";

export { DateTime };

export interface Ocupado {
  start: string;
  end: string;
}

export interface ReglasAgenda {
  zonaHoraria: string;
  duracionCitaMin: number;
  margenMinimoMin: number;
  horario: Record<number, Franja[]>;
  diasCerrados: string[];
}

/** Lee una fecha ISO 8601 conservando su zona; si no trae zona, la toma como hora de la clínica. */
export function leerFecha(iso: string, zona: string): DateTime {
  return DateTime.fromISO(iso, { setZone: true, zone: zona });
}

/**
 * Horarios libres de `duracionCitaMin` dentro del horario de atención, entre `desde` y `hasta`,
 * que no choquen con lo ocupado, no estén en un día cerrado y empiecen después de ahora + margen.
 */
export function horariosLibres(
  desde: DateTime,
  hasta: DateTime,
  ocupados: Ocupado[],
  ahora: DateTime,
  reglas: ReglasAgenda,
): DateTime[] {
  const z = reglas.zonaHoraria;
  const minimo = ahora.plus({ minutes: reglas.margenMinimoMin });
  const bloqueos = ocupados
    .map((o) => Interval.fromDateTimes(DateTime.fromISO(o.start), DateTime.fromISO(o.end)))
    .filter((i) => i.isValid);
  const libres: DateTime[] = [];

  for (let dia = desde.setZone(z).startOf("day"); dia < hasta; dia = dia.plus({ days: 1 })) {
    if (reglas.diasCerrados.includes(dia.toISODate()!)) continue;
    for (const [ini, fin] of reglas.horario[dia.weekday] ?? []) {
      const [hi, mi] = ini.split(":").map(Number);
      const [hf, mf] = fin.split(":").map(Number);
      const finFranja = dia.set({ hour: hf, minute: mf });
      for (
        let t = dia.set({ hour: hi, minute: mi });
        t.plus({ minutes: reglas.duracionCitaMin }) <= finFranja;
        t = t.plus({ minutes: reglas.duracionCitaMin })
      ) {
        const cita = Interval.fromDateTimes(t, t.plus({ minutes: reglas.duracionCitaMin }));
        if (t < desde || cita.end! > hasta || t < minimo) continue;
        if (bloqueos.some((b) => b.overlaps(cita))) continue;
        libres.push(t);
      }
    }
  }
  return libres;
}

/** ¿El horario cae dentro del horario de atención y no en un día cerrado? */
export function dentroDeHorario(inicio: DateTime, reglas: ReglasAgenda): boolean {
  const t = inicio.setZone(reglas.zonaHoraria);
  if (reglas.diasCerrados.includes(t.toISODate()!)) return false;
  const fin = t.plus({ minutes: reglas.duracionCitaMin });
  return (reglas.horario[t.weekday] ?? []).some(([ini, f]) => {
    const [hi, mi] = ini.split(":").map(Number);
    const [hf, mf] = f.split(":").map(Number);
    return t >= t.set({ hour: hi, minute: mi, second: 0, millisecond: 0 }) &&
      fin <= t.set({ hour: hf, minute: mf, second: 0, millisecond: 0 });
  });
}

/** "jueves 5 de noviembre a las 9:30 a. m." */
export function fechaLegible(t: DateTime, zona: string): string {
  return t.setZone(zona).setLocale("es-CO").toFormat("cccc d 'de' LLLL 'a las' h:mm a");
}
