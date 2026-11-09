// Utilidades compartidas por todas las apps del hub.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";

export const MODO_DEMO = SUPABASE_URL.includes("TU-PROYECTO") || SUPABASE_ANON_KEY.startsWith("TU-");

// La librería de Supabase solo se carga cuando hay un proyecto configurado.
export const sb = MODO_DEMO
  ? null
  : (await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm"))
      .createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const DOMINIO = "pivotagencia.com";

// Apps del hub. Para agregar una nueva: crea su carpeta, dibuja su ícono en iconos.js y súmala aquí.
// estado: "lista" (abre), "pronto" (en construcción) o "por-instalar" (existe, falta conectarla).
export const APPS = [
  { id: "gestor", nombre: "Gestor", descripcion: "Las tareas del equipo (el Bong de siempre).", ruta: "gestor/", estado: "lista", dock: true },
  { id: "auditoria", nombre: "Auditoría", descripcion: "Auditoría de Instagram con datos públicos y propuesta estratégica.", ruta: "auditoria/", estado: "lista", dock: true },
  { id: "cotizador", nombre: "Cotizador", descripcion: "Del brief al precio ideal y a la carta en PDF para WhatsApp.", ruta: "cotizador/", estado: "lista", dock: true },
  { id: "briefs", nombre: "Briefs", descripcion: "Crea el brief de un proyecto a partir de una conversación con el cliente.", ruta: "briefs/", estado: "lista" },
  { id: "moodboards", nombre: "Moodboards", descripcion: "Arma moodboards de referencia visual para cada marca.", ruta: "moodboards/", estado: "lista" },
  { id: "parrillas", nombre: "Parrillas", descripcion: "Escribe la parrilla de contenido del mes, lista para producir.", ruta: "parrillas/", estado: "lista", dock: true },
];

/** Crea un elemento de forma segura (el texto nunca se interpreta como HTML). */
export function el(tag, attrs = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") n.className = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") {
      for (const [prop, valor] of Object.entries(v)) {
        if (prop.startsWith("--")) n.style.setProperty(prop, valor);
        else n.style[prop] = valor;
      }
    }
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

export const esCorreoPivot = (email) => String(email ?? "").toLowerCase().trim().endsWith(`@${DOMINIO}`);

/**
 * Sesión actual (o null). Si alguien entra con un correo sin acceso, se cierra su sesión
 * y queda `accesoNegado` en true para mostrar el aviso.
 */
export let accesoNegado = false;
export async function sesionActual() {
  if (MODO_DEMO) return { user: { email: `daniel@${DOMINIO}`, user_metadata: { full_name: "Daniel" } } };
  const { data } = await sb.auth.getSession();
  const sesion = data.session;
  if (!sesion) return null;
  const { data: permitido } = await sb.rpc("hub_es_miembro");
  if (permitido !== true) {
    accesoNegado = true;
    await sb.auth.signOut();
    return null;
  }
  return sesion;
}

/** Nombre corto para saludar: el de Google o la parte antes de la @. */
export function nombreCorto(sesion) {
  const completo = sesion?.user?.user_metadata?.full_name || sesion?.user?.user_metadata?.name;
  if (completo) return completo.split(" ")[0];
  const local = String(sesion?.user?.email ?? "").split("@")[0].split(/[._-]/)[0];
  return local ? local[0].toUpperCase() + local.slice(1) : "";
}

const urlDelHub = () => new URL(".", location.href).href;

/** Entrar con la cuenta de Google del dominio de Pivot. */
export async function entrarConGoogle() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: urlDelHub(), queryParams: { hd: DOMINIO, prompt: "select_account" } },
  });
  if (error) throw error;
}

/** Envía un enlace de acceso al correo (solo correos de Pivot pueden crear cuenta). */
export async function enviarEnlace(email) {
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: esCorreoPivot(email), emailRedirectTo: urlDelHub() },
  });
  if (error) throw error;
}

/** Logotipo de texto: Bong + el "!" rojo de Pivot. */
export function marcaBong(clase = "marca-bong") {
  return el("span", { class: clase }, "Bong", el("span", { class: "excl" }, "!"));
}

/** Barra superior común. */
export function barraSuperior({ raiz = "./", titulo = "", email = "" } = {}) {
  return el("header", { class: "barra no-print" },
    el("a", { class: "barra__logo", href: raiz, "aria-label": "Inicio de Bong" }, marcaBong()),
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

/** Llama una función del servidor de Bong v2 y devuelve su respuesta, o lanza un Error con un mensaje claro. */
export async function invocar(funcion, cuerpo) {
  if (MODO_DEMO) throw new Error("Estás en modo demostración: conecta Supabase para usar la IA.");
  const { data, error } = await sb.functions.invoke(funcion, { body: cuerpo });
  if (error) {
    let mensaje = "No se pudo completar. Inténtalo de nuevo.";
    try {
      const c = await error.context?.json();
      if (c?.error) mensaje = c.error;
    } catch (_e) { /* sin cuerpo */ }
    throw new Error(mensaje);
  }
  return data;
}

/** Página base de una app: barra superior + contenido. */
export function paginaApp(app, titulo, email, ...contenido) {
  app.replaceChildren(
    barraSuperior({ raiz: "../", titulo, email }),
    el("main", { class: "contenedor" }, ...contenido),
  );
  window.scrollTo(0, 0);
}

/** Lee un JSON de demostración de la carpeta de la app. */
export async function demo(archivo = "demo.json") {
  return (await fetch(archivo)).json();
}
