// Exporta la animación a MP4 (post e historia) cuadro por cuadro.
// Uso: node exportar.cjs            -> ambos videos
//      node exportar.cjs --fotos D  -> un cuadro por estilo en la carpeta D (para revisar)
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const { chromium } = require('playwright');
const HTML = 'file://' + path.join(__dirname, 'animacion.html');
const args = process.argv.slice(2), fotos = args[0] === '--fotos' ? args[1] : null;
const SALIDA = { post: 'pivot-logo-estilos-post.mp4', story: 'pivot-logo-estilos-historia.mp4' };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  for (const fmt of ['post', 'story']) {
    const page = await browser.newPage();
    page.on('pageerror', e => console.error('ERROR', e.message));
    await page.goto(HTML + '?render=' + fmt);
    await page.waitForFunction('window.ready === true');
    const total = await page.evaluate('window.FRAMES');
    if (fotos) {
      fs.mkdirSync(fotos, { recursive: true });
      const ts = [0.9, ...Array.from({ length: 11 }, (_, i) => 1.4 + i * 2.4 + 1.4), 1.4 + 26.4 + 1.2, 1.4 + 2.4 + 0.16];
      for (const [i, t] of ts.entries()) {
        const url = await page.evaluate(k => window.frameAt(k), Math.round(t * 30));
        fs.writeFileSync(path.join(fotos, `${fmt}-${String(i).padStart(2, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
      }
      await page.close(); continue;
    }
    const out = path.join(__dirname, SALIDA[fmt]);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-profile:v', 'high', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let k = 0; k < total; k++) {
      const url = await page.evaluate(k => window.frameAt(k), k);
      if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (k % 150 === 0) console.log(fmt, k, '/', total);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    console.log('listo', out);
    await page.close();
  }
  await browser.close();
})();
