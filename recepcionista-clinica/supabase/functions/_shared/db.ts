// Base de datos de Supabase: memoria de conversaciones, mensajes ya atendidos y bloqueos de horario.
import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { env } from "./env.ts";
import { MENSAJES_DE_MEMORIA } from "./config.ts";

// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY las pone Supabase solo en cada Edge Function.
const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

/** true si el mensaje es nuevo; false si ya se había atendido (Meta reenvía a veces). */
export async function marcarProcesado(mensajeId: string): Promise<boolean> {
  const { error } = await db.from("mensajes_procesados").insert({ id: mensajeId });
  if (!error) return true;
  if (error.code === "23505") return false; // ya existía
  throw error;
}

export interface Turno {
  rol: "user" | "assistant";
  contenido: string;
}

export async function leerMemoria(telefono: string): Promise<Turno[]> {
  const { data, error } = await db
    .from("conversaciones")
    .select("rol, contenido")
    .eq("telefono", telefono)
    .order("id", { ascending: false })
    .limit(MENSAJES_DE_MEMORIA);
  if (error) throw error;
  return (data ?? []).reverse() as Turno[];
}

export async function guardarEnMemoria(telefono: string, ...turnos: Turno[]): Promise<void> {
  const { error } = await db.from("conversaciones").insert(
    turnos.map((t) => ({ telefono, rol: t.rol, contenido: t.contenido })),
  );
  if (error) throw error;
}

/** Toma el horario por unos segundos. false si otra persona lo está reservando en este momento. */
export async function bloquearHorario(inicio: string): Promise<boolean> {
  // Un bloqueo de hace más de 2 minutos quedó de un error: se libera.
  await db.from("bloqueos_horario").delete().eq("inicio", inicio).lt("creado_en", new Date(Date.now() - 120_000).toISOString());
  const { error } = await db.from("bloqueos_horario").insert({ inicio });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw error;
}

export async function liberarHorario(inicio: string): Promise<void> {
  await db.from("bloqueos_horario").delete().eq("inicio", inicio);
}
