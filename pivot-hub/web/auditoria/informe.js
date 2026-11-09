// Dibuja el informe (pantalla y PDF). Todo el texto se inserta como texto, nunca como HTML.
import { el, formatoFecha, formatoNumero } from "../assets/hub.js";

const RAIZ = "../";

function cabeza(numero, etiqueta, titulo) {
  return el("div", { class: "seccion__cabeza" },
    el("span", { class: "etiqueta" }, `${String(numero).padStart(2, "0")} — ${etiqueta}`),
    titulo ? el("h2", { class: "titulo-l" }, titulo, el("span", { class: "excl" }, "!")) : null,
  );
}

function kpi(valor, nombre) {
  return el("div", { class: "kpi" }, el("div", { class: "kpi__valor" }, valor), el("div", { class: "kpi__nombre" }, nombre));
}

function pct(n) {
  return n === null || n === undefined ? "—" : `${formatoNumero(n, n < 10 ? 2 : 1)} %`;
}

function tabla(cabeceras, filas, { numericas = [] } = {}) {
  return el("div", { class: "tabla-envoltura" },
    el("table", { class: "tabla" },
      el("thead", {}, el("tr", {}, cabeceras.map((c, i) => el("th", { class: numericas.includes(i) ? "num" : null, scope: "col" }, c)))),
      el("tbody", {}, filas.map((f) => el("tr", { class: f.resaltar ? "resaltar" : null },
        f.celdas.map((c, i) => el("td", { class: numericas.includes(i) ? "num" : null }, c))))),
    ),
  );
}

function hallazgos(lista, tipo) {
  return lista.map((h) => el("div", { class: "hallazgo" },
    el("strong", {}, el("span", { class: tipo === "ok" ? "marca-ok" : "marca-no", "aria-hidden": "true" }, tipo === "ok" ? "+" : "–"), h.titulo),
    el("span", {}, h.detalle),
    h.evidencia ? el("span", { class: "evidencia" }, h.evidencia) : null,
  ));
}

function formatoMasUsado(m) {
  return m?.por_formato?.[0]?.formato ?? "—";
}

function mejorFormato(m) {
  const candidatos = (m?.por_formato ?? []).filter((f) => f.interaccion_promedio !== null && f.publicaciones >= 2);
  if (!candidatos.length) return "—";
  return candidatos.sort((a, b) => b.interaccion_promedio - a.interaccion_promedio)[0].formato;
}

export function renderInforme(fila) {
  const a = fila.auditoria;
  const e = fila.estrategia;
  const datos = fila.datos ?? {};
  const m = datos.cuenta?.metricas ?? null;
  let n = 0;

  const portada = el("header", { class: "portada" },
    el("div", { class: "portada__arriba" },
      el("img", { src: `${RAIZ}assets/pivot-logo.png`, alt: "Pivot Agencia", width: "120", height: "30" }),
      el("div", { class: "portada__meta" }, "Auditoría de Instagram", el("br"), formatoFecha(fila.creado_en)),
    ),
    el("p", { class: "etiqueta" }, "Preparado por Pivot Agencia para"),
    el("div", { class: "portada__cuenta" },
      m?.foto ? el("img", { class: "portada__foto", src: m.foto, alt: "", referrerpolicy: "no-referrer", onerror: (ev) => ev.target.remove() }) : null,
      el("div", {},
        el("h1", { class: "titulo-xl" }, `@${fila.cuenta}`),
        m?.nombre ? el("p", { class: "secundario", style: { margin: "6px 0 0", fontSize: "18px" } }, m.nombre) : null,
      ),
    ),
    m ? el("div", { class: "kpis" },
      kpi(formatoNumero(m.seguidores), "seguidores"),
      kpi(pct(m.interaccion.promedio), "interacción promedio por publicación"),
      kpi(formatoNumero(m.publicaciones_por_semana, 1), "publicaciones por semana"),
      kpi(m.dias_desde_ultima === null ? "—" : formatoNumero(m.dias_desde_ultima), "días desde la última publicación"),
    ) : el("p", { class: "mensaje mensaje--info", style: { marginTop: "20px" } },
      "Análisis hecho con capturas de pantalla: las cifras salen de lo que se ve en ellas."),
    m ? el("p", { class: "secundario pequeno", style: { margin: "8px 0 0" } },
      `Basado en las últimas ${m.muestra} publicaciones (${formatoFecha(m.periodo.desde)} a ${formatoFecha(m.periodo.hasta)}). Datos públicos leídos el ${formatoFecha(datos.obtenido_en)}.`) : null,
  );

  const secciones = [];

  // 01 Resumen
  secciones.push(el("section", { class: "seccion" },
    cabeza(++n, "Resumen", "Cómo está tu cuenta hoy"),
    el("p", { class: "parrafo-grande" }, a.resumen),
    el("div", { class: "destacado" },
      el("span", { class: "etiqueta" }, "Lo que más movería tus resultados"),
      el("p", {}, a.accion_principal),
    ),
  ));

  // 02 Salud
  secciones.push(el("section", { class: "seccion" },
    cabeza(++n, "Salud de la cuenta", null),
    el("div", { class: "rejilla rejilla--2" },
      [["Comunidad", a.salud.comunidad], ["Interacción", a.salud.interaccion], ["Constancia", a.salud.constancia], ["Formatos", a.salud.formatos]]
        .map(([t, txt]) => el("div", { class: "tarjeta" }, el("span", { class: "etiqueta" }, t), el("p", { style: { margin: "8px 0 0" } }, txt))),
    ),
  ));

  // 03 Puntuación
  secciones.push(el("section", { class: "seccion" },
    cabeza(++n, "Puntuación", "Tu cuenta, de 1 a 10"),
    el("div", {}, a.puntuaciones.map((p) => {
      const nota = Math.max(0, Math.min(10, Number(p.nota) || 0));
      return el("div", { class: "nota" },
        el("strong", {}, p.area),
        el("div", { class: "nota__barra", role: "img", "aria-label": `${nota} de 10` },
          el("div", { class: "nota__relleno", style: { width: `${nota * 10}%` } })),
        el("span", { class: "nota__num" }, String(nota)),
        el("span", { class: "nota__porque" }, p.porque),
      );
    })),
  ));

  // 04 Datos: formatos y mejores publicaciones
  if (m) {
    secciones.push(el("section", { class: "seccion" },
      cabeza(++n, "Lo que dicen los números", null),
      el("div", { class: "rejilla" },
        tabla(["Formato", "Publicaciones", "Interacción promedio"],
          m.por_formato.map((f) => ({ celdas: [f.formato, formatoNumero(f.publicaciones), pct(f.interaccion_promedio)] })),
          { numericas: [1, 2] }),
        m.mejores.length ? el("div", {},
          el("h3", { class: "titulo-m", style: { margin: "16px 0 10px" } }, "Las publicaciones que mejor funcionaron"),
          tabla(["Fecha", "Formato", "Me gusta", "Comentarios", "Interacción", "Publicación"],
            m.mejores.map((p) => ({ celdas: [
              formatoFecha(p.fecha, { day: "numeric", month: "short" }),
              p.formato,
              formatoNumero(p.me_gusta),
              formatoNumero(p.comentarios),
              pct(p.interaccion),
              p.enlace
                ? el("a", { href: p.enlace, target: "_blank", rel: "noopener" }, (p.texto || "Ver publicación").slice(0, 70) + ((p.texto ?? "").length > 70 ? "…" : ""))
                : (p.texto || "").slice(0, 70),
            ] })),
            { numericas: [2, 3, 4] }),
        ) : null,
        m.me_gusta_ocultos ? el("p", { class: "mensaje mensaje--info" }, "La cuenta oculta los me gusta: la interacción se calcula solo con comentarios.") : null,
      ),
    ));
  }

  // 05 Qué funciona / qué no
  secciones.push(el("section", { class: "seccion" },
    cabeza(++n, "Hallazgos", "Qué funciona y qué no"),
    el("div", { class: "rejilla rejilla--2" },
      el("div", { class: "tarjeta" }, el("span", { class: "etiqueta", style: { color: "var(--verde)" } }, "Funciona"), hallazgos(a.que_funciona, "ok")),
      el("div", { class: "tarjeta" }, el("span", { class: "etiqueta" }, "No está funcionando"), hallazgos(a.que_no_funciona, "no")),
    ),
  ));

  // 06 Perfil
  secciones.push(el("section", { class: "seccion" },
    cabeza(++n, "Perfil", "Tu vitrina"),
    el("p", { class: "parrafo-grande" }, a.perfil.diagnostico),
    m?.biografia ? el("p", { class: "secundario pequeno" }, "Biografía actual: ", el("em", {}, m.biografia)) : null,
    el("div", { class: "rejilla rejilla--2", style: { margin: "12px 0" } },
      a.perfil.biografias_propuestas.map((b, i) => el("div", {},
        el("span", { class: "etiqueta" }, `Biografía propuesta ${i + 1}`),
        el("div", { class: "bio", style: { marginTop: "6px" } }, b),
      ))),
    el("ul", { class: "lista" }, a.perfil.recomendaciones.map((r) => el("li", {}, r))),
  ));

  // 07 Competencia
  const comps = (datos.competidores ?? []);
  if (comps.length || a.competencia.length) {
    const filas = [];
    if (m) filas.push({ resaltar: true, celdas: [`@${fila.cuenta}`, formatoNumero(m.seguidores), pct(m.interaccion.promedio), formatoNumero(m.publicaciones_por_semana, 1), formatoMasUsado(m), mejorFormato(m)] });
    for (const c of comps) {
      const cm = c.metricas;
      filas.push({ celdas: cm
        ? [`@${c.usuario}`, formatoNumero(cm.seguidores), pct(cm.interaccion.promedio), formatoNumero(cm.publicaciones_por_semana, 1), formatoMasUsado(cm), mejorFormato(cm)]
        : [`@${c.usuario}`, "—", "—", "—", "—", "Sin datos públicos"] });
    }
    secciones.push(el("section", { class: "seccion" },
      cabeza(++n, "Competencia", "Frente a tu competencia"),
      filas.length ? tabla(["Cuenta", "Seguidores", "Interacción", "Public./semana", "Formato más usado", "Mejor formato"], filas, { numericas: [1, 2, 3] }) : null,
      el("div", { class: "rejilla rejilla--2", style: { marginTop: "16px" } },
        a.competencia.map((c) => el("div", { class: "tarjeta" },
          el("span", { class: "etiqueta" }, c.cuenta),
          el("p", { style: { margin: "8px 0" } }, c.que_les_funciona),
          el("p", { style: { margin: 0 } }, el("strong", {}, "Tu oportunidad: "), c.oportunidad),
        ))),
    ));
  }

  // 08 Acciones
  secciones.push(el("section", { class: "seccion" },
    cabeza(++n, "Próximas 2 semanas", "Tres movimientos ya"),
    el("div", { class: "rejilla rejilla--3" },
      a.acciones_prioritarias.map((x, i) => el("div", { class: "tarjeta" },
        el("div", { class: "pilar__pct" }, String(i + 1)),
        el("strong", { style: { display: "block", margin: "8px 0 4px" } }, x.accion),
        el("span", { class: "secundario pequeno" }, x.porque),
      ))),
  ));

  // ---------- Propuesta estratégica ----------
  const propuesta = [];
  propuesta.push(el("section", { class: "banda salto-pagina" },
    el("span", { class: "etiqueta" }, "Propuesta estratégica · 90 días"),
    el("h2", { class: "titulo-l", style: { margin: "10px 0 14px" } }, e.titulo, el("span", { class: "excl" }, "!")),
    el("p", { style: { fontSize: "18px", margin: "0 0 10px" } }, e.la_oportunidad),
    el("p", { style: { margin: 0 } }, el("strong", { style: { color: "var(--crema)" } }, "Objetivo: "), e.objetivo),
  ));

  propuesta.push(el("section", { class: "seccion" },
    cabeza(++n, "Pilares de contenido", "De qué vas a hablar"),
    el("div", { class: "rejilla rejilla--2" }, e.pilares.map((p) => el("div", { class: "tarjeta pilar" },
      el("div", { class: "pilar__pct" }, `${p.porcentaje} %`),
      el("div", { class: "pilar__barra" }, el("div", { class: "pilar__relleno", style: { width: `${Math.min(100, p.porcentaje)}%` } })),
      el("strong", {}, p.nombre),
      el("span", { class: "secundario" }, p.descripcion),
    ))),
  ));

  propuesta.push(el("section", { class: "seccion" },
    cabeza(++n, "Ideas listas para producir", "Contenido que puedes hacer ya"),
    el("div", { class: "rejilla rejilla--2" }, e.ideas.map((i, k) => el("article", { class: "tarjeta idea" },
      el("div", { class: "idea__cabeza" },
        el("span", { class: "pildora pildora--aviso" }, i.formato),
        el("span", { class: "pildora" }, i.objetivo),
        el("span", { class: "pildora" }, i.pilar),
        el("span", { class: "pildora" }, `Dificultad: ${i.dificultad}`),
      ),
      el("span", { class: "etiqueta", style: { color: "var(--piedra)" } }, `Idea ${k + 1} · ${i.titulo}`),
      el("p", { class: "idea__gancho", style: { margin: 0 } }, i.gancho),
      el("p", { class: "secundario pequeno", style: { margin: 0 } }, el("strong", {}, "Por qué: "), i.por_que),
      el("details", {},
        el("summary", {}, "Guion y texto"),
        el("ol", { class: "lista", style: { margin: "6px 0 10px" } }, i.desarrollo.map((d) => el("li", {}, d))),
        el("p", { style: { margin: "0 0 8px" } }, el("strong", {}, "Llamado a la acción: "), i.llamado_a_la_accion),
        el("div", { class: "texto-copiable" }, i.texto_publicacion),
        el("p", { class: "hashtags", style: { margin: "8px 0 0" } }, i.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")),
      ),
    ))),
  ));

  propuesta.push(el("section", { class: "seccion" },
    cabeza(++n, "Calendario", "Tus primeras 2 semanas"),
    tabla(["Semana", "Día", "Formato", "Idea"],
      e.calendario.map((c) => ({ celdas: [String(c.semana), c.dia, c.formato, c.idea] }))),
  ));

  propuesta.push(el("section", { class: "seccion" },
    cabeza(++n, "Cómo te ayuda Pivot", "Lo que hacemos por ti"),
    el("div", { class: "rejilla rejilla--2" }, e.servicios_recomendados.map((s) => el("div", { class: "tarjeta servicio" },
      el("h3", { class: "titulo-m" }, s.servicio),
      el("ul", { class: "lista" }, s.que_incluye.map((q) => el("li", {}, q))),
      el("p", { class: "secundario pequeno", style: { margin: 0 } }, s.por_que),
    ))),
  ));

  propuesta.push(el("section", { class: "seccion" },
    cabeza(++n, "Cómo vamos a medir", null),
    tabla(["Indicador", "Hoy", "Meta a 90 días"], e.indicadores.map((x) => ({ celdas: [x.indicador, x.hoy, x.meta_90_dias] }))),
  ));

  propuesta.push(el("section", { class: "cierre" },
    el("h2", { class: "titulo-l" }, "¿Listos para el giro", el("span", { style: { color: "var(--tinta)" } }, "!")),
    el("p", {}, e.siguiente_paso),
    el("span", { class: "cierre__contacto" }, "pivotagencia.com · hola@pivotagencia.com"),
  ));

  propuesta.push(el("section", { class: "limites" },
    el("p", { class: "etiqueta", style: { color: "var(--piedra)" } }, "Sobre este análisis"),
    el("ul", { class: "lista" },
      a.limites.map((l) => el("li", {}, l)),
      el("li", {}, "Interacción = (me gusta + comentarios) ÷ seguidores × 100, por publicación."),
    ),
  ));

  return el("article", { class: "hoja" }, portada, secciones, propuesta);
}
