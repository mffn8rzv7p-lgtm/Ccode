// CORS, respuestas JSON y verificación de que quien llama es del equipo.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";

const ORIGENES = (Deno.env.get("ORIGENES_PERMITIDOS") ?? "*").split(",").map((s) => s.trim());

export function cors(req: Request): HeadersInit {
  const origen = req.headers.get("Origin") ?? "";
  const permitido = ORIGENES.includes("*") ? "*" : (ORIGENES.includes(origen) ? origen : ORIGENES[0]);
  return {
    "Access-Control-Allow-Origin": permitido,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function responder(req: Request, cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });
}

/**
 * Valida la petición y devuelve un cliente de base de datos con la sesión de quien llama
 * (las reglas de la base de datos deciden qué puede ver), o la respuesta de error.
 */
export async function clienteDelEquipo(req: Request): Promise<{ db: SupabaseClient } | { respuesta: Response }> {
  if (req.method === "OPTIONS") return { respuesta: new Response("ok", { headers: cors(req) }) };
  if (req.method !== "POST") return { respuesta: responder(req, { error: "Método no permitido" }, 405) };

  const auth = req.headers.get("Authorization");
  if (!auth) return { respuesta: responder(req, { error: "Inicia sesión para continuar." }, 401) };

  const db = createClient(Deno.env.get("SUPABASE_URL")!, (Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY"))!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: miembro } = await db.rpc("hub_es_miembro");
  if (miembro !== true) return { respuesta: responder(req, { error: "Tu cuenta no tiene acceso a Pivot Hub." }, 403) };
  return { db };
}
