// Página pública del brief: la llena el cliente desde el enlace que le envía Pivot (sin crear cuenta).
import { MODO_DEMO, el, sb } from "../assets/hub.js";
import { INTRO_BRIEF, REDES_BRIEF, SECCIONES_BRIEF, avanceBrief } from "../assets/preguntas-brief.js";

const app = document.getElementById("app");
const token = new URLSearchParams(location.search).get("t") ?? "";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let datos = null; // { cliente, proyecto, respuestas, respondido_en }
let valores = {};
let paso = -1; // -1 = bienvenida; 0..n-1 = secciones; n = revisión

// ---------- Servidor ----------

async function cargar() {
  if (MODO_DEMO) return { cliente: "Café Ejemplo", proyecto: "Estrategia digital 2027", respuestas: {}, respondido_en: null };
  if (!UUID.test(token)) return null;
  const { data, error } = await sb.rpc("hub_brief_publico", { p_token: token });
  if (error) throw error;
  return data;
}

let temporizador = null;
const estadoGuardado = el("span", { class: "brief-guardado", role: "status", "aria-live": "polite" });
function guardarPronto() {
  clearTimeout(temporizador);
  estadoGuardado.textContent = "Guardando…";
  temporizador = setTimeout(() => guardar(false), 700);
}
async function guardar(final) {
  clearTimeout(temporizador);
  if (MODO_DEMO) { estadoGuardado.textContent = "Demostración: no se guarda"; return true; }
  const { data, error } = await sb.rpc("hub_brief_responder", { p_token: token, p_respuestas: valores, p_final: final });
  const ok = !error && data === true;
  estadoGuardado.textContent = ok ? "Guardado ✓" : "No se pudo guardar: revisa tu conexión";
  return ok;
}

// ---------- Vistas ----------

const logo = () => el("img", { src: "../assets/pivot-logo.png", alt: "Pivot Agencia", width: "112", height: "28", class: "brief-logo" });

function marco(...contenido) {
  app.replaceChildren(el("main", { class: "brief-publico" },
    el("header", { class: "brief-cabeza" }, logo(), estadoGuardado),
    ...contenido,
    el("footer", { class: "brief-pie" }, "Pivot Agencia · pivotagencia.com · hola@pivotagencia.com"),
  ));
  window.scrollTo(0, 0);
}

function vistaError(texto) {
  marco(el("section", { class: "brief-tarjeta" },
    el("h1", { class: "titulo-l" }, "Este enlace no está disponible", el("span", { class: "excl" }, "!")),
    el("p", { class: "parrafo-grande" }, texto),
    el("p", {}, "Escríbenos a ", el("a", { href: "mailto:hola@pivotagencia.com" }, "hola@pivotagencia.com"), " y te enviamos uno nuevo."),
  ));
}

function vistaBienvenida() {
  const { respondidas, total } = avanceBrief(valores);
  marco(el("section", { class: "brief-tarjeta brief-hero" },
    el("p", { class: "etiqueta" }, `Brief de marca · ${datos.cliente}`),
    el("h1", { class: "titulo-xl" }, "Cuéntanos de tu marca", el("span", { class: "excl" }, "!")),
    el("p", { class: "parrafo-grande" }, INTRO_BRIEF),
    el("ul", { class: "brief-pasos-lista" }, SECCIONES_BRIEF.map((s, i) => el("li", {}, el("span", {}, String(i + 1).padStart(2, "0")), s.titulo))),
    el("p", { class: "secundario" }, `Toma unos 20 minutos. ${respondidas ? `Ya llevas ${respondidas} de ${total} respuestas.` : ""}`),
    el("button", { class: "boton boton--rojo", type: "button", onclick: () => irA(0) }, respondidas ? "Continuar" : "Empezar"),
  ));
}

function control(p) {
  const id = `q-${p.id}`;
  if (p.tipo === "opciones") {
    const v = valores[p.id] ??= { elegidas: [], comentario: "" };
    const comentario = el("textarea", { id, rows: "2", placeholder: "¿Algo más?" });
    comentario.value = v.comentario ?? "";
    comentario.addEventListener("input", () => { v.comentario = comentario.value; guardarPronto(); });
    return el("div", { class: "rejilla", style: { gap: "10px" } },
      el("div", { class: "opciones-brief", role: "group", "aria-label": p.pregunta }, p.opciones.map((o) => {
        const b = el("button", { type: "button", class: "opcion-brief", "aria-pressed": String(v.elegidas.includes(o)), onclick: () => {
          v.elegidas = v.elegidas.includes(o) ? v.elegidas.filter((x) => x !== o) : [...v.elegidas, o];
          b.setAttribute("aria-pressed", String(v.elegidas.includes(o)));
          guardarPronto();
        } }, o);
        return b;
      })),
      comentario);
  }
  if (p.tipo === "rango") {
    return el("div", { class: "opciones-brief", role: "radiogroup", "aria-label": p.pregunta }, p.opciones.map((o) => {
      const b = el("button", { type: "button", role: "radio", class: "opcion-brief", "aria-checked": String(valores[p.id] === o), "aria-pressed": String(valores[p.id] === o), onclick: () => {
        valores[p.id] = o;
        b.parentElement.querySelectorAll("button").forEach((x) => { const on = x === b; x.setAttribute("aria-pressed", String(on)); x.setAttribute("aria-checked", String(on)); });
        guardarPronto();
      } }, o);
      return b;
    }));
  }
  if (p.tipo === "redes") {
    const v = valores[p.id] ??= {};
    return el("div", { class: "rejilla rejilla--2", style: { gap: "10px" } }, REDES_BRIEF.map(([k, n]) => {
      const i = el("input", { id: `${id}-${k}`, value: v[k] ?? "", placeholder: k === "whatsapp" ? "+57 300 000 0000" : k === "web" ? "www.tumarca.com" : "@tumarca o enlace", autocomplete: "off" });
      i.addEventListener("input", () => { v[k] = i.value.trim(); guardarPronto(); });
      return el("div", { class: "campo" }, el("label", { for: `${id}-${k}` }, n), i);
    }));
  }
  const t = p.tipo === "enlace"
    ? el("input", { id, type: "url", inputmode: "url", placeholder: "https://…", value: valores[p.id] ?? "" })
    : el("textarea", { id, rows: "4", placeholder: "Escribe aquí…" });
  if (p.tipo !== "enlace") t.value = valores[p.id] ?? "";
  t.addEventListener("input", () => { valores[p.id] = t.value; guardarPronto(); });
  return t;
}

function irA(n) {
  paso = n;
  if (paso < 0) return vistaBienvenida();
  if (paso >= SECCIONES_BRIEF.length) return vistaRevision();
  const s = SECCIONES_BRIEF[paso];
  const total = SECCIONES_BRIEF.length;
  marco(
    el("div", { class: "brief-progreso", role: "progressbar", "aria-valuemin": "1", "aria-valuemax": String(total), "aria-valuenow": String(paso + 1), "aria-label": `Paso ${paso + 1} de ${total}` },
      el("div", { style: { width: `${((paso + 1) / total) * 100}%` } })),
    el("p", { class: "etiqueta", style: { margin: "18px 0 4px" } }, `Paso ${paso + 1} de ${total}`),
    el("h1", { class: "titulo-l", style: { marginBottom: "18px" } }, s.titulo, el("span", { class: "excl" }, "!")),
    el("div", { class: "rejilla" }, s.preguntas.map((p) => el("section", { class: "brief-tarjeta brief-pregunta" },
      el("label", { for: `q-${p.id}`, class: "brief-pregunta__titulo" }, p.pregunta, p.requerida ? el("span", { class: "excl", "aria-label": "(importante)" }, " *") : null),
      p.ayuda ? el("p", { class: "secundario", style: { margin: 0 } }, p.ayuda) : null,
      control(p),
    ))),
    el("nav", { class: "brief-navegacion" },
      el("button", { type: "button", class: "boton boton--borde", onclick: () => irA(paso - 1) }, "← Anterior"),
      el("button", { type: "button", class: "boton boton--rojo", onclick: () => { guardar(false); irA(paso + 1); } }, paso + 1 < total ? "Siguiente →" : "Revisar y enviar"),
    ),
  );
}

function vistaRevision() {
  const { respondidas, total } = avanceBrief(valores);
  const faltan = SECCIONES_BRIEF.flatMap((s, i) => s.preguntas.filter((p) => p.requerida && !String(valores[p.id] ?? "").trim()).map((p) => ({ p, i })));
  const aviso = el("div", { role: "status", "aria-live": "polite" });
  const enviar = el("button", { type: "button", class: "boton boton--rojo", disabled: faltan.length > 0 || null, onclick: async () => {
    enviar.disabled = true;
    if (await guardar(true)) vistaGracias();
    else { aviso.replaceChildren(el("p", { class: "mensaje mensaje--error" }, "No pudimos enviarlo. Revisa tu conexión e inténtalo de nuevo.")); enviar.disabled = false; }
  } }, "Enviar brief a Pivot");
  marco(el("section", { class: "brief-tarjeta brief-hero" },
    el("p", { class: "etiqueta" }, "Último paso"),
    el("h1", { class: "titulo-l" }, "¿Listo para enviarlo", el("span", { class: "excl" }, "?")),
    el("p", { class: "parrafo-grande" }, `Respondiste ${respondidas} de ${total} preguntas. Entre más nos cuentes, mejor será la estrategia; igual puedes enviarlo así.`),
    faltan.length ? el("div", { class: "mensaje mensaje--error" },
      el("p", { style: { margin: "0 0 6px" } }, "Antes de enviar, responde estas preguntas importantes:"),
      el("ul", { class: "lista" }, faltan.map(({ p, i }) => el("li", {}, el("button", { type: "button", class: "boton boton--texto", style: { padding: 0, minHeight: "32px" }, onclick: () => irA(i) }, p.pregunta))))) : null,
    el("nav", { class: "brief-navegacion" },
      el("button", { type: "button", class: "boton boton--borde", onclick: () => irA(SECCIONES_BRIEF.length - 1) }, "← Volver"),
      enviar),
    aviso,
  ));
}

function vistaGracias() {
  marco(el("section", { class: "brief-tarjeta brief-hero" },
    el("p", { class: "etiqueta" }, "Brief recibido"),
    el("h1", { class: "titulo-xl" }, "¡Gracias", el("span", { class: "excl" }, "!")),
    el("p", { class: "parrafo-grande" }, `Ya tenemos todo lo que nos contaste sobre ${datos.cliente}. Nuestro equipo lo va a revisar y te escribimos pronto con los siguientes pasos.`),
    el("p", { class: "secundario" }, "Si recuerdas algo más, puedes volver a este mismo enlace y editar tus respuestas mientras lo revisamos."),
  ));
}

// ---------- Inicio ----------

(async () => {
  try {
    datos = await cargar();
  } catch (_e) {
    return vistaError("No pudimos abrir el brief en este momento. Inténtalo de nuevo en unos minutos.");
  }
  if (!datos) return vistaError("Puede que ya lo hayamos revisado o que el enlace esté incompleto.");
  valores = datos.respuestas ?? {};
  document.title = `Brief de marca · ${datos.cliente} · Pivot`;
  if (datos.respondido_en) estadoGuardado.textContent = "Ya enviado: puedes seguir editando";
  vistaBienvenida();
})();
