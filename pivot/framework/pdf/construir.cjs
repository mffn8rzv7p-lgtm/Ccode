#!/usr/bin/env node
// Arma el PDF del framework de Pivot con la plantilla de marca.
// Uso (desde pivot/framework/pdf):  npm install  y luego  npm run pdf
// Salida: pivot/framework/Framework_Pivot.pdf
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { marked } = require('marked');

let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }

const AQUI = __dirname;
const FW = path.resolve(AQUI, '..');
const SALIDA = path.join(FW, 'Framework_Pivot.pdf');

const PARTES = [
  { num: '01', titulo: 'La base', archivos: ['README.md', '01-forma-de-trabajo.md', '02-ciclo-del-cliente.md', '03-metodologia-base.md'] },
  { num: '02', titulo: 'Nuestros servicios', archivos: ['servicios/marketing-digital.md', 'servicios/pauta-digital.md', 'servicios/creacion-contenido.md', 'servicios/diseno-web.md'] },
  { num: '03', titulo: 'Cuidado y marca', archivos: ['04-seguridad-y-datos.md', '05-marca-pivot.md'] },
  { num: '04', titulo: 'Plantillas', archivos: ['plantillas/brief-cliente.md', 'plantillas/checklist-onboarding.md', 'plantillas/informe-mensual.md', 'plantillas/calendario-contenido.md', 'plantillas/acta-entrega.md', 'plantillas/estructura-asana.md'] },
];

const idDe = (rel) => 'doc-' + rel.replace(/\.md$/, '').replace(/[^a-z0-9]+/gi, '-');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 1. Leer cada documento: título, "Para qué sirve" y cuerpo.
const docs = {};
for (const parte of PARTES) {
  for (const rel of parte.archivos) {
    const texto = fs.readFileSync(path.join(FW, rel), 'utf8');
    const lineas = texto.split('\n');
    const i = lineas.findIndex((l) => l.startsWith('# '));
    let titulo = lineas[i].slice(2).trim();
    if (rel === 'README.md') titulo = 'Cómo usar este framework';
    let resto = lineas.slice(i + 1).join('\n');
    let paraQue = '';
    resto = resto.replace(/^Para qué sirve:\s*(.+)$/m, (_, p) => { paraQue = p; return ''; });
    docs[rel] = { rel, titulo, paraQue, cuerpo: resto, parte };
  }
}

// 2. Convertir Markdown a HTML, con los enlaces entre documentos apuntando dentro del PDF.
function aHtml(md, rel) {
  const renderer = new marked.Renderer();
  renderer.link = function ({ href, tokens }) {
    let texto = this.parser.parseInline(tokens);
    const ruta = href.split('#')[0];
    if (ruta.endsWith('.md')) {
      const destino = path.posix.normalize(path.posix.join(path.posix.dirname(rel), ruta));
      if (docs[destino]) {
        if (/\.md$/.test(texto.trim())) texto = esc(docs[destino].titulo);
        return `<a href="#${idDe(destino)}">${texto}</a>`;
      }
      return texto; // archivo fuera del framework (por ejemplo, una skill): solo el texto
    }
    return `<a href="${esc(href)}">${texto}</a>`;
  };
  renderer.codespan = ({ text }) => {
    const clase = /completar/i.test(text) ? ' class="campo"' : '';
    return `<code${clase}>${esc(text)}</code>`;
  };
  renderer.listitem = function (item) {
    let html = this.parser.parse(item.tokens, !!item.loose);
    if (item.task) {
      html = '<input type="checkbox" disabled> ' + html;
      return `<li class="tarea">${html}</li>\n`;
    }
    return `<li>${html}</li>\n`;
  };
  return marked.parse(md, { renderer, gfm: true });
}

const svgGiro = `
<svg class="giro" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs><path id="circulo" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0"/></defs>
  <text font-family="Space Mono" font-size="11.5" font-weight="700" fill="#121010" letter-spacing="1">
    <textPath href="#circulo" textLength="488" lengthAdjust="spacing">ESTRATEGIA · CONTENIDO · PAUTA · DISEÑO WEB · BRANDING ·</textPath>
  </text>
  <g transform="translate(100 104) rotate(28) scale(.30) translate(-70 -175)" fill="#E63915">
    <path d="M22 0H118Q132 0 131 14L113 226Q112 238 100 238H40Q28 238 27 226L9 14Q8 0 22 0Z"/>
    <ellipse cx="70" cy="300" rx="58" ry="46"/>
  </g>
  <circle cx="176" cy="38" r="5" fill="#121010"/><circle cx="30" cy="170" r="4" fill="#E63915"/>
</svg>`;

const hoy = new Date();
const fecha = hoy.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

let html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Framework de trabajo · Pivot Agencia</title>
<link rel="stylesheet" href="fuentes.css"><link rel="stylesheet" href="plantilla.css"></head><body>

<section class="completa portada">
  <img class="logo" src="img/logo.webp" alt="P!VOT">
  ${svgGiro}
  <p class="etiqueta">Framework de trabajo</p>
  <h1>Así trabaja<br>Pivot<span class="rojo">!</span></h1>
  <p class="bajada">De <s>improvisar</s> a <b class="rojo">tener método</b>: forma de trabajo, metodologías y herramientas para cada servicio que ofrecemos.</p>
  <div class="meta"><span>Pivot Agencia · Medellín, Colombia</span><span>Versión 1 · ${fecha}</span></div>
  <div class="formula">
    <p class="etiqueta">La fórmula Pivot</p>
    <p>Estrategia <b>+</b> Creatividad <b>+</b> Pauta <b>=</b> Resultados<b>!</b></p>
  </div>
</section>

<section class="indice">
  <p class="etiqueta" style="color:var(--red)">Contenido</p>
  <h2>Todo lo que necesitas para trabajar con orden.</h2>
  ${PARTES.map((p) => `<div class="parte"><h3>${p.num} — ${p.titulo}</h3>
    ${p.archivos.map((r, i) => `<a href="#${idDe(r)}"><b>${esc(docs[r].titulo)}</b><span>${p.num}.${i + 1}</span></a>`).join('')}
  </div>`).join('')}
</section>
`;


for (const parte of PARTES) {
  html += `<section class="completa separador">
    <div class="num">${parte.num}</div>
    <p class="etiqueta">Parte ${parte.num}</p>
    <h2>${parte.titulo}<span class="rojo">.</span></h2>
    <div class="contenido">${parte.archivos.map((r, i) => `<a href="#${idDe(r)}"><span>${parte.num}.${i + 1}</span>${esc(docs[r].titulo)}</a>`).join('')}</div>
    <img class="logo" src="img/logo-blanco.webp" alt="P!VOT">
  </section>`;
  parte.archivos.forEach((rel, i) => {
    const d = docs[rel];
    html += `<article class="doc" id="${idDe(rel)}">
      <header class="doc-cabeza"><p class="etiqueta">${parte.num}.${i + 1} — ${esc(parte.titulo)}</p><h1>${esc(d.titulo)}</h1></header>
      ${d.paraQue ? `<div class="para-que"><span class="etiqueta">Para qué sirve</span><p>${marked.parseInline(d.paraQue)}</p></div>` : ''}
      ${aHtml(d.cuerpo, rel)}
    </article>`;
  });
}

html += `<section class="completa contra" style="break-after:auto">
  <p class="etiqueta" style="margin-top:0">Este framework está vivo</p>
  <h2>¡Listo para<br>el giro<span class="tinta">!</span></h2>
  <p>Úsalo con cada cliente, anota lo que no funcione y ajústalo cada trimestre. Los números marcados como sugerencia se pueden cambiar.</p>
  <div class="pie"><img src="img/logo-blanco.webp" alt="P!VOT"><span>Agencia de marketing digital · Medellín, Colombia</span></div>
</section></body></html>`;

const HTML = path.join(AQUI, 'framework.html');
fs.writeFileSync(HTML, html);

(async () => {
  const navegador = await playwright.chromium.launch();
  const pagina = await navegador.newPage();
  await pagina.goto(pathToFileURL(HTML).href, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({ path: SALIDA, format: 'A4', printBackground: true, preferCSSPageSize: true, outline: true, tagged: true });
  await navegador.close();
  fs.unlinkSync(HTML);
  console.log('PDF listo:', SALIDA);
})();
