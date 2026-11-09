// App: Auditoría de Instagram
import { MODO_DEMO, barraSuperior, el, formatoFecha, sb, sesionActual } from "../assets/hub.js";
import { renderInforme } from "./informe.js";

const app = document.getElementById("app");
let email = "";

const ETAPAS = [
  { id: "datos", nombre: "Leer los datos públicos de Instagram", tiempo: "unos segundos" },
  { id: "auditoria", nombre: "Escribir la auditoría", tiempo: "1 a 3 minutos" },
  { id: "estrategia", nombre: "Armar la propuesta estratégica", tiempo: "1 a 3 minutos" },
];

const OBJETIVOS = [
  "Vender más",
  "Conseguir más mensajes y clientes",
  "Crecer en seguidores",
  "Posicionar la marca",
];

// ---------- Datos ----------

async function cargarDemo() {
  const r = await fetch("demo.json");
  return r.json();
}

async function listarInformes() {
  if (MODO_DEMO) return [await cargarDemo()];
  const { data, error } = await sb.from("informes")
    .select("id, cuenta, competidores, estado, creado_en")
    .order("creado_en", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

async function leerInforme(id) {
  if (MODO_DEMO) return cargarDemo();
  const { data, error } = await sb.from("informes").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

async function ejecutarEtapa(id, etapa) {
  const { error } = await sb.functions.invoke("informe", { body: { informe_id: id, etapa } });
  if (error) {
    let mensaje = "No se pudo completar este paso.";
    try {
      const cuerpo = await error.context?.json();
      if (cuerpo?.error) mensaje = cuerpo.error;
    } catch (_e) { /* sin cuerpo */ }
    throw new Error(mensaje);
  }
}

function siguienteEtapa(fila) {
  if (!fila.datos) return "datos";
  if (!fila.auditoria) return "auditoria";
  if (!fila.estrategia) return "estrategia";
  return null;
}

/** Reduce la imagen a 1600 px de lado mayor y la pasa a JPEG para subirla rápido. */
async function prepararImagen(archivo) {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
}

function limpiarUsuario(texto) {
  return texto.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "").toLowerCase();
}
const USUARIO_VALIDO = /^[a-z0-9._]{1,30}$/;

// ---------- Vistas ----------

function pagina(...contenido) {
  app.replaceChildren(
    barraSuperior({ raiz: "../", titulo: "Auditoría de Instagram", email }),
    el("main", { class: "contenedor" }, ...contenido),
  );
  window.scrollTo(0, 0);
}

function chipEstado(estado) {
  if (estado === "listo") return el("span", { class: "pildora pildora--ok" }, "Listo");
  if (estado === "error") return el("span", { class: "pildora pildora--error" }, "Con error");
  return el("span", { class: "pildora" }, "En proceso");
}

async function vistaLista() {
  const lista = el("div", {}, el("p", { class: "secundario" }, "Cargando informes…"));
  pagina(
    el("section", { class: "hero-hub" },
      el("p", { class: "etiqueta" }, "Herramienta comercial"),
      el("h1", { class: "titulo-xl" }, "Auditoría de Instagram", el("span", { class: "excl" }, "!")),
      el("p", { class: "parrafo-grande secundario" },
        "Escribe una cuenta y recibe una auditoría con datos públicos y una propuesta estratégica de Pivot, lista para mostrar al cliente."),
      el("a", { class: "boton boton--rojo", href: "#/nuevo" }, "Nuevo informe"),
    ),
    el("section", {},
      el("h2", { class: "titulo-m", style: { marginBottom: "8px" } }, "Informes recientes"),
      lista,
    ),
  );
  try {
    const informes = await listarInformes();
    if (!informes.length) {
      lista.replaceChildren(el("p", { class: "secundario" }, "Todavía no hay informes. Crea el primero."));
      return;
    }
    lista.replaceChildren(...informes.map((i) =>
      el("a", { class: "fila-informe", href: `#/informe/${i.id}` },
        el("span", { class: "fila-informe__cuenta" }, `@${i.cuenta}`),
        i.competidores?.length ? el("span", { class: "secundario pequeno" }, `vs ${i.competidores.map((c) => "@" + c).join(", ")}`) : null,
        chipEstado(i.estado),
        el("span", { class: "fila-informe__fecha" }, formatoFecha(i.creado_en, { day: "numeric", month: "short", year: "numeric" })),
      )));
  } catch (_e) {
    lista.replaceChildren(el("p", { class: "mensaje mensaje--error" }, "No pudimos cargar los informes. Recarga la página."));
  }
}

function campo(id, etiqueta, control, ayuda) {
  return el("div", { class: "campo" },
    el("label", { for: id }, etiqueta),
    control,
    ayuda ? el("span", { class: "ayuda", id: `${id}-ayuda` }, ayuda) : null,
  );
}

function vistaNuevo() {
  const estado = el("div", { role: "status", "aria-live": "polite" });
  const cuenta = el("input", { id: "cuenta", required: true, placeholder: "@cuentadelcliente", autocomplete: "off", autocapitalize: "none", spellcheck: "false", "aria-describedby": "cuenta-ayuda" });
  const competidores = el("input", { id: "competidores", placeholder: "@competidor1 @competidor2", autocomplete: "off", autocapitalize: "none", spellcheck: "false", "aria-describedby": "competidores-ayuda" });
  const negocio = el("textarea", { id: "negocio", required: true, placeholder: "Ej.: tienda de ropa femenina en Medellín, vende por WhatsApp y tienda física." });
  const objetivo = el("select", { id: "objetivo" }, OBJETIVOS.map((o) => el("option", { value: o }, o)));
  const publico = el("input", { id: "publico", placeholder: "Ej.: mujeres de 25 a 40 años en el Valle de Aburrá" });
  const capacidad = el("input", { id: "capacidad", placeholder: "Ej.: graban con celular, 3 horas a la semana, sin diseñador" });
  const notas = el("textarea", { id: "notas", placeholder: "Lo que dijo el cliente, qué le preocupa, presupuesto que mencionó…" });
  const capturas = el("input", { id: "capturas", type: "file", accept: "image/png,image/jpeg,image/webp", multiple: true, "aria-describedby": "capturas-ayuda" });
  const enviar = el("button", { class: "boton boton--rojo", type: "submit" }, "Generar informe");

  const form = el("form", { class: "rejilla", novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    estado.replaceChildren();
    const error = (t) => estado.replaceChildren(el("p", { class: "mensaje mensaje--error" }, t));

    const usuario = limpiarUsuario(cuenta.value);
    if (!USUARIO_VALIDO.test(usuario)) return error("Escribe un usuario de Instagram válido, por ejemplo @pivotagencia.");
    const comps = [...new Set(competidores.value.split(/[\s,]+/).map(limpiarUsuario).filter(Boolean))]
      .filter((c) => c !== usuario);
    if (comps.some((c) => !USUARIO_VALIDO.test(c))) return error("Revisa los usuarios de la competencia.");
    if (comps.length > 3) return error("Máximo 3 cuentas de competencia.");
    if (!negocio.value.trim()) return error("Cuéntanos en una frase qué vende el negocio.");
    const archivos = [...capturas.files].slice(0, 12);
    if (MODO_DEMO) return error("Estás en modo demostración: conecta Supabase para generar informes reales.");

    enviar.disabled = true;
    enviar.textContent = "Creando…";
    try {
      const { data: fila, error: errCrear } = await sb.from("informes").insert({
        cuenta: usuario,
        competidores: comps,
        contexto: {
          negocio: negocio.value.trim(),
          objetivo: objetivo.value,
          publico: publico.value.trim(),
          capacidad: capacidad.value.trim(),
          notas: notas.value.trim(),
        },
      }).select("id").single();
      if (errCrear) throw errCrear;

      const rutas = [];
      for (const [i, archivo] of archivos.entries()) {
        enviar.textContent = `Subiendo captura ${i + 1} de ${archivos.length}…`;
        const blob = await prepararImagen(archivo);
        const ruta = `${fila.id}/${String(i + 1).padStart(2, "0")}.jpg`;
        const { error: errSubir } = await sb.storage.from("capturas").upload(ruta, blob, { contentType: "image/jpeg" });
        if (!errSubir) rutas.push(ruta);
      }
      if (rutas.length) await sb.from("informes").update({ capturas: rutas }).eq("id", fila.id);
      location.hash = `#/informe/${fila.id}`;
    } catch (_e) {
      error("No pudimos crear el informe. Revisa tu conexión e inténtalo de nuevo.");
      enviar.disabled = false;
      enviar.textContent = "Generar informe";
    }
  } },
    el("div", { class: "rejilla rejilla--2" },
      campo("cuenta", "Cuenta a auditar", cuenta, "Debe ser una cuenta de empresa o de creador. Si es personal, sube capturas."),
      campo("competidores", "Competencia (opcional, hasta 3)", competidores, "Sepáralas con espacios o comas."),
    ),
    campo("negocio", "¿Qué vende y cómo vende?", negocio),
    el("div", { class: "rejilla rejilla--2" },
      campo("objetivo", "Objetivo principal", objetivo),
      campo("publico", "Público ideal (opcional)", publico),
    ),
    campo("capacidad", "¿Qué puede producir? (opcional)", capacidad),
    campo("notas", "Notas de la reunión (opcional)", notas),
    campo("capturas", "Capturas de pantalla (opcional, hasta 12)", capturas,
      "Perfil, cuadrícula, pestaña de Reels y publicaciones destacadas. Ayudan con lo que la API no muestra."),
    el("div", {}, enviar),
    estado,
  );

  pagina(
    el("section", { class: "contenedor--angosto", style: { padding: "40px 0 64px" } },
      el("a", { href: "#/", class: "boton boton--texto", style: { paddingLeft: 0 } }, "← Volver"),
      el("p", { class: "etiqueta" }, "Nuevo informe"),
      el("h1", { class: "titulo-l", style: { marginBottom: "24px" } }, "¿Qué cuenta revisamos", el("span", { class: "excl" }, "?")),
      el("div", { class: "tarjeta" }, form),
    ),
  );
  cuenta.focus();
}

async function vistaProgreso(fila) {
  const pasos = ETAPAS.map((e, i) => {
    const icono = el("span", { class: "paso__icono", "aria-hidden": "true" }, String(i + 1));
    const detalle = el("span", { class: "secundario pequeno" }, e.tiempo);
    const li = el("li", { class: "paso" }, icono, el("div", {}, el("strong", {}, e.nombre), el("br"), detalle));
    return { ...e, li, icono, detalle };
  });
  const estado = el("div", { role: "status", "aria-live": "polite" });
  pagina(
    el("section", { class: "contenedor--angosto", style: { padding: "40px 0 64px" } },
      el("a", { href: "#/", class: "boton boton--texto", style: { paddingLeft: 0 } }, "← Volver a la lista"),
      el("p", { class: "etiqueta" }, "Generando informe"),
      el("h1", { class: "titulo-l", style: { marginBottom: "8px" } }, `@${fila.cuenta}`),
      el("p", { class: "secundario" }, "Puedes dejar esta página abierta; el informe aparece solo al terminar."),
      el("ol", { class: "pasos" }, pasos.map((p) => p.li)),
      estado,
    ),
  );

  let actual = fila;
  const marcar = () => {
    const sig = siguienteEtapa(actual);
    for (const p of pasos) {
      const hecho = sig === null || ETAPAS.findIndex((e) => e.id === p.id) < ETAPAS.findIndex((e) => e.id === sig);
      p.li.className = "paso" + (hecho ? " paso--hecho" : p.id === sig ? " paso--activo" : "");
      p.icono.textContent = hecho ? "✓" : String(ETAPAS.indexOf(ETAPAS.find((e) => e.id === p.id)) + 1);
    }
  };

  while (siguienteEtapa(actual)) {
    const etapa = siguienteEtapa(actual);
    marcar();
    try {
      await ejecutarEtapa(actual.id, etapa);
      actual = await leerInforme(actual.id);
    } catch (e) {
      const paso = pasos.find((p) => p.id === etapa);
      paso.li.className = "paso paso--error";
      paso.icono.textContent = "!";
      estado.replaceChildren(
        el("p", { class: "mensaje mensaje--error" }, e.message),
        el("button", { class: "boton", type: "button", style: { marginTop: "12px" }, onclick: () => router() }, "Reintentar"),
      );
      return;
    }
  }
  router(); // ya estamos en #/informe/<id>: ahora muestra el informe terminado
}

async function vistaInforme(id) {
  pagina(el("p", { class: "secundario", style: { padding: "40px 0" } }, "Cargando informe…"));
  let fila;
  try {
    fila = await leerInforme(id);
  } catch (_e) {
    pagina(el("p", { class: "mensaje mensaje--error", style: { margin: "40px 0" } }, "No encontramos ese informe."));
    return;
  }
  if (siguienteEtapa(fila)) {
    if (MODO_DEMO) return;
    return vistaProgreso(fila);
  }

  const regenerar = MODO_DEMO ? null : el("button", { class: "boton boton--borde", type: "button", onclick: async () => {
    if (!confirm("¿Generar de nuevo la propuesta estratégica? La actual se reemplaza.")) return;
    await sb.from("informes").update({ estrategia: null, estado: "auditoria" }).eq("id", fila.id);
    router();
  } }, "Rehacer propuesta");

  pagina(
    el("div", { class: "informe" },
      el("div", { class: "informe__acciones no-print" },
        el("a", { href: "#/", class: "boton boton--texto", style: { paddingLeft: 0 } }, "← Lista"),
        el("button", { class: "boton boton--rojo", type: "button", onclick: () => descargarPdf(fila) }, "Descargar PDF"),
        regenerar,
      ),
      renderInforme(fila),
    ),
  );
}

function descargarPdf(fila) {
  const fecha = new Date(fila.creado_en).toISOString().slice(0, 10);
  const tituloAnterior = document.title;
  document.title = `Auditoria_Instagram_${fila.cuenta}_${fecha}`;
  document.querySelectorAll(".informe details").forEach((d) => (d.open = true));
  window.print();
  document.title = tituloAnterior;
}

// ---------- Inicio ----------

async function router() {
  const ruta = location.hash.replace(/^#\/?/, "");
  if (ruta === "nuevo") return vistaNuevo();
  const m = ruta.match(/^informe\/([\w-]+)$/);
  if (m) return vistaInforme(m[1]);
  return vistaLista();
}

(async () => {
  const sesion = await sesionActual();
  if (!sesion) {
    location.href = "../";
    return;
  }
  email = sesion.user.email;
  window.addEventListener("hashchange", router);
  router();
})();
