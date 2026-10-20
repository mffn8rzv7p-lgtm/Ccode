// Convierte el informe HTML de /plm-ecc en PDF (para compartir como la presentación)
// y en una imagen de vista previa, y avisa si hay scroll horizontal o errores.
//
// Uso: node exportar.js <informe.html> <carpeta-de-salida>
//   node exportar.js entregas/informe.html entregas
//   -> entregas/informe.pdf, entregas/vista-informe.png
const path = require('path');
const fs = require('fs');

function loadPlaywright() {
  for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright', '/opt/node-tools/node_modules/playwright']) {
    try { return require(p); } catch { /* probar la siguiente */ }
  }
  throw new Error('No encontré Playwright. En la nube viene preinstalado; en local: npm i -D playwright');
}

(async () => {
  const [target, outDir] = process.argv.slice(2);
  if (!target || !outDir) {
    console.error('Uso: node exportar.js <informe.html> <carpeta-de-salida>');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const { chromium } = loadPlaywright();
  const launch = process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {};
  const browser = await chromium.launch(launch);
  const errors = [];

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('file://' + path.resolve(target), { waitUntil: 'networkidle' }).catch(() => {});
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: path.join(outDir, 'vista-informe.png') });
  await page.emulateMedia({ media: 'screen' });
  await page.pdf({ path: path.join(outDir, 'informe.pdf'), format: 'A4', landscape: true, printBackground: true });
  await browser.close();

  if (overflow) errors.push('En celular la página se sale de lado (scroll horizontal).');
  errors.forEach((m) => console.log('Problema: ' + m));
  console.log(errors.length ? `${errors.length} problema(s)` : 'Todo en orden');
  process.exit(errors.length ? 1 : 0);
})();
