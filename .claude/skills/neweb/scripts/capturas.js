// Revisa una página en computadora y celular: toma capturas por pantallazos y una de página completa,
// y reporta errores de JavaScript, recursos que fallan, scroll horizontal, fuentes e imágenes.
//
// Uso: node capturas.js <ruta-o-url> <carpeta-de-salida> [fuente1,fuente2,...]
//   node capturas.js cliente/web/index.html /tmp/capturas "Lilita One,Nunito"
//   node capturas.js https://midominio.com /tmp/capturas
const path = require('path');
const fs = require('fs');

function loadPlaywright() {
  for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
    try { return require(p); } catch { /* probar la siguiente */ }
  }
  throw new Error('No encontré Playwright. En la nube viene preinstalado; en local: npm i -D playwright');
}

(async () => {
  const [target, outDir, fontsArg] = process.argv.slice(2);
  if (!target || !outDir) {
    console.error('Uso: node capturas.js <ruta-o-url> <carpeta-de-salida> [fuentes]');
    process.exit(1);
  }
  const url = /^https?:\/\//.test(target) ? target : 'file://' + path.resolve(target);
  const fonts = (fontsArg || '').split(',').map((f) => f.trim()).filter(Boolean);
  fs.mkdirSync(outDir, { recursive: true });

  const { chromium } = loadPlaywright();
  const launch = process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {};
  const browser = await chromium.launch(launch);
  let problems = 0;

  for (const [name, viewport] of [['computadora', { width: 1366, height: 860 }], ['celular', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (e) => errors.push('JS: ' + e.message));
    page.on('requestfailed', (r) => errors.push('Falló: ' + r.url()));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1000);

    // Bajar pantalla por pantalla, como un visitante, para disparar animaciones y carga diferida
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    let i = 0;
    for (let y = 0; y < height; y += viewport.height) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(outDir, `${name}-${String(i++).padStart(2, '0')}.png`) });
    }

    const report = await page.evaluate((fontList) => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      brokenImages: [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src),
      fonts: fontList.map((f) => `${f}: ${document.fonts.check(`20px "${f}"`) ? 'ok' : 'NO CARGA'}`),
      links: [...document.querySelectorAll('a[href^="http"]')].map((a) => a.href),
    }), fonts);

    // Captura de página completa con todo visible (animaciones de entrada ya terminadas)
    await page.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important}.topbar{position:relative!important}' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, `vista-${name}.png`), fullPage: true });

    const horizontalScroll = report.scrollWidth > report.viewport;
    if (horizontalScroll || report.brokenImages.length || errors.length || report.fonts.some((f) => f.includes('NO'))) problems++;

    console.log(`\n== ${name} (${viewport.width}px)`);
    console.log('Capturas:', i, '| Scroll horizontal:', horizontalScroll ? `SÍ (${report.scrollWidth}px)` : 'no');
    if (report.fonts.length) console.log('Fuentes:', report.fonts.join(', '));
    console.log('Imágenes rotas:', report.brokenImages.length ? report.brokenImages : 'ninguna');
    console.log('Errores:', errors.length ? errors : 'ninguno');
    console.log('Enlaces externos:', [...new Set(report.links)].join('\n  '));
  }

  await browser.close();
  console.log(problems ? '\nHAY PROBLEMAS: revisar antes de entregar.' : '\nTodo en orden.');
})();
