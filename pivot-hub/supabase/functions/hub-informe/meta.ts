// Lectura de datos públicos con la API oficial de Instagram (Business Discovery).
// Solo funciona con cuentas de empresa o de creador; las personales devuelven error.

export interface PerfilMeta {
  username: string;
  name?: string;
  biography?: string;
  website?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  profile_picture_url?: string;
  media?: { data: MediaMeta[] };
}

export interface MediaMeta {
  id: string;
  caption?: string;
  media_type?: string; // IMAGE | VIDEO | CAROUSEL_ALBUM
  media_product_type?: string; // FEED | REELS | STORY | AD
  timestamp: string;
  permalink?: string;
  like_count?: number;
  comments_count?: number;
}

export type ResultadoMeta =
  | { ok: true; perfil: PerfilMeta }
  | { ok: false; motivo: string };

const CAMPOS_MEDIA =
  "id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count";

export function metaConfigurada(): boolean {
  return Boolean(Deno.env.get("META_ACCESS_TOKEN") && Deno.env.get("META_IG_USER_ID"));
}

export async function leerCuentaPublica(usuario: string, limite = 50): Promise<ResultadoMeta> {
  const token = Deno.env.get("META_ACCESS_TOKEN");
  const igUserId = Deno.env.get("META_IG_USER_ID");
  const version = Deno.env.get("META_GRAPH_VERSION") ?? "v23.0";
  if (!token || !igUserId) {
    return { ok: false, motivo: "La conexión con Meta no está configurada." };
  }

  const campos =
    `business_discovery.username(${usuario})` +
    `{username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url,` +
    `media.limit(${limite}){${CAMPOS_MEDIA}}}`;
  const url = `https://graph.facebook.com/${version}/${igUserId}?fields=${encodeURIComponent(campos)}`;

  let resp: Response;
  try {
    resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch (_e) {
    return { ok: false, motivo: "No se pudo conectar con Meta. Intenta de nuevo en unos minutos." };
  }

  const cuerpo = await resp.json().catch(() => ({}));
  if (!resp.ok || !cuerpo.business_discovery) {
    const codigo = cuerpo?.error?.code;
    const sub = cuerpo?.error?.error_subcode;
    // El mensaje de Meta no contiene claves: se registra y se muestra para poder diagnosticar.
    const detalle = cuerpo?.error?.message
      ? ` (Meta dice: ${String(cuerpo.error.message).slice(0, 220)} · código ${codigo}${sub ? "/" + sub : ""})`
      : ` (respuesta ${resp.status} sin datos de business_discovery)`;
    console.error("meta business_discovery", usuario, resp.status, codigo, sub, cuerpo?.error?.message);
    if (codigo === 190) {
      return { ok: false, motivo: "La clave de acceso de Meta venció o no es válida. Hay que renovarla." + detalle };
    }
    if (codigo === 4 || codigo === 17 || codigo === 32 || codigo === 613) {
      return { ok: false, motivo: "Meta limitó temporalmente las consultas. Espera unos minutos." + detalle };
    }
    return {
      ok: false,
      motivo:
        "Meta no devolvió datos de @" + usuario +
        ". Puede que la cuenta no exista, sea personal o privada." + detalle,
    };
  }
  return { ok: true, perfil: cuerpo.business_discovery as PerfilMeta };
}
