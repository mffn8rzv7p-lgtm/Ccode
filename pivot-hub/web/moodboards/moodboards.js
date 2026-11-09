// App: Moodboards (tablero con módulos fijos, imágenes por arrastre y botón mágico con IA)
import { MODO_DEMO, demo, el, formatoFecha, invocar, paginaApp, sb, sesionActual } from "../assets/hub.js";

const app = document.getElementById("app");
let email = "";
const pagina = (...c) => paginaApp(app, "Moodboards", email, ...c);
const poner = (nodo, ...hijos) => nodo.replaceChildren(...hijos.flat(Infinity).filter((h) => h !== null && h !== undefined && h !== false));
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 10;

// ---------- Datos ----------

async function listar() {
  if (MODO_DEMO) return [await demo()];
  const { data, error } = await sb.from("hub_moodboards").select("id, cliente, nombre, datos, actualizado_en").order("actualizado_en", { ascending: false }).limit(60);
  if (error) throw error;
  return data;
}

async function leer(id) {
  if (MODO_DEMO) return demo();
  const { data, error } = await sb.from("hub_moodboards").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

const urlsFirmadas = new Map();
async function urlImagen(img) {
  if (img.url) return img.url; // demo o vista previa local
  if (urlsFirmadas.has(img.ruta)) return urlsFirmadas.get(img.ruta);
  const { data } = await sb.storage.from("hub-moodboards").createSignedUrl(img.ruta, 3600);
  if (data?.signedUrl) urlsFirmadas.set(img.ruta, data.signedUrl);
  return data?.signedUrl ?? null;
}

// Tipografías de Google Fonts: se cargan al vuelo para mostrar la muestra real.
const fuentesCargadas = new Set();
function cargarFuente(familia) {
  const f = String(familia ?? "").trim();
  if (!f || fuentesCargadas.has(f) || !/^[\w\s-]{2,60}$/.test(f)) return;
  fuentesCargadas.add(f);
  document.head.append(el("link", { rel: "stylesheet", href: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;700&display=swap` }));
}

// ---------- Lista ----------

async function vistaLista() {
  const lista = el("div", { class: "rejilla rejilla--3" }, el("p", { class: "secundario" }, "Cargando…"));
  pagina(
    el("section", { class: "hero-hub" },
      el("p", { class: "etiqueta" }, "Diseño"),
      el("h1", { class: "titulo-xl" }, "Moodboards", el("span", { class: "excl" }, "!")),
      el("p", { class: "parrafo-grande secundario" }, "Colores, tipografías, estilos gráficos e imágenes de referencia en un solo tablero. Arrastra tus imágenes o deja que el botón mágico lo llene."),
      el("a", { class: "boton boton--rojo", href: "#/nuevo" }, "Nuevo moodboard"),
    ),
    lista,
  );
  try {
    const filas = await listar();
    lista.replaceChildren(...(filas.length ? filas.map((m) => el("a", { class: "tarjeta app-tarjeta", href: `#/moodboard/${m.id}`, style: { textDecoration: "none" } },
      el("div", { style: { display: "flex", height: "54px", borderRadius: "12px", overflow: "hidden" } },
        (m.datos?.colores?.length ? m.datos.colores : [{ hex: "#EBE4D8" }]).slice(0, 6).map((c) => el("span", { style: { flex: 1, background: c.hex } }))),
      el("span", { class: "etiqueta" }, m.cliente),
      el("h2", { class: "titulo-m" }, m.nombre),
      el("span", { class: "secundario pequeno" }, `Actualizado ${formatoFecha(m.actualizado_en, { day: "numeric", month: "short" })}`),
    )) : [el("p", { class: "secundario" }, "Todavía no hay moodboards.")]));
  } catch (_e) {
    lista.replaceChildren(el("p", { class: "mensaje mensaje--error" }, "No pudimos cargar los moodboards."));
  }
}

// ---------- Nuevo ----------

async function vistaNuevo(params) {
  let brief = null;
  if (params.get("brief")) {
    if (MODO_DEMO) brief = await (await fetch("../briefs/demo.json")).json();
    else brief = (await sb.from("hub_briefs").select("id, cliente, proyecto, documento").eq("id", params.get("brief")).single()).data;
  }
  const estado = el("div", { role: "status", "aria-live": "polite" });
  const cliente = el("input", { id: "cliente", value: brief?.cliente ?? "", placeholder: "Nombre del cliente" });
  const nombre = el("input", { id: "nombre", value: brief?.proyecto ?? "", placeholder: "Ej.: Campaña de diciembre" });
  const descripcion = el("textarea", { id: "descripcion", rows: "4", placeholder: "¿Qué debe transmitir? Ej.: cálido, artesanal, origen campesino, nada navideño tradicional." });
  descripcion.value = brief?.documento ? `${brief.documento.frase_creativa}\nTono: ${brief.documento.mensaje.tono}` : "";
  const magia = el("input", { type: "checkbox", checked: true });
  const crear = el("button", { class: "boton boton--rojo", type: "submit" }, "Crear moodboard");
  const form = el("form", { class: "rejilla", onsubmit: async (e) => {
    e.preventDefault();
    const error = (t) => estado.replaceChildren(el("p", { class: "mensaje mensaje--error" }, t));
    if (!cliente.value.trim() || !nombre.value.trim()) return error("Escribe el cliente y el nombre del moodboard.");
    if (MODO_DEMO) return error("Estás en modo demostración: conecta Supabase para crear moodboards.");
    crear.disabled = true;
    try {
      const { data, error: err } = await sb.from("hub_moodboards").insert({
        cliente: cliente.value.trim(), nombre: nombre.value.trim(), brief_id: brief?.id ?? null,
        datos: { descripcion: descripcion.value.trim(), concepto: "", palabras_clave: [], colores: [], tipografias: [], estilos: [], imagenes: [] },
      }).select("id").single();
      if (err) throw err;
      location.hash = `#/moodboard/${data.id}${magia.checked ? "?magia=1" : ""}`;
    } catch (_e) {
      error("No pudimos crear el moodboard.");
      crear.disabled = false;
    }
  } },
    brief ? el("p", { class: "mensaje mensaje--info" }, `Basado en el brief "${brief.proyecto}".`) : null,
    el("div", { class: "rejilla rejilla--2" },
      el("div", { class: "campo" }, el("label", { for: "cliente" }, "Cliente"), cliente),
      el("div", { class: "campo" }, el("label", { for: "nombre" }, "Nombre del moodboard"), nombre)),
    el("div", { class: "campo" }, el("label", { for: "descripcion" }, "Sensación y dirección"), descripcion),
    el("label", { class: "casilla" }, magia, "✨ Llenarlo con el botón mágico al crearlo"),
    el("div", {}, crear),
    estado,
  );
  pagina(el("section", { class: "contenedor--angosto", style: { padding: "32px 0 64px" } },
    el("a", { href: "#/", class: "boton boton--texto", style: { paddingLeft: 0 } }, "← Volver"),
    el("p", { class: "etiqueta" }, "Nuevo moodboard"),
    el("h1", { class: "titulo-l", style: { marginBottom: "20px" } }, "¿Cómo se debe sentir", el("span", { class: "excl" }, "?")),
    el("div", { class: "tarjeta" }, form),
  ));
}

// ---------- Tablero ----------

async function vistaMoodboard(id, params) {
  pagina(el("p", { class: "secundario", style: { padding: "40px 0" } }, "Cargando…"));
  let fila;
  try { fila = await leer(id); } catch (_e) {
    return pagina(el("p", { class: "mensaje mensaje--error", style: { margin: "40px 0" } }, "No encontramos ese moodboard."));
  }
  const d = fila.datos ?? {};
  for (const k of ["palabras_clave", "colores", "tipografias", "estilos", "imagenes", "prompts_sugeridos"]) d[k] ??= [];
  const avisos = el("div", { role: "status", "aria-live": "polite" });
  const avisar = (clase, t) => avisos.replaceChildren(t ? el("p", { class: `mensaje mensaje--${clase}` }, t) : "");
  const estadoGuardado = el("span", { class: "secundario pequeno", "aria-live": "polite" });

  // Guardado automático (medio segundo después del último cambio)
  let temporizador = null;
  function guardar() {
    if (MODO_DEMO) { estadoGuardado.textContent = "Demostración: los cambios no se guardan"; return; }
    clearTimeout(temporizador);
    estadoGuardado.textContent = "Guardando…";
    temporizador = setTimeout(async () => {
      const limpio = { ...d, imagenes: d.imagenes.filter((i) => i.ruta).map(({ url: _u, ...i }) => i) };
      const { error } = await sb.from("hub_moodboards").update({ datos: limpio }).eq("id", fila.id);
      estadoGuardado.textContent = error ? "No se pudo guardar" : "Guardado";
    }, 500);
  }

  const mod = {
    concepto: el("section", { class: "modulo mood__concepto", "aria-labelledby": "m-concepto" }),
    palabras: el("section", { class: "modulo mood__palabras", "aria-labelledby": "m-palabras" }),
    colores: el("section", { class: "modulo mood__colores", "aria-labelledby": "m-colores" }),
    tipos: el("section", { class: "modulo mood__tipos", "aria-labelledby": "m-tipos" }),
    estilos: el("section", { class: "modulo mood__estilos", "aria-labelledby": "m-estilos" }),
    imagenes: el("section", { class: "modulo mood__imagenes", "aria-labelledby": "m-imagenes" }),
  };
  const cabeza = (id_, titulo, ...extra) => el("div", { class: "modulo__cabeza" }, el("h2", { id: id_ }, titulo), el("div", { class: "fila", style: { display: "flex", gap: "6px" } }, ...extra));
  const botonTexto = (t, fn, etiqueta) => el("button", { type: "button", class: "boton boton--texto no-print", "aria-label": etiqueta ?? t, onclick: fn }, t);

  function dibujarConcepto() {
    const t = el("textarea", { rows: "5", "aria-label": "Concepto", class: "concepto-texto", style: { width: "100%", border: 0, resize: "vertical", background: "transparent", padding: 0 }, placeholder: "La idea visual en 2 o 3 frases…" });
    t.value = d.concepto ?? "";
    const crecer = () => { t.style.height = "auto"; t.style.height = `${t.scrollHeight + 4}px`; };
    t.addEventListener("input", () => { d.concepto = t.value; crecer(); guardar(); });
    poner(mod.concepto, cabeza("m-concepto", "Concepto"), t);
    requestAnimationFrame(crecer);
    document.fonts?.ready.then(crecer);
  }

  function dibujarPalabras() {
    const nueva = el("input", { placeholder: "Agregar palabra y Enter", "aria-label": "Nueva palabra clave", class: "no-print", style: { minHeight: "40px", border: "1px solid var(--crema-3)", borderRadius: "999px", padding: "0 14px" } });
    nueva.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || !nueva.value.trim()) return;
      e.preventDefault(); d.palabras_clave.push(nueva.value.trim()); guardar(); dibujarPalabras();
      mod.palabras.querySelector("input").focus();
    });
    poner(mod.palabras, cabeza("m-palabras", "Palabras clave"),
      el("div", { class: "etiquetas" }, d.palabras_clave.map((p, i) => el("span", { class: "etiqueta-mood" }, p,
        el("button", { type: "button", class: "no-print", "aria-label": `Quitar ${p}`, style: { border: 0, background: "none", marginLeft: "6px", cursor: "pointer" }, onclick: () => { d.palabras_clave.splice(i, 1); guardar(); dibujarPalabras(); } }, "×")))),
      nueva);
  }

  function dibujarColores() {
    poner(mod.colores, 
      cabeza("m-colores", "Colores", botonTexto("+ Agregar", () => { d.colores.push({ nombre: "Nuevo color", hex: "#E63915", uso: "" }); guardar(); dibujarColores(); }, "Agregar color")),
      el("div", { class: "paleta" }, d.colores.map((c, i) => {
        const selector = el("input", { type: "color", value: c.hex, "aria-label": `Cambiar ${c.nombre}` });
        const muestra = el("label", { class: "color__muestra", style: { background: c.hex } }, selector);
        const hex = el("span", {}, c.hex);
        selector.addEventListener("input", () => { c.hex = selector.value.toUpperCase(); muestra.style.background = c.hex; hex.textContent = c.hex; guardar(); });
        const nombre = el("input", { value: c.nombre, "aria-label": "Nombre del color", style: { border: 0, font: "700 14px var(--texto)", padding: 0, background: "transparent" } });
        nombre.addEventListener("input", () => { c.nombre = nombre.value; guardar(); });
        return el("div", { class: "color" }, muestra,
          el("div", { class: "color__info" }, nombre, hex, c.uso ? el("span", { style: { textTransform: "none", fontFamily: "var(--texto)" } }, c.uso) : null,
            el("div", { class: "no-print", style: { display: "flex", gap: "4px" } },
              botonTexto("Copiar", () => navigator.clipboard?.writeText(c.hex), `Copiar ${c.hex}`),
              botonTexto("Quitar", () => { d.colores.splice(i, 1); guardar(); dibujarColores(); }, `Quitar ${c.nombre}`))));
      })),
      d.colores.length ? null : el("p", { class: "secundario" }, "Sin colores todavía: agrégalos o usa el botón mágico."),
    );
  }

  function dibujarTipos() {
    d.tipografias.forEach((t) => cargarFuente(t.familia));
    poner(mod.tipos, 
      cabeza("m-tipos", "Tipografías", botonTexto("+ Agregar", () => { d.tipografias.push({ familia: "DM Sans", uso: "Textos", por_que: "" }); guardar(); dibujarTipos(); }, "Agregar tipografía")),
      ...d.tipografias.map((t, i) => {
        const familia = el("input", { value: t.familia, "aria-label": "Familia (Google Fonts)", style: { border: 0, font: "700 13px var(--mono)", padding: 0, background: "transparent", textTransform: "uppercase" } });
        const muestra = el("p", { class: "tipo__muestra", style: { fontFamily: `"${t.familia}", var(--texto)` } }, "Aa Bb — El café de la finca");
        familia.addEventListener("change", () => { t.familia = familia.value.trim(); cargarFuente(t.familia); muestra.style.fontFamily = `"${t.familia}", var(--texto)`; guardar(); });
        return el("div", { class: "tipo" }, familia, muestra,
          el("span", { class: "tipo__meta" }, [t.uso, t.por_que].filter(Boolean).join(" · ")),
          botonTexto("Quitar", () => { d.tipografias.splice(i, 1); guardar(); dibujarTipos(); }, `Quitar ${t.familia}`));
      }),
      d.tipografias.length ? null : el("p", { class: "secundario" }, "Escribe familias de Google Fonts o usa el botón mágico."),
    );
  }

  function dibujarEstilos() {
    poner(mod.estilos, 
      cabeza("m-estilos", "Estilos gráficos", botonTexto("+ Agregar", () => { d.estilos.push({ nombre: "Nuevo estilo", descripcion: "" }); guardar(); dibujarEstilos(); }, "Agregar estilo")),
      ...d.estilos.map((s, i) => {
        const nombre = el("input", { value: s.nombre, "aria-label": "Nombre del estilo", style: { border: 0, fontWeight: 700, padding: 0, background: "transparent", width: "100%" } });
        const desc = el("textarea", { rows: "2", "aria-label": "Descripción", style: { border: 0, padding: 0, background: "transparent", width: "100%", resize: "vertical" } });
        desc.value = s.descripcion;
        nombre.addEventListener("input", () => { s.nombre = nombre.value; guardar(); });
        desc.addEventListener("input", () => { s.descripcion = desc.value; guardar(); });
        return el("div", { class: "estilo" }, nombre, desc, botonTexto("Quitar", () => { d.estilos.splice(i, 1); guardar(); dibujarEstilos(); }, `Quitar ${s.nombre}`));
      }),
      d.estilos.length ? null : el("p", { class: "secundario" }, "Tipo de fotografía, ilustración, texturas, composición…"),
    );
  }

  // ----- Imágenes -----
  const cargando = new Map(); // id temporal → texto
  async function subirArchivos(archivos) {
    const validos = [...archivos].filter((f) => TIPOS.includes(f.type) && f.size <= MAX_MB * 1024 * 1024);
    if (validos.length < archivos.length) avisar("error", `Algunos archivos no se subieron: solo imágenes JPG, PNG, WebP o GIF de hasta ${MAX_MB} MB.`);
    for (const f of validos) {
      if (MODO_DEMO) { d.imagenes.push({ url: URL.createObjectURL(f), origen: "subida" }); continue; }
      const tmp = crypto.randomUUID();
      cargando.set(tmp, `Subiendo ${f.name}…`); dibujarImagenes();
      const ruta = `${fila.id}/${tmp}.${f.type.split("/")[1]}`;
      const { error } = await sb.storage.from("hub-moodboards").upload(ruta, f, { contentType: f.type });
      cargando.delete(tmp);
      if (error) avisar("error", `No se pudo subir ${f.name}.`);
      else { d.imagenes.push({ ruta, origen: "subida" }); guardar(); }
    }
    dibujarImagenes();
  }

  // ----- Buscador de fotos (Pexels) -----
  function abrirBuscador() {
    const dlg = el("dialog", { class: "panel buscador", "aria-label": "Buscar fotos" });
    const consulta = el("input", { type: "search", id: "b-consulta", placeholder: "Ej.: coffee farm hands, morning light", "aria-label": "Qué fotos buscar" });
    consulta.value = d.palabras_clave.slice(0, 3).join(" ");
    const resultados = el("div", { class: "resultados-fotos" });
    const aviso = el("div", { role: "status", "aria-live": "polite" });
    const mas = el("button", { type: "button", class: "boton boton--borde oculto" }, "Ver más");
    let pagina = 1;
    const agregadas = new Set();

    async function buscar(nueva = true) {
      if (MODO_DEMO) return poner(aviso, el("p", { class: "mensaje mensaje--info" }, "En la demostración la búsqueda está apagada. Conecta Supabase y la clave de Pixabay."));
      if (nueva) { pagina = 1; poner(resultados); }
      poner(aviso, el("p", { class: "secundario" }, "Buscando…"));
      try {
        const r = await invocar("hub-ia", { accion: "fotos_buscar", consulta: consulta.value, pagina });
        poner(aviso, r.fotos.length || !nueva ? null : el("p", { class: "secundario" }, "Sin resultados. Prueba otras palabras (en inglés suele haber más)."));
        resultados.append(...r.fotos.map((f) => {
          const boton = el("button", { type: "button", class: "foto-resultado", "aria-label": `Agregar foto de ${f.autor}${f.alt ? `: ${f.alt}` : ""}`, style: { background: f.color ?? "var(--crema-2)" } },
            el("img", { src: f.miniatura, alt: "", loading: "lazy" }),
            el("span", { class: "foto-resultado__autor" }, f.autor));
          boton.addEventListener("click", async () => {
            if (agregadas.has(f.id)) return;
            agregadas.add(f.id);
            boton.classList.add("foto-resultado--agregando");
            try {
              const { ruta } = await invocar("hub-ia", { accion: "fotos_agregar", moodboard_id: fila.id, url: f.grande });
              d.imagenes.push({ ruta, origen: "foto", fuente: f.fuente, autor: f.autor, enlace: f.enlace, alt: f.alt });
              guardar();
              dibujarImagenes();
              boton.classList.replace("foto-resultado--agregando", "foto-resultado--agregada");
            } catch (e) {
              agregadas.delete(f.id);
              boton.classList.remove("foto-resultado--agregando");
              poner(aviso, el("p", { class: "mensaje mensaje--error" }, e.message));
            }
          });
          return boton;
        }));
        mas.classList.toggle("oculto", !r.hay_mas);
      } catch (e) {
        poner(aviso, el("p", { class: "mensaje mensaje--error" }, e.message));
      }
    }
    mas.addEventListener("click", () => { pagina += 1; buscar(false); });

    dlg.append(el("div", { class: "panel__cuerpo" },
      el("div", { class: "panel__cabeza" },
        el("h2", { class: "titulo-m", style: { margin: 0 } }, "Buscar fotos"),
        el("button", { type: "button", class: "boton boton--texto", onclick: () => dlg.close() }, "Listo")),
      el("form", { class: "campo-precio", onsubmit: (e) => { e.preventDefault(); buscar(); } },
        consulta, el("button", { class: "boton boton--rojo", type: "submit" }, "Buscar")),
      el("p", { class: "secundario pequeno", style: { margin: 0 } }, "Toca una foto para agregarla al moodboard. Fotos gratuitas de ",
        el("a", { href: "https://pixabay.com", target: "_blank", rel: "noopener" }, "Pixabay"), " y ",
        el("a", { href: "https://www.pexels.com", target: "_blank", rel: "noopener" }, "Pexels"), "."),
      aviso, resultados, mas,
    ));
    document.body.append(dlg);
    dlg.addEventListener("close", () => dlg.remove());
    dlg.showModal();
    if (consulta.value) buscar(); else consulta.focus();
  }

  async function generarImagen(prompt) {
    const tmp = crypto.randomUUID();
    cargando.set(tmp, "✨ Generando imagen…"); dibujarImagenes();
    try {
      const { ruta } = await invocar("hub-ia", { accion: "moodboard_imagen", moodboard_id: fila.id, prompt });
      d.imagenes.push({ ruta, origen: "ia", prompt });
      guardar();
    } catch (e) {
      avisar("error", e.message);
    } finally {
      cargando.delete(tmp); dibujarImagenes();
    }
  }

  function dibujarImagenes() {
    const input = el("input", { type: "file", accept: TIPOS.join(","), multiple: true, class: "sr-only", id: "m-archivos" });
    input.addEventListener("change", () => subirArchivos(input.files));
    const zona = el("label", { class: "soltar no-print", for: "m-archivos" },
      el("strong", {}, "Arrastra imágenes aquí o haz clic para elegirlas"),
      el("span", { class: "secundario pequeno" }, `JPG, PNG, WebP o GIF · hasta ${MAX_MB} MB cada una`));
    ["dragenter", "dragover"].forEach((ev) => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.add("soltar--activo"); }));
    ["dragleave", "drop"].forEach((ev) => zona.addEventListener(ev, () => zona.classList.remove("soltar--activo")));
    zona.addEventListener("drop", (e) => { e.preventDefault(); subirArchivos(e.dataTransfer.files); });

    const grid = el("div", { class: "imagenes-grid" },
      d.imagenes.map((img, i) => {
        const foto = el("img", { alt: img.prompt ? `Referencia generada: ${img.prompt.slice(0, 80)}` : "Imagen de referencia", loading: "lazy" });
        urlImagen(img).then((u) => { if (u) foto.src = u; });
        return el("figure", { class: "imagen-mood", style: { margin: 0 } }, foto,
          img.origen === "ia" ? el("span", { class: "pildora pildora--aviso imagen-mood__ia" }, "IA") : null,
          img.origen === "pexels" || img.origen === "foto" ? el("figcaption", { class: "imagen-mood__credito" },
            "Foto: ", el("a", { href: img.enlace, target: "_blank", rel: "noopener" }, img.autor || img.fuente || "Pexels"), ` · ${img.fuente ?? "Pexels"}`) : null,
          el("button", { type: "button", class: "imagen-mood__quitar no-print", "aria-label": "Quitar imagen", onclick: async () => {
            d.imagenes.splice(i, 1); guardar(); dibujarImagenes();
            if (img.ruta && !MODO_DEMO) await sb.storage.from("hub-moodboards").remove([img.ruta]);
          } }, "×"));
      }),
      [...cargando.values()].map((t) => el("div", { class: "imagen-mood imagen-mood--cargando" }, t)),
    );

    const ideas = d.prompts_sugeridos.length ? el("details", { class: "no-print" },
      el("summary", { style: { cursor: "pointer", fontWeight: 700, minHeight: "36px" } }, `Ideas de imágenes de la IA (${d.prompts_sugeridos.length})`),
      el("div", { class: "rejilla", style: { gap: "8px", marginTop: "8px" } }, d.prompts_sugeridos.map((p) => el("div", { class: "estilo", style: { display: "flex", gap: "10px", alignItems: "center" } },
        el("span", { style: { flex: 1 } }, el("strong", {}, p.para), el("span", { class: "secundario pequeno", style: { display: "block" } }, p.prompt)),
        el("button", { type: "button", class: "boton boton--borde", onclick: () => generarImagen(p.prompt) }, "Generar"))))) : null;

    poner(mod.imagenes, cabeza("m-imagenes", "Imágenes de referencia",
      el("button", { type: "button", class: "boton boton--borde no-print", onclick: abrirBuscador }, "🔍 Buscar fotos")), zona, input, grid, ideas);
  }

  // ----- Botón mágico -----
  async function magia() {
    if (MODO_DEMO) return avisar("info", "En la demostración el botón mágico está apagado: así se ve un moodboard que ya llenó.");
    botonMagico.disabled = true;
    avisar("info", "✨ Pensando la dirección visual… (1 a 2 minutos)");
    try {
      const r = await invocar("hub-ia", { accion: "moodboard_autofill", moodboard_id: fila.id, descripcion: d.descripcion });
      const nueva = await leer(fila.id);
      Object.assign(d, nueva.datos);
      for (const k of ["palabras_clave", "colores", "tipografias", "estilos", "imagenes", "prompts_sugeridos"]) d[k] ??= [];
      dibujarTodo();
      if (r.imagenes_ia_disponibles && d.prompts_sugeridos.length) {
        avisar("info", "✨ Generando imágenes de referencia…");
        const cola = [...d.prompts_sugeridos];
        await Promise.all([0, 1, 2].map(async () => { while (cola.length) await generarImagen(cola.shift().prompt); }));
        avisar("ok", "Listo: revisa, cambia lo que quieras y descarga el PDF.");
      } else {
        avisar("ok", r.imagenes_ia_disponibles ? "Listo." : "Listo. Para generar imágenes con IA falta configurar Cloudflare; mientras tanto busca fotos o arrastra tus referencias.");
      }
    } catch (e) {
      avisar("error", e.message);
    } finally {
      botonMagico.disabled = false;
    }
  }
  const botonMagico = el("button", { type: "button", class: "boton boton-magico", onclick: magia }, "✨ Botón mágico");

  function dibujarTodo() { dibujarConcepto(); dibujarPalabras(); dibujarColores(); dibujarTipos(); dibujarEstilos(); dibujarImagenes(); }

  pagina(
    el("div", { class: "parrilla-cabeza no-print" }, el("a", { href: "#/", class: "boton boton--texto", style: { paddingLeft: 0 } }, "← Moodboards")),
    el("div", { class: "parrilla-cabeza" },
      el("div", {},
        el("p", { class: "etiqueta", style: { margin: 0 } }, fila.cliente),
        el("h1", { class: "titulo-l" }, fila.nombre, el("span", { class: "excl" }, "!"))),
      el("div", { class: "informe__acciones no-print", style: { margin: "0 0 0 auto", alignItems: "center" } },
        estadoGuardado, botonMagico,
        el("button", { type: "button", class: "boton boton--borde", onclick: () => window.print() }, "Descargar PDF"))),
    avisos,
    el("div", { class: "mood" }, mod.concepto, mod.palabras, mod.colores, mod.tipos, mod.estilos, mod.imagenes),
  );
  dibujarTodo();
  if (params.get("magia") === "1") {
    history.replaceState(null, "", `#/moodboard/${fila.id}`);
    magia();
  }
}

// ---------- Inicio ----------

async function router() {
  const [ruta, consulta] = location.hash.replace(/^#\/?/, "").split("?");
  const params = new URLSearchParams(consulta ?? "");
  if (ruta === "nuevo") return vistaNuevo(params);
  const m = ruta.match(/^moodboard\/([\w-]+)$/);
  if (m) return vistaMoodboard(m[1], params);
  return vistaLista();
}

(async () => {
  const sesion = await sesionActual();
  if (!sesion) { location.href = "../"; return; }
  email = sesion.user.email;
  window.addEventListener("hashchange", router);
  router();
})();
