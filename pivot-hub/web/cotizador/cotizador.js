// App: Cotizador de Pivot
import { MODO_DEMO, barraSuperior, el, formatoFecha, sb, sesionActual } from "../assets/hub.js";
import { cop, renderCarta } from "./carta.js";

const app = document.getElementById("app");
let email = "";

const SERVICIOS = [
  "Gestión de redes sociales",
  "Creación de contenido",
  "Pauta digital",
  "Marketing digital",
  "Branding",
  "Diseño web",
];

// ---------- Datos ----------

async function filasDemo() {
  const lista = await (await fetch("demo.json")).json();
  const base = lista[0];
  return [base, { ...base, id: "demo-precio", numero: "PIV-2026-002", estado: "precio", aprobado: null, carta: null }];
}

async function listar() {
  if (MODO_DEMO) return filasDemo();
  const { data, error } = await sb.from("cotizaciones")
    .select("id, numero, cliente, proyecto, estado, creado_en")
    .order("creado_en", { ascending: false }).limit(50);
  if (error) throw error;
  return data;
}

async function leer(id) {
  if (MODO_DEMO) return (await filasDemo()).find((f) => f.id === id);
  const { data, error } = await sb.from("cotizaciones").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

async function actualizar(id, cambios) {
  if (MODO_DEMO) throw new Error("Estás en modo demostración: conecta Supabase para guardar cambios.");
  const { error } = await sb.from("cotizaciones").update(cambios).eq("id", id);
  if (error) throw new Error("No se pudo guardar. Inténtalo de nuevo.");
}

async function ejecutar(id, etapa) {
  const { error } = await sb.functions.invoke("cotizacion", { body: { cotizacion_id: id, etapa } });
  if (error) {
    let mensaje = "No se pudo completar este paso.";
    try {
      const cuerpo = await error.context?.json();
      if (cuerpo?.error) mensaje = cuerpo.error;
    } catch (_e) { /* sin cuerpo */ }
    throw new Error(mensaje);
  }
}

/** Qué falta: "precio" (análisis), "aprobar" (equipo), "carta" o null si está lista. */
function pendiente(fila) {
  if (!fila.precio) return "precio";
  if (!fila.aprobado) return "aprobar";
  if (!fila.carta) return "carta";
  return null;
}

// ---------- Utilidades de vista ----------

function pagina(...contenido) {
  app.replaceChildren(
    barraSuperior({ raiz: "../", titulo: "Cotizador", email }),
    el("main", { class: "contenedor" }, ...contenido),
  );
  window.scrollTo(0, 0);
}

function campo(id, etiqueta, control, ayuda) {
  return el("div", { class: "campo" },
    el("label", { for: id }, etiqueta),
    control,
    ayuda ? el("span", { class: "ayuda" }, ayuda) : null,
  );
}

function entradaPesos(id, valor = "", extra = {}) {
  const input = el("input", { id, inputmode: "numeric", autocomplete: "off", value: valor ? Number(valor).toLocaleString("es-CO") : "", ...extra });
  input.addEventListener("input", () => {
    const n = input.value.replace(/\D/g, "");
    input.value = n ? Number(n).toLocaleString("es-CO") : "";
  });
  return input;
}
const leerPesos = (input) => Number(input.value.replace(/\D/g, "")) || 0;

function chipEstado(estado) {
  if (estado === "listo") return el("span", { class: "pildora pildora--ok" }, "Lista");
  if (estado === "precio") return el("span", { class: "pildora pildora--aviso" }, "Aprobar precio");
  if (estado === "error") return el("span", { class: "pildora pildora--error" }, "Con error");
  return el("span", { class: "pildora" }, "En proceso");
}

function volver(href = "#/", texto = "← Volver") {
  return el("a", { href, class: "boton boton--texto", style: { paddingLeft: 0 } }, texto);
}

// ---------- Lista ----------

async function vistaLista() {
  const lista = el("div", {}, el("p", { class: "secundario" }, "Cargando cotizaciones…"));
  pagina(
    el("section", { class: "hero-hub" },
      el("p", { class: "etiqueta" }, "Herramienta comercial"),
      el("h1", { class: "titulo-xl" }, "Cotizador", el("span", { class: "excl" }, "!")),
      el("p", { class: "parrafo-grande secundario" },
        "Cuéntale el proyecto, aprueba el precio y descarga la carta lista para enviar por WhatsApp."),
      el("a", { class: "boton boton--rojo", href: "#/nueva" }, "Nueva cotización"),
    ),
    el("section", {}, el("h2", { class: "titulo-m", style: { marginBottom: "8px" } }, "Cotizaciones recientes"), lista),
  );
  try {
    const filas = await listar();
    lista.replaceChildren(...(filas.length ? filas.map((f) =>
      el("a", { class: "fila-informe", href: `#/cotizacion/${f.id}` },
        el("span", { class: "etiqueta", style: { color: "var(--piedra)" } }, f.numero),
        el("span", { class: "fila-informe__cuenta" }, f.cliente),
        el("span", { class: "secundario pequeno" }, f.proyecto),
        chipEstado(f.estado),
        el("span", { class: "fila-informe__fecha" }, formatoFecha(f.creado_en, { day: "numeric", month: "short", year: "numeric" })),
      )) : [el("p", { class: "secundario" }, "Todavía no hay cotizaciones. Crea la primera.")]));
  } catch (_e) {
    lista.replaceChildren(el("p", { class: "mensaje mensaje--error" }, "No pudimos cargar las cotizaciones. Recarga la página."));
  }
}

// ---------- Brief ----------

async function prellenarDesdeInforme(informeId) {
  let inf;
  if (MODO_DEMO) inf = await (await fetch("../auditoria/demo.json")).json();
  else {
    const { data } = await sb.from("informes").select("id, cuenta, datos, estrategia").eq("id", informeId).single();
    inf = data;
  }
  if (!inf?.estrategia) return null;
  const nombre = inf.datos?.cuenta?.metricas?.nombre;
  return {
    informe_id: MODO_DEMO ? null : inf.id,
    cuenta: inf.cuenta,
    cliente: nombre || `@${inf.cuenta}`,
    proyecto: inf.estrategia.titulo,
    necesidad: `${inf.estrategia.la_oportunidad}\n\nObjetivo: ${inf.estrategia.objetivo}`,
    alcance: inf.estrategia.servicios_recomendados
      .map((s) => `${s.servicio}: ${s.que_incluye.join("; ")}`).join("\n"),
    servicios: inf.estrategia.servicios_recomendados.map((s) => s.servicio),
  };
}

async function vistaNueva(params) {
  const pre = params.get("informe") ? await prellenarDesdeInforme(params.get("informe")) : null;
  const estado = el("div", { role: "status", "aria-live": "polite" });

  const i = {
    cliente: el("input", { id: "cliente", required: true, value: pre?.cliente ?? "", placeholder: "Nombre del negocio" }),
    contacto: el("input", { id: "contacto", placeholder: "Ej.: Laura Gómez" }),
    proyecto: el("input", { id: "proyecto", required: true, maxlength: "80", value: pre?.proyecto ?? "", placeholder: "Ej.: Pauta digital para temporada navideña" }),
    necesidad: el("textarea", { id: "necesidad", required: true, placeholder: "Qué necesita y para qué (la meta de negocio detrás)." }),
    alcance: el("textarea", { id: "alcance", placeholder: "Entregables, cantidades, revisiones. Si es pauta: duración." }),
    plazo: el("input", { id: "plazo", placeholder: "Ej.: arrancar en diciembre, 3 meses" }),
    tamano: el("select", { id: "tamano" }, ["Emprendimiento", "Pyme", "Empresa mediana", "Empresa grande"].map((o) => el("option", {}, o))),
    presupuesto: el("input", { id: "presupuesto", placeholder: "Si lo mencionó, ej.: unos 2 millones al mes" }),
    origen: el("select", { id: "origen" }, ["Referido", "Cliente recurrente", "Contacto en frío", "Redes sociales"].map((o) => el("option", {}, o))),
    compara: el("input", { id: "compara", type: "checkbox" }),
    pauta: el("input", { id: "pauta", type: "checkbox" }),
    terceros: entradaPesos("terceros"),
    tercerosDetalle: el("input", { id: "terceros-detalle", placeholder: "Ej.: fotografía, licencias, hosting" }),
    tarifa: entradaPesos("tarifa", "", { required: true, placeholder: "Ej.: 60.000" }),
    margen: el("input", { id: "margen", type: "number", min: "0", max: "200", value: "25", inputmode: "numeric" }),
    rondas: el("input", { id: "rondas", type: "number", min: "0", max: "10", value: "2", inputmode: "numeric" }),
    pago: el("input", { id: "pago", value: "50% para iniciar y 50% contra entrega" }),
  };
  if (pre) {
    i.necesidad.value = pre.necesidad;
    i.alcance.value = pre.alcance;
  }
  const servicios = SERVICIOS.map((s) => el("label", { class: "casilla" },
    el("input", { type: "checkbox", value: s, checked: pre?.servicios?.some((x) => x.toLowerCase().includes(s.split(" ")[0].toLowerCase())) || null }), s));

  const enviar = el("button", { class: "boton boton--rojo", type: "submit" }, "Calcular precio");
  const form = el("form", { class: "rejilla", novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    const error = (t) => estado.replaceChildren(el("p", { class: "mensaje mensaje--error" }, t));
    if (!i.cliente.value.trim() || !i.proyecto.value.trim()) return error("Escribe el cliente y el nombre del proyecto.");
    if (!i.necesidad.value.trim()) return error("Cuéntanos qué necesita el cliente.");
    if (!leerPesos(i.tarifa)) return error("Escribe cuánto vale la hora del equipo en este proyecto: con eso calculamos el piso.");
    if (MODO_DEMO) return error("Estás en modo demostración: conecta Supabase para crear cotizaciones.");
    enviar.disabled = true;
    try {
      const { data, error: err } = await sb.from("cotizaciones").insert({
        cliente: i.cliente.value.trim(),
        contacto: i.contacto.value.trim() || null,
        proyecto: i.proyecto.value.trim(),
        informe_id: pre?.informe_id ?? null,
        brief: {
          servicios: servicios.map((l) => l.querySelector("input")).filter((c) => c.checked).map((c) => c.value),
          necesidad: i.necesidad.value.trim(),
          alcance: i.alcance.value.trim(),
          plazo: i.plazo.value.trim(),
          tamano_cliente: i.tamano.value,
          presupuesto_mencionado: i.presupuesto.value.trim(),
          origen: i.origen.value,
          compara_con_otras_agencias: i.compara.checked,
          pauta_aparte: i.pauta.checked,
          costos_terceros: leerPesos(i.terceros),
          costos_terceros_detalle: i.tercerosDetalle.value.trim(),
          tarifa_hora: leerPesos(i.tarifa),
          margen_minimo: Number(i.margen.value) || 25,
          rondas_ajustes: Number(i.rondas.value) || 2,
          condicion_pago: i.pago.value.trim(),
          vigencia_dias: 15,
        },
      }).select("id").single();
      if (err) throw err;
      location.hash = `#/cotizacion/${data.id}`;
    } catch (_e) {
      error("No pudimos crear la cotización. Revisa tu conexión e inténtalo de nuevo.");
      enviar.disabled = false;
    }
  } },
    pre ? el("p", { class: "mensaje mensaje--info" }, `Datos tomados de la auditoría de @${pre.cuenta}. Revísalos y completa lo que falta.`) : null,
    el("div", { class: "rejilla rejilla--2" },
      campo("cliente", "Cliente", i.cliente),
      campo("contacto", "Nombre del contacto", i.contacto, "Para el saludo de la carta."),
    ),
    campo("proyecto", "Nombre del proyecto", i.proyecto, "Corto (máximo unas 7 palabras): es lo que se ve en la miniatura de WhatsApp."),
    el("fieldset", { style: { border: 0, padding: 0, margin: 0 } },
      el("legend", { style: { fontWeight: 700, marginBottom: "6px" } }, "Servicios"),
      el("div", { class: "casillas" }, servicios)),
    campo("necesidad", "¿Qué necesita y para qué?", i.necesidad),
    campo("alcance", "Alcance", i.alcance),
    el("div", { class: "rejilla rejilla--2" },
      campo("plazo", "Plazo esperado", i.plazo),
      campo("tamano", "Tamaño del cliente", i.tamano),
      campo("presupuesto", "Presupuesto que mencionó", i.presupuesto),
      campo("origen", "¿Cómo llegó?", i.origen),
    ),
    el("div", { class: "casillas" },
      el("label", { class: "casilla" }, i.compara, "Está comparando con otras agencias"),
      el("label", { class: "casilla" }, i.pauta, "La pauta la paga el cliente aparte"),
    ),
    el("div", { class: "tarjeta", style: { background: "var(--crema)" } },
      el("p", { class: "etiqueta", style: { marginTop: 0 } }, "Para calcular el piso"),
      el("div", { class: "rejilla rejilla--2" },
        campo("tarifa", "Valor de la hora del equipo (COP)", i.tarifa),
        campo("margen", "Margen mínimo (%)", i.margen),
        campo("terceros", "Costos de terceros (COP)", i.terceros),
        campo("terceros-detalle", "¿Cuáles?", i.tercerosDetalle),
        campo("rondas", "Rondas de ajustes", i.rondas),
        campo("pago", "Forma de pago", i.pago),
      ),
    ),
    el("div", {}, enviar),
    estado,
  );

  pagina(el("section", { class: "contenedor--angosto", style: { padding: "40px 0 64px" } },
    volver(),
    el("p", { class: "etiqueta" }, "Nueva cotización"),
    el("h1", { class: "titulo-l", style: { marginBottom: "24px" } }, "Cuéntanos el proyecto", el("span", { class: "excl" }, "!")),
    el("div", { class: "tarjeta" }, form),
  ));
  i.cliente.focus();
}

// ---------- Generación (precio o carta) ----------

async function vistaGenerando(fila, etapa) {
  const estado = el("div", { role: "status", "aria-live": "polite" },
    el("p", { class: "mensaje mensaje--info" },
      etapa === "precio" ? "Calculando el precio ideal… (1 a 2 minutos)" : "Escribiendo la carta… (1 a 2 minutos)"));
  pagina(el("section", { class: "contenedor--angosto", style: { padding: "40px 0 64px" } },
    volver("#/", "← Volver a la lista"),
    el("p", { class: "etiqueta" }, fila.numero),
    el("h1", { class: "titulo-l", style: { marginBottom: "16px" } }, fila.cliente),
    estado,
  ));
  try {
    await ejecutar(fila.id, etapa);
    router();
  } catch (e) {
    estado.replaceChildren(
      el("p", { class: "mensaje mensaje--error" }, e.message),
      el("button", { class: "boton", type: "button", style: { marginTop: "12px" }, onclick: () => router() }, "Reintentar"),
    );
  }
}

// ---------- Aprobación de precio ----------

function vistaAprobar(fila) {
  const p = fila.precio;
  const piso = p.piso;
  const estado = el("div", { role: "status", "aria-live": "polite" });
  const usarPaquetes = p.usar_paquetes && p.paquetes.length > 0;

  // Editor de paquetes o de conceptos
  const editores = [];
  const avisoPiso = (input, alerta) => () => {
    alerta.textContent = leerPesos(input) && leerPesos(input) < piso ? `Por debajo del piso del alcance completo (${cop(piso)})` : "";
  };

  let bloqueEditor;
  if (usarPaquetes) {
    const grupo = `rec-${fila.id}`;
    bloqueEditor = el("div", { class: "rejilla rejilla--3" }, p.paquetes.map((paq, k) => {
      const nombre = el("input", { value: paq.nombre, "aria-label": `Nombre del paquete ${k + 1}` });
      const precio = entradaPesos(`precio-${k}`, paq.precio, { "aria-label": `Precio del paquete ${k + 1}` });
      const incluye = el("textarea", { "aria-label": `Qué incluye el paquete ${k + 1}`, rows: "6" });
      incluye.value = paq.incluye.join("\n");
      const rec = el("input", { type: "radio", name: grupo, checked: paq.recomendado || null });
      const alerta = el("span", { class: "alerta" });
      precio.addEventListener("input", avisoPiso(precio, alerta));
      avisoPiso(precio, alerta)();
      const tarjeta = el("div", { class: "tarjeta paquete-editor" + (paq.recomendado ? " paquete-editor--recomendado" : "") },
        el("div", { class: "campo" }, el("label", {}, "Nombre"), nombre),
        el("div", { class: "campo" }, el("label", { for: `precio-${k}` }, "Precio (COP)"), precio, alerta),
        el("div", { class: "campo" }, el("label", {}, "Qué incluye (uno por línea)"), incluye),
        el("label", { class: "casilla" }, rec, "Recomendado"),
      );
      rec.addEventListener("change", () => document.querySelectorAll(".paquete-editor").forEach((t, j) =>
        t.classList.toggle("paquete-editor--recomendado", j === k)));
      editores.push(() => ({
        nombre: nombre.value.trim(),
        precio: leerPesos(precio),
        recomendado: rec.checked,
        incluye: incluye.value.split("\n").map((s) => s.trim()).filter(Boolean),
      }));
      return tarjeta;
    }));
  } else {
    const filas = el("div", { class: "rejilla" });
    const agregar = (item = { concepto: "", valor: 0 }) => {
      const concepto = el("input", { value: item.concepto, "aria-label": "Concepto", style: { flex: 1 } });
      const valor = entradaPesos(null, item.valor, { "aria-label": "Valor (COP)", style: { maxWidth: "160px" } });
      const fila_ = el("div", { class: "campo-precio" }, concepto, valor,
        el("button", { type: "button", class: "boton boton--texto", "aria-label": "Quitar concepto", onclick: () => { fila_.remove(); } }, "Quitar"));
      fila_._leer = () => ({ concepto: concepto.value.trim(), valor: leerPesos(valor) });
      filas.append(fila_);
    };
    p.items.forEach(agregar);
    editores.push(() => [...filas.children].map((f) => f._leer()).filter((x) => x.concepto && x.valor));
    bloqueEditor = el("div", { class: "rejilla" }, filas,
      el("button", { type: "button", class: "boton boton--borde", onclick: () => agregar() }, "Agregar concepto"));
  }

  const aprobar = el("button", { class: "boton boton--rojo", type: "button", onclick: async () => {
    const error = (t) => estado.replaceChildren(el("p", { class: "mensaje mensaje--error" }, t));
    let aprobado;
    if (usarPaquetes) {
      const paquetes = editores.map((f) => f());
      if (paquetes.some((x) => !x.nombre || !x.precio || !x.incluye.length)) return error("Cada paquete necesita nombre, precio y al menos un punto incluido.");
      if (paquetes.filter((x) => x.recomendado).length !== 1) return error("Marca un paquete como recomendado.");
      aprobado = { modo: "paquetes", paquetes };
    } else {
      const items = editores[0]();
      if (!items.length) return error("Agrega al menos un concepto con su valor.");
      aprobado = { modo: "items", items };
    }
    aprobar.disabled = true;
    try {
      await actualizar(fila.id, { aprobado, estado: "aprobado", carta: null });
      router();
    } catch (e) {
      error(e.message);
      aprobar.disabled = false;
    }
  } }, "Aprobar y escribir la carta");

  const recalcular = MODO_DEMO ? null : el("button", { class: "boton boton--borde", type: "button", onclick: async () => {
    await actualizar(fila.id, { precio: null, aprobado: null, carta: null, estado: "brief" });
    router();
  } }, "Recalcular propuesta");

  pagina(el("section", { style: { padding: "32px 0 64px" } },
    volver("#/", "← Volver a la lista"),
    el("p", { class: "etiqueta" }, `${fila.numero} · Paso 2 de 3`),
    el("h1", { class: "titulo-l" }, `Precio para ${fila.cliente}`, el("span", { class: "excl" }, "!")),
    el("p", { class: "parrafo-grande secundario" }, fila.proyecto),

    p.alertas?.length ? el("div", { class: "mensaje mensaje--error", style: { margin: "12px 0" } }, p.alertas.map((a) => el("div", {}, a))) : null,

    el("div", { class: "precio-capas", style: { margin: "20px 0" } },
      el("div", { class: "tarjeta" },
        el("span", { class: "etiqueta" }, "1 · Piso (costo)"),
        el("div", { class: "capa__valor" }, cop(piso)),
        el("p", { class: "secundario pequeno", style: { margin: 0 } },
          `${p.horas_total} horas × ${cop(p.tarifa_hora)} + ${cop(p.costos_terceros)} de terceros, con ${p.margen_minimo} % de margen. Por debajo de esto no se cobra.`),
      ),
      el("div", { class: "tarjeta" },
        el("span", { class: "etiqueta" }, "2 · Mercado (referencia)"),
        el("div", { class: "capa__valor" }, `${cop(p.mercado.minimo)} – ${cop(p.mercado.maximo)}`),
        el("p", { class: "secundario pequeno", style: { margin: 0 } }, p.mercado.explicacion),
      ),
      el("div", { class: "tarjeta" },
        el("span", { class: "etiqueta" }, "3 · Valor para el cliente"),
        el("p", { style: { margin: "8px 0 0" } }, p.valor.explicacion),
      ),
    ),

    el("div", { class: "destacado", style: { margin: "0 0 20px" } },
      el("span", { class: "etiqueta" }, "Precio recomendado"),
      el("p", { style: { fontSize: "30px", fontFamily: "var(--display)", fontWeight: 800 } }, cop(p.precio_recomendado)),
      el("p", { style: { fontWeight: 400, fontSize: "16px" } }, p.razonamiento),
    ),

    el("details", { class: "tarjeta", style: { marginBottom: "20px" } },
      el("summary", { style: { fontWeight: 700, cursor: "pointer", minHeight: "32px" } }, `Horas por fase (${p.horas_total} en total)`),
      el("div", { class: "tabla-envoltura", style: { marginTop: "12px" } },
        el("table", { class: "tabla" },
          el("thead", {}, el("tr", {}, el("th", {}, "Fase"), el("th", { class: "num" }, "Horas"), el("th", {}, "Detalle"))),
          el("tbody", {}, p.fases.map((f) => el("tr", {}, el("td", {}, f.fase), el("td", { class: "num" }, String(f.horas)), el("td", {}, f.detalle)))))),
    ),

    el("h2", { class: "titulo-m", style: { margin: "8px 0 12px" } }, usarPaquetes ? "Paquetes (edita lo que quieras)" : "Conceptos (edita lo que quieras)"),
    bloqueEditor,

    el("div", { class: "rejilla rejilla--2", style: { marginTop: "20px" } },
      el("div", { class: "tarjeta" },
        el("span", { class: "etiqueta" }, "Margen de negociación"),
        el("p", { style: { margin: "8px 0" } }, "Se puede bajar hasta ", el("strong", {}, cop(p.negociacion.hasta)), ", a cambio de:"),
        el("ul", { class: "lista" }, p.negociacion.a_cambio_de.map((x) => el("li", {}, x))),
      ),
      p.preguntas?.length ? el("div", { class: "tarjeta" },
        el("span", { class: "etiqueta" }, "Conviene confirmar con el cliente"),
        el("ul", { class: "lista", style: { marginTop: "8px" } }, p.preguntas.map((x) => el("li", {}, x))),
      ) : null,
    ),

    el("div", { class: "informe__acciones", style: { marginTop: "24px" } }, aprobar, recalcular),
    estado,
  ));
}

// ---------- Carta lista ----------

function editorTextos(fila, alGuardar) {
  const c = fila.carta;
  const campos = [
    ["saludo", "Saludo", false],
    ["tu_reto", "Tu reto", false],
    ["nuestra_propuesta", "Nuestra propuesta", false],
    ["que_incluye", "Qué incluye (uno por línea)", true],
    ["no_incluye", "No incluye (uno por línea)", true],
    ["tiempos", "Tiempos", false],
    ["condiciones", "Condiciones (una por línea)", true],
    ["por_que_pivot", "Por qué Pivot (una por línea)", true],
    ["cta", "Llamado a la acción", false],
    ["mensaje_whatsapp", "Mensaje de WhatsApp", false],
  ];
  const controles = {};
  const estado = el("div", { role: "status", "aria-live": "polite" });
  const form = el("form", { class: "rejilla", onsubmit: async (e) => {
    e.preventDefault();
    const nueva = { ...c };
    for (const [k, , esLista] of campos) {
      nueva[k] = esLista ? controles[k].value.split("\n").map((s) => s.trim()).filter(Boolean) : controles[k].value.trim();
    }
    try {
      await actualizar(fila.id, { carta: nueva });
      alGuardar();
    } catch (err) {
      estado.replaceChildren(el("p", { class: "mensaje mensaje--error" }, err.message));
    }
  } },
    campos.map(([k, etiqueta, esLista]) => {
      const t = el("textarea", { id: `t-${k}`, rows: esLista ? "4" : "3" });
      t.value = esLista ? (c[k] ?? []).join("\n") : (c[k] ?? "");
      controles[k] = t;
      return campo(`t-${k}`, etiqueta, t);
    }),
    el("div", { class: "informe__acciones" },
      el("button", { class: "boton boton--rojo", type: "submit" }, "Guardar cambios"),
      el("button", { class: "boton boton--borde", type: "button", onclick: alGuardar }, "Cancelar"),
    ),
    estado,
  );
  return el("div", { class: "tarjeta no-print" }, el("h2", { class: "titulo-m", style: { marginTop: 0 } }, "Editar textos"), form);
}

function vistaCarta(fila) {
  document.getElementById("pie-pagina").textContent = `@page {
    @bottom-left { content: "PIVOT · PIVOTAGENCIA.COM · HOLA@PIVOTAGENCIA.COM"; font: 7.5pt "Space Mono", monospace; color: #8A847C; }
    @bottom-right { content: "${fila.numero} · PÁG. " counter(page); font: 7.5pt "Space Mono", monospace; color: #8A847C; }
  }`;

  const zonaEdicion = el("div");
  const copiado = el("span", { role: "status", "aria-live": "polite", class: "secundario pequeno" });

  const acciones = el("div", { class: "informe__acciones no-print" },
    volver("#/", "← Lista"),
    el("button", { class: "boton boton--rojo", type: "button", onclick: () => {
      const fecha = new Date(fila.creado_en).toISOString().slice(0, 10);
      const limpio = fila.cliente.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "_").replace(/^_|_$/g, "");
      const anterior = document.title;
      document.title = `Cotizacion_Pivot_${limpio}_${fecha}`;
      window.print();
      document.title = anterior;
    } }, "Descargar PDF"),
    MODO_DEMO ? null : el("button", { class: "boton boton--borde", type: "button", onclick: () => {
      zonaEdicion.replaceChildren(editorTextos(fila, () => router()));
      zonaEdicion.scrollIntoView({ behavior: "smooth" });
    } }, "Editar textos"),
    MODO_DEMO ? null : el("button", { class: "boton boton--borde", type: "button", onclick: async () => {
      if (!confirm("¿Volver a la aprobación de precios? La carta actual se descarta.")) return;
      await actualizar(fila.id, { aprobado: null, carta: null, estado: "precio" });
      router();
    } }, "Cambiar precios"),
  );

  pagina(el("div", { class: "informe" },
    acciones,
    el("div", { class: "rejilla", style: { gridTemplateColumns: "minmax(0, 1fr)" } },
      renderCarta(fila),
      el("section", { class: "tarjeta no-print", style: { maxWidth: "794px", margin: "0 auto", width: "100%" } },
        el("span", { class: "etiqueta" }, "Mensaje para enviar con el PDF"),
        el("div", { class: "whatsapp", style: { margin: "10px 0" } }, fila.carta.mensaje_whatsapp),
        el("button", { class: "boton boton--borde", type: "button", onclick: async () => {
          try {
            await navigator.clipboard.writeText(fila.carta.mensaje_whatsapp);
            copiado.textContent = " Copiado.";
          } catch (_e) {
            copiado.textContent = " No se pudo copiar: selecciónalo y cópialo a mano.";
          }
        } }, "Copiar mensaje"),
        copiado,
      ),
      zonaEdicion,
    ),
  ));
}

// ---------- Detalle ----------

async function vistaDetalle(id) {
  pagina(el("p", { class: "secundario", style: { padding: "40px 0" } }, "Cargando cotización…"));
  let fila;
  try {
    fila = await leer(id);
    if (!fila) throw new Error();
  } catch (_e) {
    pagina(el("p", { class: "mensaje mensaje--error", style: { margin: "40px 0" } }, "No encontramos esa cotización."));
    return;
  }
  const falta = pendiente(fila);
  if (falta === "aprobar") return vistaAprobar(fila);
  if (falta === null) return vistaCarta(fila);
  if (MODO_DEMO) return;
  return vistaGenerando(fila, falta);
}

// ---------- Inicio ----------

async function router() {
  document.getElementById("pie-pagina").textContent = "";
  const [ruta, consulta] = location.hash.replace(/^#\/?/, "").split("?");
  if (ruta === "nueva") return vistaNueva(new URLSearchParams(consulta ?? ""));
  const m = ruta.match(/^cotizacion\/([\w-]+)$/);
  if (m) return vistaDetalle(m[1]);
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
