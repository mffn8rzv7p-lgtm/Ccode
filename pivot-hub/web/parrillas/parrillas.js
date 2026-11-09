// App: Parrillas de contenido (calendario con una card por publicación)
import { MODO_DEMO, demo, el, invocar, paginaApp, sb, sesionActual } from "../assets/hub.js";

const app = document.getElementById("app");
let email = "";
const pagina = (...c) => paginaApp(app, "Parrillas", email, ...c);

const REDES = {
  instagram: { nombre: "Instagram", color: "#C13584" },
  tiktok: { nombre: "TikTok", color: "#121010" },
  facebook: { nombre: "Facebook", color: "#1877F2" },
  linkedin: { nombre: "LinkedIn", color: "#0A66C2" },
  youtube: { nombre: "YouTube", color: "#E62117" },
  x: { nombre: "X", color: "#5F5A54" },
};
const FORMATOS = ["Reel", "Carrusel", "Foto", "Historia", "Video", "Texto", "En vivo"];
const ESTADOS = {
  idea: { nombre: "Idea", color: "#E0D8CA" },
  diseno: { nombre: "En diseño", color: "#F2B33D" },
  aprobacion: { nombre: "Para aprobar", color: "#F0582A" },
  aprobada: { nombre: "Aprobada", color: "#2E8C72" },
  programada: { nombre: "Programada", color: "#0A66C2" },
  publicada: { nombre: "Publicada", color: "#121010" },
};
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const nombreMes = (iso) => {
  const t = new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const hoyISO = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

// ---------- Datos ----------

let demoCache = null;
async function datosDemo() {
  if (!demoCache) demoCache = await demo();
  return demoCache;
}

async function listar() {
  if (MODO_DEMO) {
    const d = await datosDemo();
    return [{ ...d.parrilla, total: d.publicaciones.length }];
  }
  const { data, error } = await sb.from("hub_parrillas").select("id, cliente, mes, redes, hub_publicaciones(count)").order("mes", { ascending: false }).limit(60);
  if (error) throw error;
  return data.map((p) => ({ ...p, total: p.hub_publicaciones?.[0]?.count ?? 0 }));
}

async function leer(id) {
  if (MODO_DEMO) {
    const d = await datosDemo();
    return { parrilla: d.parrilla, publicaciones: d.publicaciones };
  }
  const [p, pubs] = await Promise.all([
    sb.from("hub_parrillas").select("*").eq("id", id).single(),
    sb.from("hub_publicaciones").select("*").eq("parrilla_id", id).order("fecha").order("orden"),
  ]);
  if (p.error) throw p.error;
  return { parrilla: p.data, publicaciones: pubs.data ?? [] };
}

async function guardarPub(pub) {
  if (MODO_DEMO) return pub; // en la demo los cambios viven solo en pantalla
  const { id, parrilla_id: _p, creado_en: _c, actualizado_en: _a, _url, ...cambios } = pub;
  const { data, error } = await sb.from("hub_publicaciones").update(cambios).eq("id", id).select().single();
  if (error) throw new Error("No se pudo guardar la publicación.");
  return data;
}

async function crearPub(parrilla, fecha) {
  const base = { parrilla_id: parrilla.id, fecha, red: parrilla.redes[0] ?? "instagram", formato: "Reel", titulo: "Nueva publicación", estado: "idea", copy: "", hashtags: [] };
  if (MODO_DEMO) return { ...base, id: `demo-${crypto.randomUUID()}` };
  const { data, error } = await sb.from("hub_publicaciones").insert(base).select().single();
  if (error) throw new Error("No se pudo crear la publicación.");
  return data;
}

async function borrarPub(pub) {
  if (MODO_DEMO) return;
  const { error } = await sb.from("hub_publicaciones").delete().eq("id", pub.id);
  if (error) throw new Error("No se pudo borrar.");
}

async function urlArte(ruta) {
  if (!ruta || MODO_DEMO) return null;
  const { data } = await sb.storage.from("hub-moodboards").createSignedUrl(ruta, 3600);
  return data?.signedUrl ?? null;
}

// ---------- Lista ----------

async function vistaLista() {
  const lista = el("div", { class: "rejilla rejilla--3" }, el("p", { class: "secundario" }, "Cargando…"));
  pagina(
    el("section", { class: "hero-hub" },
      el("p", { class: "etiqueta" }, "Contenido"),
      el("h1", { class: "titulo-xl" }, "Parrillas", el("span", { class: "excl" }, "!")),
      el("p", { class: "parrafo-grande secundario" }, "La parrilla del mes en un calendario: cada publicación es una card que se mueve de día, se edita y avanza de idea a publicada."),
      el("a", { class: "boton boton--rojo", href: "#/nueva" }, "Nueva parrilla"),
    ),
    lista,
  );
  try {
    const filas = await listar();
    lista.replaceChildren(...(filas.length ? filas.map((p) => el("a", { class: "tarjeta app-tarjeta", href: `#/parrilla/${p.id}`, style: { textDecoration: "none" } },
      el("span", { class: "etiqueta" }, nombreMes(p.mes)),
      el("h2", { class: "titulo-m" }, p.cliente),
      el("div", { class: "filtros", style: { margin: 0 } }, p.redes.map((r) => el("span", { class: "pildora" }, el("span", { class: "punto-red", style: { background: REDES[r]?.color } }), " ", REDES[r]?.nombre ?? r))),
      el("span", { class: "secundario pequeno" }, `${p.total} publicaciones`),
    )) : [el("p", { class: "secundario" }, "Todavía no hay parrillas.")]));
  } catch (_e) {
    lista.replaceChildren(el("p", { class: "mensaje mensaje--error" }, "No pudimos cargar las parrillas."));
  }
}

// ---------- Nueva parrilla ----------

async function vistaNueva(params) {
  let brief = null;
  const briefId = params.get("brief");
  if (briefId) {
    if (MODO_DEMO) brief = await (await fetch("../briefs/demo.json")).json();
    else brief = (await sb.from("hub_briefs").select("id, cliente, proyecto, documento").eq("id", briefId).single()).data;
  }
  const estado = el("div", { role: "status", "aria-live": "polite" });
  const proximoMes = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 7); })();
  const cliente = el("input", { id: "cliente", value: brief?.cliente ?? "", placeholder: "Nombre del cliente" });
  const mes = el("input", { id: "mes", type: "month", value: proximoMes });
  const objetivo = el("textarea", { id: "objetivo", rows: "2", placeholder: "Ej.: vender más kits de regalo en la tienda online" });
  objetivo.value = brief?.documento?.objetivos?.comunicacion ?? "";
  const pilares = el("input", { id: "pilares", placeholder: "Separados por comas. Ej.: Origen, Cómo preparar, Promociones" });
  const notas = el("textarea", { id: "notas", rows: "3", placeholder: "Fechas importantes, lanzamientos, lo que no se puede publicar…" });
  const frec = {};
  const redes = Object.entries(REDES).map(([id, r]) => {
    const casilla = el("input", { type: "checkbox", value: id, checked: id === "instagram" || null });
    const n = el("input", { type: "number", min: "1", max: "14", value: id === "instagram" ? "3" : "2", "aria-label": `Publicaciones por semana en ${r.nombre}`, style: { width: "72px", minHeight: "40px" } });
    frec[id] = { casilla, n };
    return el("div", { class: "campo-precio", style: { gap: "10px" } },
      el("label", { class: "casilla", style: { minWidth: "150px" } }, casilla, el("span", { class: "punto-red", style: { background: r.color } }), r.nombre),
      n, el("span", { class: "secundario pequeno" }, "por semana"));
  });
  const generar = el("input", { type: "checkbox", checked: true });
  const crear = el("button", { class: "boton boton--rojo", type: "submit" }, "Crear parrilla");

  const form = el("form", { class: "rejilla", onsubmit: async (e) => {
    e.preventDefault();
    const error = (t) => estado.replaceChildren(el("p", { class: "mensaje mensaje--error" }, t));
    const elegidas = Object.entries(frec).filter(([, f]) => f.casilla.checked);
    if (!cliente.value.trim()) return error("Escribe el cliente.");
    if (!mes.value) return error("Elige el mes.");
    if (!elegidas.length) return error("Elige al menos una red.");
    if (MODO_DEMO) return error("Estás en modo demostración: conecta Supabase para crear parrillas.");
    crear.disabled = true;
    try {
      const { data, error: err } = await sb.from("hub_parrillas").insert({
        cliente: cliente.value.trim(),
        mes: `${mes.value}-01`,
        brief_id: brief?.id ?? null,
        redes: elegidas.map(([id]) => id),
        pilares: pilares.value.split(",").map((s) => s.trim()).filter(Boolean),
        objetivo: objetivo.value.trim() || null,
        notas: notas.value.trim() || null,
      }).select("id").single();
      if (err) throw err;
      if (generar.checked) {
        estado.replaceChildren(el("p", { class: "mensaje mensaje--info" }, "✨ Armando la parrilla del mes… (1 a 3 minutos)"));
        try {
          await invocar("hub-ia", { accion: "parrilla_generar", parrilla_id: data.id, frecuencia: Object.fromEntries(elegidas.map(([id, f]) => [id, Number(f.n.value)])) });
        } catch (iaErr) {
          sessionStorage.setItem("aviso-parrilla", iaErr.message);
        }
      }
      location.hash = `#/parrilla/${data.id}`;
    } catch (_e) {
      error("No pudimos crear la parrilla. Inténtalo de nuevo.");
      crear.disabled = false;
    }
  } },
    brief ? el("p", { class: "mensaje mensaje--info" }, `Basada en el brief "${brief.proyecto}".`) : null,
    el("div", { class: "rejilla rejilla--2" },
      el("div", { class: "campo" }, el("label", { for: "cliente" }, "Cliente"), cliente),
      el("div", { class: "campo" }, el("label", { for: "mes" }, "Mes"), mes)),
    el("fieldset", { style: { border: 0, padding: 0, margin: 0 } },
      el("legend", { style: { fontWeight: 700, marginBottom: "6px" } }, "Redes y frecuencia"),
      el("div", { class: "rejilla", style: { gap: "4px" } }, redes)),
    el("div", { class: "campo" }, el("label", { for: "objetivo" }, "Objetivo del mes"), objetivo),
    el("div", { class: "campo" }, el("label", { for: "pilares" }, "Pilares de contenido (opcional)"), pilares),
    el("div", { class: "campo" }, el("label", { for: "notas" }, "Notas (opcional)"), notas),
    el("label", { class: "casilla" }, generar, "✨ Llenar el mes con IA al crearla"),
    el("div", {}, crear),
    estado,
  );

  pagina(el("section", { class: "contenedor--angosto", style: { padding: "32px 0 64px" } },
    el("a", { href: "#/", class: "boton boton--texto", style: { paddingLeft: 0 } }, "← Volver"),
    el("p", { class: "etiqueta" }, "Nueva parrilla"),
    el("h1", { class: "titulo-l", style: { marginBottom: "20px" } }, "Planeemos el mes", el("span", { class: "excl" }, "!")),
    el("div", { class: "tarjeta" }, form),
  ));
}

// ---------- Calendario ----------

function semanasDelMes(mesISO) {
  const [a, m] = mesISO.slice(0, 7).split("-").map(Number);
  const primero = new Date(Date.UTC(a, m - 1, 1));
  const inicio = new Date(primero);
  inicio.setUTCDate(1 - ((primero.getUTCDay() + 6) % 7)); // lunes anterior o igual
  const dias = [];
  for (let d = new Date(inicio); dias.length < 42; d.setUTCDate(d.getUTCDate() + 1)) {
    dias.push({ iso: d.toISOString().slice(0, 10), num: d.getUTCDate(), delMes: d.getUTCMonth() === m - 1 });
  }
  // quita la última semana si es toda del mes siguiente
  while (dias.length > 28 && dias.slice(-7).every((x) => !x.delMes)) dias.splice(-7);
  return dias;
}

async function vistaParrilla(id) {
  pagina(el("p", { class: "secundario", style: { padding: "40px 0" } }, "Cargando…"));
  let datos;
  try { datos = await leer(id); } catch (_e) {
    return pagina(el("p", { class: "mensaje mensaje--error", style: { margin: "40px 0" } }, "No encontramos esa parrilla."));
  }
  const { parrilla } = datos;
  let pubs = datos.publicaciones;
  const filtroRedes = new Set(parrilla.redes);
  let filtroEstado = null;
  const urls = new Map();
  for (const p of pubs) if (p.arte_url) urlArte(p.arte_url).then((u) => { if (u) { urls.set(p.id, u); dibujar(); } });

  const avisos = el("div", { role: "status", "aria-live": "polite" });
  const pendiente = sessionStorage.getItem("aviso-parrilla");
  if (pendiente) {
    sessionStorage.removeItem("aviso-parrilla");
    avisos.replaceChildren(el("p", { class: "mensaje mensaje--error" }, `La parrilla se creó, pero la IA no pudo llenarla: ${pendiente}`));
  }
  const avisar = (clase, t) => avisos.replaceChildren(el("p", { class: `mensaje mensaje--${clase}` }, t));

  const contResumen = el("div", { class: "resumen-mes" });
  const contFiltros = el("div", { class: "filtros", role: "toolbar", "aria-label": "Filtros" });
  const contCalendario = el("div", { class: "calendario", role: "grid", "aria-label": `Calendario de ${nombreMes(parrilla.mes)}` });
  const contAgenda = el("div", { class: "agenda" });
  const panel = el("dialog", { class: "panel", "aria-label": "Publicación" });

  const visibles = () => pubs.filter((p) => filtroRedes.has(p.red) && (!filtroEstado || p.estado === filtroEstado));

  function card(p) {
    const r = REDES[p.red] ?? { nombre: p.red, color: "#8A847C" };
    const e = ESTADOS[p.estado] ?? ESTADOS.idea;
    const b = el("button", { class: "pub", type: "button", draggable: "true", style: { "--color-red": r.color }, "aria-label": `${p.titulo}, ${r.nombre}, ${p.formato}, ${e.nombre}`, onclick: () => abrirPanel(p) },
      urls.get(p.id) ? el("img", { class: "pub__arte", src: urls.get(p.id), alt: "" }) : null,
      el("span", { class: "pub__red" }, `${r.nombre} · ${p.formato}`),
      el("span", { class: "pub__titulo" }, p.titulo || "Sin título"),
      el("span", { class: "pub__fila" },
        p.hora ? el("span", { class: "pub__red" }, p.hora) : null,
        el("span", { class: "estado-chip" }, el("span", { class: "punto-red", style: { background: e.color, width: "8px", height: "8px" } }), e.nombre)),
    );
    b.addEventListener("dragstart", (ev) => { ev.dataTransfer.setData("text/plain", p.id); ev.dataTransfer.effectAllowed = "move"; b.classList.add("pub--arrastrando"); });
    b.addEventListener("dragend", () => b.classList.remove("pub--arrastrando"));
    return b;
  }

  async function mover(pubId, fecha) {
    const p = pubs.find((x) => x.id === pubId);
    if (!p || p.fecha === fecha) return;
    const antes = p.fecha;
    p.fecha = fecha;
    dibujar();
    try { Object.assign(p, await guardarPub({ ...p })); } catch (e) { p.fecha = antes; dibujar(); avisar("error", e.message); }
  }

  async function agregar(fecha) {
    try {
      const nueva = await crearPub(parrilla, fecha);
      pubs.push(nueva);
      dibujar();
      abrirPanel(nueva);
    } catch (e) { avisar("error", e.message); }
  }

  function dibujar() {
    // resumen
    const porEstado = Object.keys(ESTADOS).map((k) => [k, pubs.filter((p) => p.estado === k).length]).filter(([, n]) => n);
    contResumen.replaceChildren(
      el("span", { class: "pildora" }, `${pubs.length} publicaciones`),
      ...porEstado.map(([k, n]) => el("button", { type: "button", class: "filtro", "aria-pressed": String(filtroEstado === k), onclick: () => { filtroEstado = filtroEstado === k ? null : k; dibujar(); } },
        el("span", { class: "punto-red", style: { background: ESTADOS[k].color } }), `${ESTADOS[k].nombre}: ${n}`)),
    );
    contFiltros.replaceChildren(...parrilla.redes.map((r) => el("button", { type: "button", class: "filtro", "aria-pressed": String(filtroRedes.has(r)), onclick: () => {
      if (filtroRedes.has(r) && filtroRedes.size > 1) filtroRedes.delete(r); else filtroRedes.add(r);
      dibujar();
    } }, el("span", { class: "punto-red", style: { background: REDES[r]?.color } }), REDES[r]?.nombre ?? r)));

    const vis = visibles();
    const hoy = hoyISO();
    contCalendario.replaceChildren(
      ...DIAS.map((d) => el("div", { class: "calendario__dow", role: "columnheader" }, d)),
      ...semanasDelMes(parrilla.mes).map((d) => {
        const celda = el("div", { class: `dia${d.delMes ? "" : " dia--fuera"}${d.iso === hoy ? " dia--hoy" : ""}`, role: "gridcell", "aria-label": d.iso },
          el("div", { class: "dia__cabeza" },
            el("span", { class: "dia__num" }, String(d.num)),
            d.delMes ? el("button", { class: "dia__agregar", type: "button", "aria-label": `Agregar publicación el ${d.num}`, onclick: () => agregar(d.iso) }, "+") : null),
          vis.filter((p) => p.fecha === d.iso).map(card),
        );
        if (d.delMes) {
          celda.addEventListener("dragover", (ev) => { ev.preventDefault(); celda.classList.add("dia--destino"); });
          celda.addEventListener("dragleave", () => celda.classList.remove("dia--destino"));
          celda.addEventListener("drop", (ev) => { ev.preventDefault(); celda.classList.remove("dia--destino"); mover(ev.dataTransfer.getData("text/plain"), d.iso); });
        }
        return celda;
      }),
    );

    // agenda (celular): solo días con publicaciones
    const fechas = [...new Set(vis.map((p) => p.fecha))].sort();
    contAgenda.replaceChildren(...(fechas.length ? fechas.map((f) => el("section", { class: "agenda__dia" },
      el("h2", { class: "agenda__fecha" }, (() => { const t = new Date(`${f}T12:00:00`).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }); return t.charAt(0).toUpperCase() + t.slice(1); })()),
      vis.filter((p) => p.fecha === f).map(card),
    )) : [el("p", { class: "secundario" }, "No hay publicaciones con estos filtros.")]));
  }

  function abrirPanel(p) {
    const r = p;
    const campo = (id, etiqueta, control) => el("div", { class: "campo" }, el("label", { for: id }, etiqueta), control);
    const sel = (id, opciones, valor) => el("select", { id }, opciones.map(([v, t]) => el("option", { value: v, selected: v === valor || null }, t)));
    const f = {
      titulo: el("input", { id: "p-titulo", value: r.titulo ?? "" }),
      fecha: el("input", { id: "p-fecha", type: "date", value: r.fecha, min: parrilla.mes.slice(0, 8) + "01" }),
      hora: el("input", { id: "p-hora", type: "time", value: r.hora ?? "" }),
      red: sel("p-red", parrilla.redes.map((x) => [x, REDES[x]?.nombre ?? x]), r.red),
      formato: sel("p-formato", FORMATOS.map((x) => [x, x]), r.formato),
      pilar: el("input", { id: "p-pilar", value: r.pilar ?? "", list: "pilares-lista" }),
      copy: el("textarea", { id: "p-copy", rows: "6" }),
      hashtags: el("input", { id: "p-hashtags", value: (r.hashtags ?? []).join(" ") }),
      idea: el("textarea", { id: "p-idea", rows: "3" }),
      arte: el("input", { id: "p-arte", type: "file", accept: "image/png,image/jpeg,image/webp" }),
    };
    f.copy.value = r.copy ?? "";
    f.idea.value = r.idea_visual ?? "";
    let estadoSel = r.estado;
    const estados = el("div", { class: "estados", role: "group", "aria-label": "Estado" }, Object.entries(ESTADOS).map(([k, e]) =>
      el("button", { type: "button", "aria-pressed": String(k === estadoSel), onclick: (ev) => {
        estadoSel = k;
        ev.currentTarget.parentElement.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === ev.currentTarget)));
      } }, e.nombre)));
    const aviso = el("div", { role: "status", "aria-live": "polite" });

    const guardar = el("button", { class: "boton boton--rojo", type: "submit" }, "Guardar");
    const form = el("form", { class: "panel__cuerpo", onsubmit: async (ev) => {
      ev.preventDefault();
      guardar.disabled = true;
      try {
        let arte = r.arte_url ?? null;
        if (f.arte.files[0] && !MODO_DEMO) {
          const archivo = f.arte.files[0];
          const ruta = `parrillas/${parrilla.id}/${crypto.randomUUID()}.${archivo.type.split("/")[1]}`;
          const { error } = await sb.storage.from("hub-moodboards").upload(ruta, archivo, { contentType: archivo.type });
          if (error) throw new Error("No se pudo subir el arte.");
          arte = ruta;
          urls.delete(r.id);
          urlArte(ruta).then((u) => { if (u) { urls.set(r.id, u); dibujar(); } });
        }
        const cambios = {
          ...r,
          titulo: f.titulo.value.trim(),
          fecha: f.fecha.value || r.fecha,
          hora: f.hora.value || null,
          red: f.red.value,
          formato: f.formato.value,
          pilar: f.pilar.value.trim() || null,
          copy: f.copy.value,
          hashtags: f.hashtags.value.split(/\s+/).filter(Boolean).map((h) => (h.startsWith("#") ? h : `#${h}`)),
          idea_visual: f.idea.value.trim() || null,
          arte_url: arte,
          estado: estadoSel,
        };
        Object.assign(r, await guardarPub(cambios));
        dibujar();
        panel.close();
      } catch (e) {
        aviso.replaceChildren(el("p", { class: "mensaje mensaje--error" }, e.message));
        guardar.disabled = false;
      }
    } },
      el("div", { class: "panel__cabeza" },
        el("h2", { class: "titulo-m", style: { margin: 0 } }, "Publicación"),
        el("button", { type: "button", class: "boton boton--texto", onclick: () => panel.close() }, "Cerrar")),
      estados,
      campo("p-titulo", "Título interno", f.titulo),
      el("div", { class: "rejilla rejilla--2" }, campo("p-fecha", "Fecha", f.fecha), campo("p-hora", "Hora", f.hora),
        campo("p-red", "Red", f.red), campo("p-formato", "Formato", f.formato)),
      campo("p-pilar", "Pilar", f.pilar),
      el("datalist", { id: "pilares-lista" }, [...new Set([...(parrilla.pilares ?? []), ...pubs.map((x) => x.pilar).filter(Boolean)])].map((x) => el("option", { value: x }))),
      campo("p-copy", "Copy", f.copy),
      campo("p-hashtags", "Hashtags", f.hashtags),
      campo("p-idea", "Idea visual / guion", f.idea),
      campo("p-arte", "Arte (imagen)", f.arte),
      urls.get(r.id) ? el("img", { src: urls.get(r.id), alt: "Arte actual", style: { maxWidth: "200px", borderRadius: "12px" } }) : null,
      el("div", { class: "vista-previa" },
        el("span", { class: "etiqueta" }, "Así se lee el post"),
        el("p", {}, f.copy.value || "(sin copy)"),
        el("p", { style: { color: "var(--rojo-hondo)" } }, (r.hashtags ?? []).join(" "))),
      el("div", { class: "informe__acciones" },
        guardar,
        el("button", { type: "button", class: "boton boton--borde", onclick: async () => {
          if (!confirm("¿Borrar esta publicación?")) return;
          try { await borrarPub(r); pubs = pubs.filter((x) => x.id !== r.id); dibujar(); panel.close(); } catch (e) { aviso.replaceChildren(el("p", { class: "mensaje mensaje--error" }, e.message)); }
        } }, "Borrar")),
      aviso,
    );
    panel.replaceChildren(form);
    panel.showModal();
  }

  function dialogoIA() {
    const d = el("dialog", { class: "hoja-app", style: { width: "min(460px, calc(100% - 24px))" } });
    const nums = {};
    const aviso = el("div", { role: "status", "aria-live": "polite" });
    const reemplazar = el("input", { type: "checkbox", checked: true });
    const ir = el("button", { class: "boton boton-magico", type: "submit" }, "✨ Generar");
    d.append(el("form", { class: "panel__cuerpo", onsubmit: async (ev) => {
      ev.preventDefault();
      ir.disabled = true;
      aviso.replaceChildren(el("p", { class: "mensaje mensaje--info" }, "✨ Armando la parrilla… (1 a 3 minutos)"));
      try {
        const res = await invocar("hub-ia", { accion: "parrilla_generar", parrilla_id: parrilla.id, reemplazar: reemplazar.checked,
          frecuencia: Object.fromEntries(Object.entries(nums).map(([k, n]) => [k, Number(n.value)])) });
        d.close();
        avisar("ok", `Listo: ${res.creadas} publicaciones nuevas.`);
        vistaParrilla(parrilla.id);
      } catch (e) {
        aviso.replaceChildren(el("p", { class: "mensaje mensaje--error" }, e.message));
        ir.disabled = false;
      }
    } },
      el("h2", { class: "titulo-m", style: { margin: 0 } }, "Llenar el mes con IA"),
      el("p", { class: "secundario", style: { margin: 0 } }, "Usa el objetivo, los pilares y el brief de la parrilla."),
      parrilla.redes.map((r) => {
        nums[r] = el("input", { type: "number", min: "0", max: "14", value: "3", style: { width: "72px", minHeight: "40px" }, "aria-label": `Por semana en ${REDES[r]?.nombre}` });
        return el("div", { class: "campo-precio" }, el("span", { style: { minWidth: "120px" } }, REDES[r]?.nombre ?? r), nums[r], el("span", { class: "secundario pequeno" }, "por semana"));
      }),
      el("label", { class: "casilla" }, reemplazar, "Reemplazar las que siguen en \"Idea\""),
      el("div", { class: "informe__acciones" }, ir, el("button", { type: "button", class: "boton boton--borde", onclick: () => d.close() }, "Cancelar")),
      aviso,
    ));
    document.body.append(d);
    d.addEventListener("close", () => d.remove());
    d.showModal();
  }

  pagina(
    el("div", { class: "parrilla-cabeza no-print" },
      el("a", { href: "#/", class: "boton boton--texto", style: { paddingLeft: 0 } }, "← Parrillas")),
    el("div", { class: "parrilla-cabeza" },
      el("div", {},
        el("p", { class: "etiqueta", style: { margin: 0 } }, parrilla.cliente),
        el("h1", { class: "titulo-l" }, nombreMes(parrilla.mes), el("span", { class: "excl" }, "!"))),
      el("div", { class: "informe__acciones no-print", style: { margin: "0 0 0 auto" } },
        el("button", { type: "button", class: "boton boton-magico", onclick: () => (MODO_DEMO ? avisar("info", "En la demostración la IA está apagada.") : dialogoIA()) }, "✨ Llenar con IA"),
        el("button", { type: "button", class: "boton boton--borde", onclick: () => window.print() }, "Descargar PDF"))),
    parrilla.objetivo ? el("p", { class: "secundario", style: { margin: "0 0 14px" } }, el("strong", {}, "Objetivo: "), parrilla.objetivo) : null,
    avisos,
    el("div", { class: "no-print" }, contResumen, contFiltros),
    contCalendario,
    contAgenda,
    panel,
  );
  dibujar();
}

// ---------- Inicio ----------

async function router() {
  const [ruta, consulta] = location.hash.replace(/^#\/?/, "").split("?");
  if (ruta === "nueva") return vistaNueva(new URLSearchParams(consulta ?? ""));
  const m = ruta.match(/^parrilla\/([\w-]+)$/);
  if (m) return vistaParrilla(m[1]);
  return vistaLista();
}

(async () => {
  const sesion = await sesionActual();
  if (!sesion) { location.href = "../"; return; }
  email = sesion.user.email;
  window.addEventListener("hashchange", router);
  router();
})();
