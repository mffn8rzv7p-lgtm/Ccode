// Service worker de Bong v2 (inicio + apps). Reemplaza al de Bong 1.x en la misma ruta (/sw.js),
// así los celulares que ya tenían Bong instalado conservan su suscripción a notificaciones push.
const VERSION = 'bong-v2-20261111';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((llaves) => Promise.all(llaves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Red primero; si no hay conexión, la última copia guardada (páginas, JS y CSS de este sitio).
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const esPagina = e.request.mode === 'navigate';
  const esCodigo = /\.(js|css)$/.test(url.pathname) && !url.pathname.endsWith('/config.js') && !url.pathname.endsWith('/sw.js');
  if (!esPagina && !esCodigo) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok) { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
        return r;
      })
      .catch(() => caches.match(e.request).then((r) => r || Response.error()))
  );
});

self.addEventListener('push', (e) => {
  let datos = {};
  try { datos = e.data ? e.data.json() : {}; } catch { datos = { cuerpo: e.data && e.data.text() }; }
  const titulo = datos.titulo || 'Bong';
  e.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.cuerpo || '',
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      tag: datos.tag || undefined,
      data: { url: datos.url || './' }
    })
  );
});

// Las notificaciones del Gestor traen direcciones como "#/tarea/123": se abren dentro de /gestor/.
function destinoDe(url) {
  const crudo = url || './';
  const relativo = crudo.startsWith('#/') ? `gestor/${crudo}` : crudo;
  return new URL(relativo, self.registration.scope).href;
}

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const destino = destinoDe(e.notification.data && e.notification.data.url);
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if ('focus' in v) { v.navigate(destino).catch(() => {}); return v.focus(); }
      }
      return self.clients.openWindow(destino);
    })
  );
});
