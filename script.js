// Año del pie de página
document.getElementById('year').textContent = new Date().getFullYear();

// Aparecer al bajar por la página
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 5) * 70}ms`;
    io.observe(el);
  });
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

// Frase que se colorea sola mientras bajas
const frase = document.getElementById('frase');
if (frase) {
  const palette = ['#FFC226', '#F26A21', '#8CC63F', '#E0322E', '#2F8FE0', '#7B3FA0', '#FF5E9A'];
  const pieces = [];

  // Partir cada línea en letras sueltas para pintarlas una por una
  frase.querySelectorAll('.line').forEach((line) => {
    const text = line.textContent.trim();
    line.textContent = '';
    line.setAttribute('aria-hidden', 'true');
    [...text].forEach((ch) => {
      const span = document.createElement('span');
      if (ch === ' ') {
        span.className = 'space';
        span.innerHTML = '&nbsp;';
      } else {
        span.className = 'letter';
        span.textContent = ch;
        span.style.setProperty('--paint', palette[pieces.length % palette.length]);
        pieces.push(span);
      }
      line.appendChild(span);
    });
  });

  // Los garabatos de alrededor se pintan al final
  document.querySelectorAll('.phrase-page .doodle').forEach((d) => pieces.push(d));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const paint = () => {
    const rect = frase.getBoundingClientRect();
    const vh = window.innerHeight;
    // Empieza cuando la frase asoma por abajo y termina cuando llega a la mitad de la pantalla
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.55 + rect.height * 0.5)));
    const n = reduceMotion ? pieces.length : Math.round(progress * pieces.length);
    pieces.forEach((el, i) => el.classList.toggle('painted', i < n));
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { paint(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', paint);
  paint();
}

// Selector de moneda (menú desplegable de la barra superior): convierte el precio de Amazon
// (en dólares) con la tasa del día
const currencyMenu = document.getElementById('currency-menu');
if (currencyMenu) {
  // Banderas dibujadas a mano: los emojis de banderas no se ven en Windows
  const flags = {
    COP: '<rect width="30" height="10" fill="#FCD116"/><rect y="10" width="30" height="5" fill="#003893"/><rect y="15" width="30" height="5" fill="#CE1126"/>',
    MXN: '<rect width="10" height="20" fill="#006847"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#CE1126"/><circle cx="15" cy="10" r="2.6" fill="#8C5A2B"/>',
    ARS: '<rect width="30" height="20" fill="#74ACDF"/><rect y="6.67" width="30" height="6.67" fill="#fff"/><circle cx="15" cy="10" r="2.4" fill="#F6B40E"/>',
    CLP: '<rect width="30" height="20" fill="#fff"/><rect y="10" width="30" height="10" fill="#D52B1E"/><rect width="10" height="10" fill="#0039A6"/><path d="M5 2.4l1.1 3.3h3.5l-2.8 2 1.1 3.3L5 9l-2.9 2 1.1-3.3-2.8-2h3.5z" fill="#fff" transform="translate(0 -.6) scale(1 .95)"/>',
    USD: '<rect width="30" height="20" fill="#fff"/><g fill="#B22234"><rect width="30" height="1.54"/><rect y="3.08" width="30" height="1.54"/><rect y="6.15" width="30" height="1.54"/><rect y="9.23" width="30" height="1.54"/><rect y="12.3" width="30" height="1.54"/><rect y="15.38" width="30" height="1.54"/><rect y="18.46" width="30" height="1.54"/></g><rect width="13" height="10.77" fill="#3C3B6E"/>',
  };
  const flag = (code) => `<svg class="flag" viewBox="0 0 30 20" aria-hidden="true">${flags[code]}</svg>`;

  const currencies = [
    { code: 'COP', name: 'Peso colombiano', locale: 'es-CO', step: 100 },
    { code: 'MXN', name: 'Peso mexicano', locale: 'es-MX', step: 1 },
    { code: 'ARS', name: 'Peso argentino', locale: 'es-AR', step: 100 },
    { code: 'CLP', name: 'Peso chileno', locale: 'es-CL', step: 10 },
    { code: 'USD', name: 'Dólar', locale: 'en-US', step: 0 },
  ];

  // Tasas de respaldo (octubre 2026) por si el servicio de tasas no responde
  let rates = { USD: 1, COP: 3237, MXN: 18.3, ARS: 1516, CLP: 979 };

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* sin almacenamiento */ } },
  };

  // Moneda inicial: la que eligió antes, o la de su país según el idioma del navegador
  const byCountry = { CO: 'COP', MX: 'MXN', AR: 'ARS', CL: 'CLP' };
  const region = (navigator.language || '').split('-')[1];
  let current = store.get('moneda') || byCountry[region?.toUpperCase()] || 'USD';
  if (!currencies.some((c) => c.code === current)) current = 'USD';

  const toggle = document.getElementById('currency-toggle');
  const list = document.getElementById('currency-list');
  const label = document.getElementById('currency-current');
  const prices = document.querySelectorAll('.price[data-usd]');
  const note = document.getElementById('currency-note');

  const format = (usd, cur) => {
    if (cur.code === 'USD') return `US$${usd.toFixed(2)}`;
    let value = usd * rates[cur.code];
    if (cur.step > 1) value = Math.round(value / cur.step) * cur.step;
    else value = Math.round(value);
    const n = new Intl.NumberFormat(cur.locale, { maximumFractionDigits: 0 }).format(value);
    return `≈ $${n} ${cur.code}`;
  };

  // Opciones del menú
  currencies.forEach((cur) => {
    const li = document.createElement('li');
    li.id = `moneda-${cur.code}`;
    li.setAttribute('role', 'option');
    li.dataset.code = cur.code;
    li.innerHTML = `${flag(cur.code)}<span class="code">${cur.code}</span><span class="name">${cur.name}</span>`;
    li.addEventListener('click', () => choose(cur.code));
    list.appendChild(li);
  });
  const options = [...list.children];

  const render = () => {
    const cur = currencies.find((c) => c.code === current);
    label.innerHTML = `${flag(cur.code)}<span>${cur.code}</span>`;
    toggle.setAttribute('aria-label', `Moneda de los precios: ${cur.name}`);
    options.forEach((o) => o.setAttribute('aria-selected', o.dataset.code === current));
    prices.forEach((el) => {
      el.textContent = format(parseFloat(el.dataset.usd), cur);
      el.classList.toggle('converted', cur.code !== 'USD');
    });
    if (note) {
      note.textContent = cur.code === 'USD'
        ? 'Precios en dólares, tal como los cobra Amazon.'
        : `Precios aproximados en ${cur.name.toLowerCase()} con la tasa de hoy. Amazon cobra en dólares y tu banco hace la conversión, así que puede variar un poco.`;
    }
  };

  let active = 0;
  const highlight = (i) => {
    active = (i + options.length) % options.length;
    options.forEach((o, k) => o.classList.toggle('active', k === active));
    list.setAttribute('aria-activedescendant', options[active].id);
    options[active].scrollIntoView({ block: 'nearest' });
  };

  const open = () => {
    list.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    highlight(options.findIndex((o) => o.dataset.code === current));
    list.focus();
  };
  const close = (focusToggle = true) => {
    if (list.hidden) return;
    list.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (focusToggle) toggle.focus();
  };
  const choose = (code) => {
    current = code;
    store.set('moneda', current);
    render();
    close();
  };

  toggle.addEventListener('click', () => (list.hidden ? open() : close()));
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
  });
  list.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); highlight(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active - 1); }
    else if (e.key === 'Home') { e.preventDefault(); highlight(0); }
    else if (e.key === 'End') { e.preventDefault(); highlight(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(options[active].dataset.code); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') { close(false); }
  });
  // Cerrar al tocar fuera del menú
  document.addEventListener('click', (e) => { if (!currencyMenu.contains(e.target)) close(false); });

  render();

  // Tasa del día (se guarda 12 horas para no pedirla en cada visita)
  let cached = null;
  try { cached = JSON.parse(store.get('tasas')); } catch { /* dato dañado: se ignora */ }
  if (cached && Date.now() - cached.time < 12 * 3600 * 1000) {
    rates = { ...rates, ...cached.rates };
    render();
  } else {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((r) => r.json())
      .then((data) => {
        if (data.result !== 'success') return;
        const fresh = {};
        currencies.forEach((c) => { if (data.rates[c.code]) fresh[c.code] = data.rates[c.code]; });
        rates = { ...rates, ...fresh };
        store.set('tasas', JSON.stringify({ time: Date.now(), rates: fresh }));
        render();
      })
      .catch(() => { /* se quedan las tasas de respaldo */ });
  }
}
