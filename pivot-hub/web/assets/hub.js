// Utilidades compartidas por todas las apps del hub.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";

export const MODO_DEMO = SUPABASE_URL.includes("TU-PROYECTO") || SUPABASE_ANON_KEY.startsWith("TU-");

// La librería de Supabase solo se carga cuando hay un proyecto configurado.
export const sb = MODO_DEMO
  ? null
  : (await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm"))
      .createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Apps del hub. Para agregar una nueva, crea su carpeta y súmala aquí.
export const APPS = [
  {
    nombre: "Auditoría de Instagram",
    descripcion: "Escribe cualquier cuenta y recibe una auditoría con datos y una propuesta estratégica lista para mostrar al cliente.",
    ruta: "auditoria/",
    etiqueta: "Comercial",
  },
];

/** Crea un elemento de forma segura (el texto nunca se interpreta como HTML). */
export function el(tag, attrs = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") n.className = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const h of hijos.flat(Infinity)) {
    if (h === null || h === undefined || h === false) continue;
    n.append(h instanceof Node ? h : document.createTextNode(String(h)));
  }
  return n;
}

export function formatoNumero(n, dec = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function formatoFecha(iso, opciones = { day: "numeric", month: "long", year: "numeric" }) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { timeZone: "America/Bogota", ...opciones });
}

/** Sesión actual (o null). En modo demo devuelve una sesión ficticia. */
export async function sesionActual() {
  if (MODO_DEMO) return { user: { email: "demo@pivotagencia.com" } };
  const { data } = await sb.auth.getSession();
  return data.session;
}

/** Envía un enlace de acceso al correo. Solo funciona para usuarios ya creados en Supabase. */
export async function enviarEnlace(email) {
  const destino = new URL(".", location.href).href;
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: destino },
  });
  if (error) throw error;
}

/** Barra superior común. */
export function barraSuperior({ raiz = "./", titulo = "", email = "" } = {}) {
  return el("header", { class: "barra no-print" },
    el("a", { class: "barra__logo", href: raiz, "aria-label": "Inicio de Pivot Hub" },
      el("img", { src: `${raiz}assets/pivot-logo.png`, alt: "Pivot", width: "96", height: "24" }),
      el("span", { class: "etiqueta" }, "HUB"),
    ),
    titulo ? el("span", { class: "barra__titulo" }, titulo) : null,
    el("div", { class: "barra__derecha" },
      MODO_DEMO ? el("span", { class: "pildora pildora--aviso" }, "Modo demostración") : null,
      email ? el("span", { class: "barra__email" }, email) : null,
      email && !MODO_DEMO
        ? el("button", { class: "boton boton--texto", type: "button", onclick: async () => {
            await sb.auth.signOut();
            location.href = raiz;
          } }, "Salir")
        : null,
    ),
  );
}
