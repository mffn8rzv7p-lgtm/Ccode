// Dibuja la carta de cotización (pantalla y PDF), con el diseño de pivotagencia.com.
import { el } from "../assets/hub.js";

export function cop(v) {
  return "$" + Math.round(Number(v) || 0).toLocaleString("es-CO").replace(/,/g, ".");
}

function seccion(n, titulo, contenido) {
  return el("section", { class: "carta__seccion" },
    el("span", { class: "etiqueta" }, `${String(n).padStart(2, "0")} — ${titulo}`),
    contenido,
  );
}

function lista(items) {
  return el("ul", { class: "lista" }, items.map((i) => el("li", {}, i)));
}

export function renderCarta(fila) {
  const c = fila.carta;
  let n = 0;
  const inv = c.inversion;

  const bloqueInversion = inv.paquetes?.length
    ? el("div", { class: "carta__paquetes" }, inv.paquetes.map((p) =>
        el("div", { class: "carta__paquete" + (p.recomendado ? " carta__paquete--rec" : "") },
          el("span", { class: "etiqueta", style: { color: p.recomendado ? "var(--blanco)" : "transparent" } }, p.recomendado ? "Recomendado" : "·"),
          el("span", { class: "carta__paquete-nombre" }, p.nombre),
          el("span", { class: "carta__paquete-precio" }, cop(p.precio)),
          el("ul", {}, p.incluye.map((i) => el("li", {}, i))),
        )))
    : el("table", { class: "carta__tabla" },
        el("tbody", {},
          (inv.items ?? []).map((i) => el("tr", {}, el("td", {}, i.concepto), el("td", {}, cop(i.valor)))),
          el("tr", { class: "total" }, el("td", {}, "Total"),
            el("td", {}, cop((inv.items ?? []).reduce((a, i) => a + Number(i.valor || 0), 0)))),
        ));

  return el("article", { class: "carta" },
    el("header", { class: "carta__cabeza" },
      el("img", { src: "../assets/pivot-logo.png", alt: "Pivot Agencia", width: "112", height: "28" }),
      el("div", { class: "carta__meta" },
        el("strong", {}, "Cotización"), el("br"),
        `N° ${fila.numero}`, el("br"),
        c.fecha,
      ),
    ),
    el("div", { class: "carta__hero" },
      el("div", {},
        el("p", { class: "etiqueta", style: { color: "var(--tinta)", margin: "0 0 10px" } },
          el("span", { style: { color: "var(--rojo)", fontFamily: "var(--display)", fontSize: "15px" } }, "! "),
          `Propuesta para ${fila.cliente}`),
        el("h1", { class: "titulo-l", style: { fontSize: "clamp(30px, 5vw, 46px)" } }, fila.proyecto, el("span", { class: "excl" }, "!")),
      ),
      el("span", { class: "carta__marca", "aria-hidden": "true" }, "!"),
    ),
    el("p", { class: "carta__saludo" }, c.saludo),
    seccion(++n, "Tu reto", el("p", {}, c.tu_reto)),
    seccion(++n, "Nuestra propuesta", el("p", {}, c.nuestra_propuesta)),
    seccion(++n, "Qué incluye", lista(c.que_incluye)),
    seccion(++n, "No incluye", lista(c.no_incluye)),
    seccion(++n, "Tiempos", el("p", {}, c.tiempos)),
    el("section", { class: "carta__inversion" },
      el("span", { class: "etiqueta", style: { display: "block", marginBottom: "12px" } }, `${String(++n).padStart(2, "0")} — Tu inversión`),
      bloqueInversion,
      el("p", { class: "carta__nota" }, inv.nota),
    ),
    seccion(++n, "Condiciones", lista(c.condiciones)),
    seccion(++n, "Por qué Pivot", lista(c.por_que_pivot)),
    el("section", { class: "carta__cierre" },
      el("h2", {}, "¿Listos para el giro", el("span", { style: { color: "var(--tinta)" } }, "!")),
      el("p", {}, c.cta),
      el("span", { class: "cierre__contacto" }, "pivotagencia.com · hola@pivotagencia.com"),
    ),
    el("p", { class: "carta__firma" }, "Un abrazo,", el("br"), el("strong", {}, "Equipo Pivot"), el("br"),
      el("span", { class: "secundario pequeno" }, "Pivot Agencia · pivotagencia.com · hola@pivotagencia.com · Medellín")),
  );
}
