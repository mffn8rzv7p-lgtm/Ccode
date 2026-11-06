/** Lee un Secret de Supabase y falla con un mensaje claro si falta. */
export function env(nombre: string): string {
  const v = Deno.env.get(nombre);
  if (!v) throw new Error(`Falta el secret ${nombre}. Agrégalo con: supabase secrets set ${nombre}=...`);
  return v;
}

export function envOpcional(nombre: string): string | undefined {
  return Deno.env.get(nombre) || undefined;
}
