// Métricas calculadas en código (no por la IA), para que cada número sea exacto.
import type { MediaMeta, PerfilMeta } from "./meta.ts";

export interface Publicacion {
  fecha: string;
  formato: string;
  me_gusta: number | null;
  comentarios: number | null;
  interaccion: number | null; // % sobre seguidores
  texto: string;
  enlace: string | null;
}

export interface Metricas {
  cuenta: string;
  nombre: string | null;
  biografia: string | null;
  web: string | null;
  foto: string | null;
  seguidores: number | null;
  seguidos: number | null;
  publicaciones_total: number | null;
  muestra: number;
  periodo: { desde: string | null; hasta: string | null };
  me_gusta_ocultos: boolean;
  interaccion: { promedio: number | null; mediana: number | null; minimo: number | null; maximo: number | null };
  promedio_me_gusta: number | null;
  promedio_comentarios: number | null;
  publicaciones_por_semana: number | null;
  dias_desde_ultima: number | null;
  por_formato: { formato: string; publicaciones: number; interaccion_promedio: number | null }[];
  por_dia: { dia: string; publicaciones: number; interaccion_promedio: number | null }[];
  hashtags_top: { hashtag: string; veces: number }[];
  largo_texto_promedio: number | null;
  mejores: Publicacion[];
  peores: Publicacion[];
  publicaciones: Publicacion[];
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const OFFSET_COLOMBIA_MS = -5 * 60 * 60 * 1000;

function redondear(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function promedio(v: number[]): number | null {
  return v.length ? redondear(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

function mediana(v: number[]): number | null {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return redondear(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
}

export function formatoDe(m: MediaMeta): string {
  if (m.media_product_type === "REELS") return "Reel";
  if (m.media_type === "CAROUSEL_ALBUM") return "Carrusel";
  if (m.media_type === "VIDEO") return "Video";
  return "Foto";
}

export function calcularMetricas(perfil: PerfilMeta, ahora = new Date()): Metricas {
  const seguidores = perfil.followers_count ?? null;
  const media = (perfil.media?.data ?? [])
    .filter((m) => m.timestamp)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  const meGustaOcultos = media.length > 0 && media.every((m) => m.like_count === undefined);

  const publicaciones: Publicacion[] = media.map((m) => {
    const likes = m.like_count ?? null;
    const coms = m.comments_count ?? null;
    const total = (likes ?? 0) + (coms ?? 0);
    const interaccion = seguidores && (likes !== null || coms !== null)
      ? redondear((total / seguidores) * 100)
      : null;
    return {
      fecha: m.timestamp,
      formato: formatoDe(m),
      me_gusta: likes,
      comentarios: coms,
      interaccion,
      texto: (m.caption ?? "").slice(0, 400),
      enlace: m.permalink ?? null,
    };
  });

  const ints = publicaciones.map((p) => p.interaccion).filter((x): x is number => x !== null);

  // Frecuencia: publicaciones por semana en las últimas 8 semanas
  // (o en el tramo que cubre la muestra, si todas sus publicaciones son más recientes).
  const SEMANA = 7 * 24 * 3600 * 1000;
  let porSemana: number | null = null;
  if (media.length) {
    const masAntigua = Date.parse(media[media.length - 1].timestamp);
    const ventanaMs = Math.max(Math.min(8 * SEMANA, ahora.getTime() - masAntigua), SEMANA);
    const enVentana = media.filter((m) => ahora.getTime() - Date.parse(m.timestamp) <= ventanaMs).length;
    porSemana = redondear(enVentana / (ventanaMs / SEMANA), 1);
  }

  const diasDesdeUltima = media.length
    ? Math.floor((ahora.getTime() - Date.parse(media[0].timestamp)) / (24 * 3600 * 1000))
    : null;

  const agrupar = (clave: (p: Publicacion) => string) => {
    const mapa = new Map<string, Publicacion[]>();
    for (const p of publicaciones) {
      const k = clave(p);
      mapa.set(k, [...(mapa.get(k) ?? []), p]);
    }
    return mapa;
  };

  const porFormato = [...agrupar((p) => p.formato)].map(([formato, ps]) => ({
    formato,
    publicaciones: ps.length,
    interaccion_promedio: promedio(ps.map((p) => p.interaccion).filter((x): x is number => x !== null)),
  })).sort((a, b) => b.publicaciones - a.publicaciones);

  const porDia = [...agrupar((p) => DIAS[new Date(Date.parse(p.fecha) + OFFSET_COLOMBIA_MS).getUTCDay()])]
    .map(([dia, ps]) => ({
      dia,
      publicaciones: ps.length,
      interaccion_promedio: promedio(ps.map((p) => p.interaccion).filter((x): x is number => x !== null)),
    }))
    .sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia));

  const conteo = new Map<string, number>();
  for (const m of media) {
    for (const tag of (m.caption ?? "").toLowerCase().match(/#[\p{L}\p{N}_]+/gu) ?? []) {
      conteo.set(tag, (conteo.get(tag) ?? 0) + 1);
    }
  }
  const hashtags = [...conteo].sort((a, b) => b[1] - a[1]).slice(0, 12)
    .map(([hashtag, veces]) => ({ hashtag, veces }));

  const ordenadas = publicaciones.filter((p) => p.interaccion !== null)
    .sort((a, b) => (b.interaccion ?? 0) - (a.interaccion ?? 0));

  return {
    cuenta: perfil.username,
    nombre: perfil.name ?? null,
    biografia: perfil.biography ?? null,
    web: perfil.website ?? null,
    foto: perfil.profile_picture_url ?? null,
    seguidores,
    seguidos: perfil.follows_count ?? null,
    publicaciones_total: perfil.media_count ?? null,
    muestra: publicaciones.length,
    periodo: {
      desde: media.length ? media[media.length - 1].timestamp : null,
      hasta: media.length ? media[0].timestamp : null,
    },
    me_gusta_ocultos: meGustaOcultos,
    interaccion: {
      promedio: promedio(ints),
      mediana: mediana(ints),
      minimo: ints.length ? Math.min(...ints) : null,
      maximo: ints.length ? Math.max(...ints) : null,
    },
    promedio_me_gusta: promedio(publicaciones.map((p) => p.me_gusta).filter((x): x is number => x !== null)),
    promedio_comentarios: promedio(publicaciones.map((p) => p.comentarios).filter((x): x is number => x !== null)),
    publicaciones_por_semana: porSemana,
    dias_desde_ultima: diasDesdeUltima,
    por_formato: porFormato,
    por_dia: porDia,
    hashtags_top: hashtags,
    largo_texto_promedio: media.length
      ? Math.round(media.reduce((a, m) => a + (m.caption ?? "").length, 0) / media.length)
      : null,
    mejores: ordenadas.slice(0, 5),
    peores: ordenadas.length > 5 ? ordenadas.slice(-5).reverse() : [],
    publicaciones,
  };
}
