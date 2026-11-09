// App: Briefs
import { MODO_DEMO, demo, el, formatoFecha, invocar, paginaApp, sb, sesionActual } from "../assets/hub.js";
import { REDES_BRIEF, SECCIONES_BRIEF, avanceBrief, cuestionarioLegible } from "../assets/preguntas-brief.js";

const app = document.getElementById("app");
let email = "";
const pagina = (...c) => paginaApp(app, "Briefs", email, ...c);

const SERVICIOS = ["Gestión de redes", "Contenido", "Pauta digital", "Branding", "Diseño web", "Estrategia", "Campaña"];

// Datos internos de Pivot (no los ve el cliente): [clave, etiqueta, ayuda, filas]
const INTERNOS = [
  ["fecha_entrega", "Fecha clave o de entrega", "Cuándo debe estar listo o salir al aire.", 1],
  ["presupuesto", "Presupuesto", "Lo que el cliente mencionó (de producción y de pauta).", 1],
  ["entregables", "Entregables", "Una pieza por línea, con cantidad y canal. Ej.: 8 reels para Instagram.", 3],
  ["responsable_pivot", "Responsable en Pivot", "", 1],
];

const enlaceCliente = (token) => new URL(`../brief/?t=${token}`, location.href).href;

// ---------- Datos ----------

// En la demostración: un brief ya pulido y otro esperando respuestas del cliente.
function demoEspera(d) {
  return { ...d, id: "demo-espera", proyecto: "Estrategia digital 2027", estado: "enviado", documento: null, respondido_en: null,
    token_cliente: "00000000-0000-4000-8000-000000000000", respuestas: {},
    respuestas_cliente: {
      a_que_se_dedica: "Somos tostadores de café de especialidad en Medellín. Tenemos un local y tienda online.",
      por_que_nacio: "Queríamos que la gente conociera el café de la finca de nuestra familia.",
      quienes_compran: "Personas de 28 a 50 años que valoran el buen café y les gusta saber de dónde viene.",
      convence: { elegidas: ["Calidad", "Confianza", "Recomendación"], comentario: "" },
      redes: { instagram: "@cafe.ejemplo", whatsapp: "+57 300 000 0000" },
    } };
}

async function listar() {
  if (MODO_DEMO) { const d = await demo(); return [d, demoEspera(d)]; }
  const { data, error } = await sb.from("hub_briefs").select("id, cliente, proyecto, estado, actualizado_en").order("actualizado_en", { ascending: false }).limit(60);
  if (error) throw error;
  return data;
}

async function leer(id) {
  if (MODO_DEMO) { const d = await demo(); return id === "demo-espera" ? demoEspera(d) : d; }
  const { data, error } = await sb.from("hub_briefs").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

// ---------- Vistas ----------

async function vistaLista() {
  const lista = el("div", {}, el("p", { class: "secundario" }, "Cargando…"));
  pagina(
    el("section", { class: "hero-hub" },
      el("p", { class: "etiqueta" }, "Estrategia"),
      el("h1", { class: "titulo-xl" }, "Briefs", el("span", { class: "excl" }, "!")),
      el("p", { class: "parrafo-grande secundario" }, "Envíale al cliente el brief de marca de Pivot para que lo llene desde su celular, o llénalo con el equipo. La IA lo convierte en un brief claro, con lo que falta preguntar."),
      el("a", { class: "boton boton--rojo", href: "#/nuevo" }, "Nuevo brief"),
    ),
    el("section", {}, el("h2", { class: "titulo-m", style: { marginBottom: "8px" } }, "Briefs recientes"), lista),
  );
  try {
    const filas = await listar();
    lista.replaceChildren(...(filas.length ? filas.map((b) => el("a", { class: "fila-informe", href: `#/brief/${b.id}` },
      el("span", { class: "fila-informe__cuenta" }, b.cliente),
      el("span", { class: "secundario pequeno" }, b.proyecto),
      ({ listo: el("span", { class: "pildora pildora--ok" }, "Listo"), respondido: el("span", { class: "pildora pildora--aviso" }, "Cliente respondió"), enviado: el("span", { class: "pildora" }, "Esperando al cliente") })[b.estado] ?? el("span", { class: "pildora" }, "Borrador"),
      el("span", { class: "fila-informe__fecha" }, formatoFecha(b.actualizado_en, { day: "numeric", month: "short", year: "numeric" })),
    )) : [el("p", { class: "secundario" }, "Todavía no hay briefs.")]));
  } catch (_e) {
    lista.replaceChildren(el("p", { class: "mensaje mensaje--error" }, "No pudimos cargar los briefs."));
  }
}

// Controles del cuestionario (los mismos que ve el cliente, en versión compacta)
function controlPregunta(p, valores) {
  const id = `q-${p.id}`;
  if (p.tipo === "opciones") {
    const v = valores[p.id] ??= { elegidas: [], comentario: "" };
    const c = el("input", { id, value: v.comentario ?? "", placeholder: "Comentario" });
    c.addEventListener("input", () => { v.comentario = c.value; });
    return el("div", { class: "rejilla", style: { gap: "8px" } },
      el("div", { class: "casillas" }, p.opciones.map((o) => {
        const x = el("input", { type: "checkbox", checked: v.elegidas.includes(o) || null });
        x.addEventListener("change", () => { v.elegidas = x.checked ? [...v.elegidas, o] : v.elegidas.filter((y) => y !== o); });
        return el("label", { class: "casilla" }, x, o);
      })), c);
  }
  if (p.tipo === "rango") {
    return el("select", { id, onchange: (e) => { valores[p.id] = e.target.value; } },
      el("option", { value: "" }, "—"), p.opciones.map((o) => el("option", { value: o, selected: valores[p.id] === o || null }, o)));
  }
  if (p.tipo === "redes") {
    const v = valores[p.id] ??= {};
    return el("div", { class: "rejilla rejilla--2", style: { gap: "8px" } }, REDES_BRIEF.map(([k, n]) => {
      const i = el("input", { value: v[k] ?? "", placeholder: n, "aria-label": n });
      i.addEventListener("input", () => { v[k] = i.value.trim(); });
      return i;
    }));
  }
  const t = el("textarea", { id, rows: "2" });
  t.value = valores[p.id] ?? "";
  t.addEventListener("input", () => { valores[p.id] = t.value; });
  return t;
}

function vistaFormulario(fila = null) {
  const r = fila?.respuestas ?? {};
  const valores = structuredClone(r.cuestionario ?? {});
  const internos = structuredClone(r.internos ?? {});
  const estado = el("div", { role: "status", "aria-live": "polite" });
  const avisar = (clase, t) => estado.replaceChildren(el("p", { class: `mensaje mensaje--${clase}` }, t));
  const cliente = el("input", { id: "cliente", value: fila?.cliente ?? "", required: true, placeholder: "Nombre del cliente o la marca" });
  const proyecto = el("input", { id: "proyecto", value: fila?.proyecto ?? "", required: true, placeholder: "Ej.: Estrategia digital 2027" });
  const notas = el("textarea", { id: "notas", rows: "6", placeholder: "Notas o transcripción de la reunión. La IA las usa junto con las respuestas." });
  notas.value = r.notas ?? "";
  const servicios = SERVICIOS.map((s) => el("label", { class: "casilla" },
    el("input", { type: "checkbox", value: s, checked: (r.servicios ?? []).includes(s) || null }), s));

  const ctrlInternos = {};
  const seccionInterna = el("details", { class: "tarjeta seccion-brief", open: true },
    el("summary", {}, el("span", { class: "etiqueta" }, "PIVOT"), " Solo para el equipo"),
    el("div", { class: "rejilla", style: { marginTop: "12px" } },
      el("div", { class: "campo" }, el("label", { for: "notas" }, "Notas de la reunión"), notas),
      INTERNOS.map(([k, etiqueta, ayuda, filas]) => {
        const c = filas > 1 ? el("textarea", { id: k, rows: String(filas) }) : el("input", { id: k });
        c.value = internos[k] ?? "";
        ctrlInternos[k] = c;
        return el("div", { class: "campo" }, el("label", { for: k }, etiqueta), c, ayuda ? el("span", { class: "ayuda" }, ayuda) : null);
      })));

  const secciones = SECCIONES_BRIEF.map((s, i) => el("details", { class: "tarjeta seccion-brief", open: i === 0 || null },
    el("summary", {}, el("span", { class: "etiqueta" }, String(i + 1).padStart(2, "0")), " ", s.titulo),
    el("div", { class: "rejilla", style: { marginTop: "12px" } }, s.preguntas.map((p) =>
      el("div", { class: "campo" }, el("label", { for: `q-${p.id}` }, p.pregunta), controlPregunta(p, valores))))));

  const leer = () => ({
    cliente: cliente.value.trim(),
    proyecto: proyecto.value.trim(),
    respuestas: {
      ...r,
      notas: notas.value.trim(),
      servicios: servicios.map((l) => l.querySelector("input")).filter((x) => x.checked).map((x) => x.value),
      internos: Object.fromEntries(Object.entries(ctrlInternos).map(([k, c]) => [k, c.value.trim()])),
      cuestionario: valores,
    },
  });

  async function guardar(extra = {}) {
    const d = { ...leer(), ...extra };
    if (!d.cliente || !d.proyecto) throw new Error("Escribe el cliente y el nombre del proyecto.");
    if (MODO_DEMO) throw new Error("Estás en modo demostración: conecta Supabase para guardar.");
    if (fila?.id) {
      const { error } = await sb.from("hub_briefs").update(d).eq("id", fila.id);
      if (error) throw new Error("No se pudo guardar.");
      return fila.id;
    }
    const { data, error } = await sb.from("hub_briefs").insert(d).select("id").single();
    if (error) throw new Error("No se pudo guardar.");
    return data.id;
  }

  const botonEnviar = fila?.token_cliente ? null : el("button", { class: "boton boton--rojo", type: "button", onclick: async () => {
    try {
      const id = await guardar({ token_cliente: crypto.randomUUID(), enviado_en: new Date().toISOString(), estado: "enviado" });
      location.hash = `#/brief/${id}`;
    } catch (e) { avisar("error", e.message); }
  } }, "Enviar al cliente para que lo llene");

  const botonGuardar = el("button", { class: "boton boton--borde", type: "button", onclick: async () => {
    try {
      const id = await guardar();
      avisar("ok", "Guardado.");
      if (!fila?.id) location.hash = `#/editar/${id}`;
    } catch (e) { avisar("error", e.message); }
  } }, "Guardar");

  const botonIA = el("button", { class: "boton", type: "button", onclick: async () => {
    botonIA.disabled = true;
    avisar("info", "✨ Puliendo el brief… (1 a 2 minutos)");
    try {
      const id = await guardar();
      await pulir(id);
      location.hash = `#/brief/${id}`;
    } catch (e) { avisar("error", e.message); botonIA.disabled = false; }
  } }, "✨ Pulir con IA");

  pagina(el("section", { class: "contenedor--angosto", style: { padding: "32px 0 64px" } },
    el("a", { href: fila?.id ? `#/brief/${fila.id}` : "#/", class: "boton boton--texto", style: { paddingLeft: 0 } }, "← Volver"),
    el("p", { class: "etiqueta" }, fila?.id ? "Editar brief" : "Nuevo brief"),
    el("h1", { class: "titulo-l", style: { marginBottom: "20px" } }, "Brief de marca", el("span", { class: "excl" }, "!")),
    el("div", { class: "rejilla" },
      el("div", { class: "tarjeta rejilla" },
        el("div", { class: "rejilla rejilla--2" },
          el("div", { class: "campo" }, el("label", { for: "cliente" }, "Cliente"), cliente),
          el("div", { class: "campo" }, el("label", { for: "proyecto" }, "Proyecto"), proyecto)),
        el("fieldset", { style: { border: 0, padding: 0, margin: 0 } },
          el("legend", { style: { fontWeight: 700, marginBottom: "6px" } }, "Servicios que le interesan"),
          el("div", { class: "casillas" }, servicios)),
        botonEnviar ? el("div", { class: "mensaje mensaje--info" },
          el("p", { style: { margin: "0 0 10px" } }, "Lo más fácil: envíale al cliente un enlace para que responda desde su celular. Sus respuestas llegan aquí solas."),
          botonEnviar) : null,
      ),
      el("h2", { class: "titulo-m", style: { margin: "8px 0 0" } }, fila?.token_cliente ? "Complementar con lo que sabemos" : "O llenarlo nosotros"),
      seccionInterna,
      secciones,
      el("div", { class: "informe__acciones" }, botonGuardar, botonIA),
      estado,
    ),
  ));
  cliente.focus();
}

/** Prepara las respuestas legibles (cliente y equipo) y le pide a la IA el brief. */
async function pulir(id) {
  const { data: f, error } = await sb.from("hub_briefs").select("respuestas, respuestas_cliente").eq("id", id).single();
  if (error) throw new Error("No se pudo leer el brief.");
  const respuestas = {
    ...f.respuestas,
    respuestas_del_cliente: cuestionarioLegible(f.respuestas_cliente ?? {}),
    respuestas_del_equipo: cuestionarioLegible(f.respuestas?.cuestionario ?? {}),
  };
  await sb.from("hub_briefs").update({ respuestas }).eq("id", id);
  await invocar("hub-ia", { accion: "brief_mejorar", brief_id: id });
}

// Respuestas en formato pregunta → respuesta
function listaRespuestas(valores) {
  const l = cuestionarioLegible(valores);
  if (!l.length) return el("p", { class: "secundario" }, "Todavía no hay respuestas.");
  let seccion = "";
  return el("div", { class: "respuestas-brief" }, l.flatMap((x) => {
    const cabeza = x.seccion !== seccion ? el("p", { class: "etiqueta", style: { margin: "14px 0 4px" } }, (seccion = x.seccion)) : null;
    return [cabeza, el("div", { class: "respuesta-brief" }, el("strong", {}, x.pregunta), el("p", {}, x.respuesta))];
  }));
}

function vistaEspera(fila) {
  const respondido = Boolean(fila.respondido_en);
  const { respondidas, total } = avanceBrief(fila.respuestas_cliente ?? {});
  const internas = cuestionarioLegible(fila.respuestas?.cuestionario ?? {}).length;
  const enlace = fila.token_cliente ? enlaceCliente(fila.token_cliente) : null;
  const estado = el("div", { role: "status", "aria-live": "polite" });
  const mensajeWA = enlace ? `Hola 👋 Para preparar la estrategia de ${fila.cliente} queremos conocer tu marca desde tu experiencia. Respondes desde el celular, a tu ritmo, y se guarda solo:\n${enlace}` : "";
  const botonIA = el("button", { class: "boton boton--rojo", type: "button", disabled: (respondidas + internas === 0) || null, onclick: async () => {
    botonIA.disabled = true;
    estado.replaceChildren(el("p", { class: "mensaje mensaje--info" }, "✨ Puliendo el brief… (1 a 2 minutos)"));
    try { await pulir(fila.id); router(); } catch (e) { estado.replaceChildren(el("p", { class: "mensaje mensaje--error" }, e.message)); botonIA.disabled = false; }
  } }, "✨ Pulir con IA");

  pagina(el("section", { class: "contenedor--angosto", style: { padding: "32px 0 64px" } },
    el("a", { href: "#/", class: "boton boton--texto", style: { paddingLeft: 0 } }, "← Briefs"),
    el("p", { class: "etiqueta" }, fila.cliente),
    el("h1", { class: "titulo-l", style: { marginBottom: "16px" } }, fila.proyecto, el("span", { class: "excl" }, "!")),
    enlace ? el("div", { class: "tarjeta rejilla" },
      el("div", { class: "fila-informe", style: { border: 0, padding: 0 } },
        respondido ? el("span", { class: "pildora pildora--ok" }, "Respondido") : el("span", { class: "pildora pildora--aviso" }, "Esperando al cliente"),
        el("span", { class: "secundario pequeno" }, `${respondidas} de ${total} preguntas respondidas${respondido ? ` · enviado el ${formatoFecha(fila.respondido_en, { day: "numeric", month: "long" })}` : ""}`)),
      el("div", { class: "brief-progreso" }, el("div", { style: { width: `${(respondidas / total) * 100}%` } })),
      el("div", { class: "campo" }, el("label", { for: "enlace" }, "Enlace para el cliente"),
        el("input", { id: "enlace", value: enlace, readonly: true, onclick: (e) => e.target.select() })),
      el("div", { class: "informe__acciones", style: { margin: 0 } },
        el("button", { class: "boton boton--borde", type: "button", onclick: async () => {
          try { await navigator.clipboard.writeText(enlace); estado.replaceChildren(el("p", { class: "mensaje mensaje--ok" }, "Enlace copiado.")); } catch (_e) { /* el campo se puede copiar a mano */ }
        } }, "Copiar enlace"),
        el("a", { class: "boton boton--borde", href: `https://wa.me/?text=${encodeURIComponent(mensajeWA)}`, target: "_blank", rel: "noopener" }, "Enviar por WhatsApp"),
        el("a", { class: "boton boton--borde", href: enlace, target: "_blank", rel: "noopener" }, "Ver como el cliente")),
    ) : null,
    el("div", { class: "informe__acciones", style: { marginTop: "16px" } },
      botonIA,
      MODO_DEMO ? null : el("a", { class: "boton boton--borde", href: `#/editar/${fila.id}` }, enlace ? "Complementar nosotros" : "Editar respuestas")),
    estado,
    enlace ? el("section", { class: "tarjeta", style: { marginTop: "16px" } }, el("h2", { class: "titulo-m", style: { marginTop: 0 } }, "Lo que respondió el cliente"), listaRespuestas(fila.respuestas_cliente ?? {})) : null,
    internas ? el("section", { class: "tarjeta", style: { marginTop: "16px" } }, el("h2", { class: "titulo-m", style: { marginTop: 0 } }, "Lo que anotó el equipo"), listaRespuestas(fila.respuestas?.cuestionario ?? {})) : null,
  ));
}

// ---------- Documento ----------

function bloque(n, titulo, ...contenido) {
  const vacio = contenido.flat().every((c) => c === null || c === undefined || c === "");
  if (vacio) return null;
  return el("section", { class: "doc-seccion" },
    el("span", { class: "etiqueta" }, `${String(n).padStart(2, "0")} — ${titulo}`),
    ...contenido);
}
const parrafo = (t) => (t ? el("p", {}, t) : null);
const listaDoc = (xs) => (xs?.length ? el("ul", { class: "lista" }, xs.map((x) => el("li", {}, x))) : null);
const par = (etiqueta, t) => (t ? el("p", {}, el("strong", {}, `${etiqueta}: `), t) : null);

function renderDocumento(fila) {
  const d = fila.documento;
  let n = 0;
  return el("article", { class: "carta doc-brief" },
    el("header", { class: "carta__cabeza" },
      el("img", { src: "../assets/pivot-logo.png", alt: "Pivot Agencia", width: "112", height: "28" }),
      el("div", { class: "carta__meta" }, el("strong", {}, "Brief"), el("br"), formatoFecha(fila.actualizado_en))),
    el("p", { class: "etiqueta", style: { color: "var(--tinta)" } }, fila.cliente),
    el("h1", { class: "titulo-l" }, fila.proyecto, el("span", { class: "excl" }, "!")),
    d.frase_creativa ? el("div", { class: "destacado", style: { margin: "20px 0" } },
      el("span", { class: "etiqueta" }, "La idea en una frase"), el("p", {}, d.frase_creativa)) : null,
    bloque(++n, "Resumen", parrafo(d.resumen)),
    bloque(++n, "Contexto", parrafo(d.contexto)),
    bloque(++n, "Objetivos", par("De negocio", d.objetivos.negocio), par("De comunicación", d.objetivos.comunicacion),
      d.objetivos.indicadores.length ? el("p", {}, el("strong", {}, "Cómo lo medimos:")) : null, listaDoc(d.objetivos.indicadores)),
    bloque(++n, "Público", parrafo(d.publico.descripcion), par("Insight", d.publico.insight), par("Qué queremos que haga", d.publico.accion_esperada)),
    bloque(++n, "Mensaje", par("Mensaje principal", d.mensaje.principal),
      d.mensaje.razones_para_creer.length ? el("p", {}, el("strong", {}, "Por qué creernos:")) : null, listaDoc(d.mensaje.razones_para_creer),
      par("Tono", d.mensaje.tono)),
    bloque(++n, "Entregables", d.entregables.length ? el("div", { class: "tabla-envoltura" }, el("table", { class: "tabla" },
      el("thead", {}, el("tr", {}, ["Pieza", "Cantidad", "Formato", "Canal"].map((h) => el("th", {}, h)))),
      el("tbody", {}, d.entregables.map((e) => el("tr", {}, el("td", {}, e.pieza), el("td", {}, e.cantidad), el("td", {}, e.formato), el("td", {}, e.canal)))))) : null),
    bloque(++n, "Marca y referencias", parrafo(d.marca.lineamientos),
      d.marca.referencias.length ? el("p", {}, el("strong", {}, "Referencias:")) : null, listaDoc(d.marca.referencias),
      d.marca.competencia.length ? el("p", {}, el("strong", {}, "Competencia:")) : null, listaDoc(d.marca.competencia)),
    bloque(++n, "Mandatorios", listaDoc(d.mandatorios)),
    bloque(++n, "Restricciones", listaDoc(d.restricciones)),
    bloque(++n, "Cronograma", d.cronograma.length ? listaDoc(d.cronograma.map((c) => `${c.hito}${c.fecha ? ` — ${c.fecha}` : ""}`)) : null),
    bloque(++n, "Presupuesto y aprobaciones", par("Presupuesto", d.presupuesto), par("Aprueba", d.aprobaciones.quien_aprueba), par("Rondas de ajustes", d.aprobaciones.rondas)),
    d.preguntas_pendientes.length ? el("section", { class: "doc-pendientes" },
      el("span", { class: "etiqueta" }, "Preguntas pendientes para el cliente"), listaDoc(d.preguntas_pendientes)) : null,
    d.riesgos.length ? bloque(++n, "Riesgos", listaDoc(d.riesgos)) : null,
    el("p", { class: "secundario pequeno", style: { marginTop: "24px" } }, "Pivot Agencia · pivotagencia.com · hola@pivotagencia.com"),
  );
}

async function vistaBrief(id) {
  pagina(el("p", { class: "secundario", style: { padding: "40px 0" } }, "Cargando…"));
  let fila;
  try { fila = await leer(id); } catch (_e) {
    return pagina(el("p", { class: "mensaje mensaje--error", style: { margin: "40px 0" } }, "No encontramos ese brief."));
  }
  if (!fila.documento) return vistaEspera(fila);
  const crear = (ruta) => `../${ruta}?brief=${fila.id}`;
  pagina(el("div", { class: "informe" },
    el("div", { class: "informe__acciones no-print" },
      el("a", { href: "#/", class: "boton boton--texto", style: { paddingLeft: 0 } }, "← Briefs"),
      el("button", { class: "boton boton--rojo", type: "button", onclick: () => {
        const t = document.title;
        document.title = `Brief_${fila.cliente}_${fila.proyecto}`.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "_");
        window.print();
        document.title = t;
      } }, "Descargar PDF"),
      MODO_DEMO ? null : el("a", { class: "boton boton--borde", href: `#/editar/${fila.id}` }, "Editar respuestas"),
    ),
    el("div", { class: "rejilla", style: { gridTemplateColumns: "minmax(0, 1fr)" } },
      renderDocumento(fila),
      el("section", { class: "tarjeta no-print", style: { maxWidth: "794px", margin: "0 auto", width: "100%" } },
        el("span", { class: "etiqueta" }, "Siguiente paso"),
        el("p", { style: { margin: "8px 0 14px" } }, "Usa este brief para arrancar las otras apps:"),
        el("div", { class: "informe__acciones", style: { margin: 0 } },
          el("a", { class: "boton", href: crear("cotizador/#/nueva") }, "Cotizar"),
          el("a", { class: "boton", href: crear("moodboards/#/nuevo") }, "Crear moodboard"),
          el("a", { class: "boton", href: crear("parrillas/#/nueva") }, "Crear parrilla"),
        ),
      ),
    ),
  ));
}

// ---------- Inicio ----------

async function router() {
  const ruta = location.hash.replace(/^#\/?/, "");
  if (ruta === "nuevo") return vistaFormulario();
  let m = ruta.match(/^editar\/([\w-]+)$/);
  if (m) {
    try { return vistaFormulario(await leer(m[1])); } catch (_e) { return vistaLista(); }
  }
  m = ruta.match(/^brief\/([\w-]+)$/);
  if (m) return vistaBrief(m[1]);
  return vistaLista();
}

(async () => {
  const sesion = await sesionActual();
  if (!sesion) { location.href = "../"; return; }
  email = sesion.user.email;
  window.addEventListener("hashchange", router);
  router();
})();
