// ===== Pivot · versión líquida =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const clamp = (v) => Math.min(1, Math.max(0, v));
const main = document.getElementById('contenido');
const topbar = document.getElementById('top');
const footer = document.getElementById('footer');
const isla = document.getElementById('isla');

// Año del pie de página
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Preloader: el líquido sube hasta llenar la pantalla =====
(() => {
  const ready = () => requestAnimationFrame(() => root.classList.add('ready'));
  if (!root.classList.contains('pl')) { ready(); return; }
  const pl = document.getElementById('preloader');
  const num = document.getElementById('plNum');
  const t0 = performance.now();
  const MIN = 1700;
  let fontsOk = false;
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { fontsOk = true; });
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const tick = (now) => {
    const t = (now - t0) / MIN;
    // Si las fuentes tardan, se queda en 90 hasta que lleguen (máximo 3,5 s)
    const p = fontsOk || now - t0 > 3500 ? ease(clamp(t)) : Math.min(.9, ease(clamp(t)));
    pl.style.setProperty('--p', p.toFixed(3));
    num.textContent = String(Math.round(p * 100)).padStart(3, '0');
    if (p < 1) { requestAnimationFrame(tick); return; }
    try { sessionStorage.setItem('pivot-pl', '1'); } catch (_) {}
    setTimeout(() => {
      pl.classList.add('out');
      ready();
      setTimeout(() => { root.classList.remove('pl'); pl.remove(); }, 1000);
    }, 180);
  };
  requestAnimationFrame(tick);
})();

// ===== Revelado al bajar (solo transform: el contenido nunca está oculto) =====
(() => {
  const els = $$('.rv');
  if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach((el) => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 70}ms`; io.observe(el); });
})();

// ===== Frase que cambia en la portada =====
(() => {
  const rot = document.getElementById('rotator');
  if (!rot || reduceMotion) return;
  const words = [...rot.children];
  let i = 0;
  setInterval(() => {
    const prev = words[i];
    i = (i + 1) % words.length;
    prev.classList.remove('is-on'); prev.classList.add('is-out');
    words[i].classList.remove('is-out'); words[i].classList.add('is-on');
    setTimeout(() => prev.classList.remove('is-out'), 700);
  }, 2800);
})();

// ===== Lámpara de lava: una gota sigue al mouse y se funde con las demás =====
(() => {
  const lava = document.getElementById('lava');
  const cur = document.getElementById('lavaCur');
  const hero = document.getElementById('inicio');
  if (!lava || !finePointer || reduceMotion) return;
  hero.addEventListener('pointermove', (e) => {
    const r = lava.getBoundingClientRect();
    const max = r.width * .62;
    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(x, y);
    if (d > max) { x *= max / d; y *= max / d; }
    cur.style.setProperty('--cx', `${x.toFixed(1)}px`);
    cur.style.setProperty('--cy', `${y.toFixed(1)}px`);
    cur.style.setProperty('--cs', '1');
  });
  hero.addEventListener('pointerleave', () => {
    cur.style.setProperty('--cx', '0px'); cur.style.setProperty('--cy', '0px'); cur.style.setProperty('--cs', '0');
  });
})();

// ===== Fórmula: las gotas empiezan a fluir cuando aparece =====
(() => {
  const stage = document.getElementById('fStage');
  if (!stage) return;
  if (!('IntersectionObserver' in window) || reduceMotion) { stage.classList.add('play'); return; }
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { stage.classList.add('play'); io.disconnect(); }
  }, { threshold: .45 });
  io.observe(stage);
})();

// ===== Servicios: la gota cambia de forma y color con cada servicio =====
(() => {
  const SVC = [
    { t: 'Creación de contenido', d: 'Piezas que detienen el scroll y cuentan quién eres.', l: ['Ideas y guiones para redes', 'Fotografía y video', 'Diseño de piezas y carruseles', 'Reels y formatos cortos'] },
    { t: 'Estrategia digital', d: 'Un plan claro: a quién le hablas, dónde y para qué.', l: ['Diagnóstico de tu marca', 'Definición de público y objetivos', 'Plan de canales y contenidos', 'Medición de resultados'] },
    { t: 'Diseño web', d: 'Páginas rápidas, bonitas y pensadas para vender.', l: ['Páginas de presentación', 'Páginas para campañas', 'Diseño adaptado a celular', 'Publicación en tu dominio'] },
    { t: 'Pauta digital', d: 'Publicidad pagada que llega a quien sí te va a comprar.', l: ['Campañas en Instagram y Facebook', 'Campañas en Google', 'Segmentación de público', 'Optimización continua'] },
    { t: 'Branding', d: 'Una identidad que se recuerda a la primera.', l: ['Nombre y concepto de marca', 'Logo e identidad visual', 'Paleta de colores y tipografías', 'Manual de marca'] },
    { t: 'Redes sociales', d: 'Tu marca activa, constante y conversando con su gente.', l: ['Calendario de publicaciones', 'Publicación y programación', 'Gestión de comunidad', 'Informes mensuales'] }
  ];
  const SHAPES = [
    '42% 58% 70% 30% / 45% 45% 55% 55%',
    '63% 37% 54% 46% / 55% 48% 52% 45%',
    '30% 70% 70% 30% / 30% 30% 70% 70%',
    '55% 45% 34% 66% / 62% 38% 62% 38%',
    '70% 30% 46% 54% / 30% 29% 71% 70%',
    '48% 52% 62% 38% / 38% 64% 36% 62%'
  ];
  const tabs = $$('#svcList [role="tab"]');
  const blob = document.getElementById('svcBlob');
  const panel = document.getElementById('svcPanel');
  let cur = 0;
  const select = (i, focus) => {
    if (i === cur && !focus) return;
    cur = i;
    const s = SVC[i];
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tabs[i].focus();
    panel.setAttribute('aria-labelledby', tabs[i].id);
    blob.style.setProperty('--br', SHAPES[i]);
    blob.style.setProperty('--blob', i % 2 ? 'var(--ink)' : 'var(--red)');
    $('#svcN').textContent = `0${i + 1} / 06`;
    $('#svcTitle').textContent = s.t;
    $('#svcText').textContent = s.d;
    $('#svcItems').innerHTML = s.l.map((x) => `<li>${x}</li>`).join('');
    if (!reduceMotion) { panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    if (finePointer) t.addEventListener('mouseenter', () => select(i));
    t.addEventListener('keydown', (e) => {
      const k = e.key;
      let n = -1;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = (i + 1) % tabs.length;
      if (k === 'ArrowUp' || k === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      if (k === 'Home') n = 0;
      if (k === 'End') n = tabs.length - 1;
      if (n > -1) { e.preventDefault(); select(n, true); }
    });
  });
})();

// ===== Método: el caso cambia las líneas "En tu caso" =====
(() => {
  const CASES = [
    ['revisamos dónde aparece hoy tu marca y quién debería conocerla.',
     'elegimos los canales donde está tu público y el mensaje que te diferencia.',
     'hacemos contenido constante y pauta para que te vean personas nuevas.',
     'seguimos cuánta gente nueva te descubre cada mes y ajustamos el rumbo.'],
    ['miramos qué publicas, quién te sigue y en qué punto se pierde la venta.',
     'definimos ofertas claras y el camino del seguidor hasta la compra.',
     'creamos piezas que invitan a comprar, una web que vende y anuncios para quien ya te conoce.',
     'medimos mensajes, clics y ventas, no solo likes.'],
    ['revisamos lo que has publicado y qué funcionó mejor.',
     'armamos un calendario con temas, formatos y fechas.',
     'producimos las piezas del mes para que no tengas que improvisar.',
     'cada mes te mostramos qué funcionó y qué vamos a cambiar.']
  ];
  const lines = $$('#steps .cl');
  $$('input[name="caso"]').forEach((r) => {
    r.addEventListener('change', () => {
      lines.forEach((l, i) => {
        l.textContent = CASES[+r.value][i];
        if (!reduceMotion) { l.classList.remove('swap'); void l.offsetWidth; l.classList.add('swap'); }
      });
    });
  });
})();

// ===== Menú isla =====
(() => {
  const btn = document.getElementById('islaBtn');
  const lbl = document.getElementById('islaLbl');
  const bg = document.getElementById('islaBg');
  const links = $$('#drops a');
  const set = (on, focusBtn) => {
    isla.classList.toggle('open', on);
    bg.classList.toggle('on', on);
    btn.setAttribute('aria-expanded', on);
    lbl.textContent = on ? 'Cerrar' : 'Menú';
    [main, topbar, footer].forEach((el) => { el.inert = on; });
    if (on) setTimeout(() => links[links.length - 1].focus({ preventScroll: true }), 120);
    else if (focusBtn) btn.focus({ preventScroll: true });
  };
  btn.addEventListener('click', () => set(!isla.classList.contains('open'), false));
  bg.addEventListener('click', () => set(false, true));
  links.forEach((a) => a.addEventListener('click', () => set(false, false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isla.classList.contains('open')) set(false, true);
  });
  // Mantener el foco dentro del menú abierto
  isla.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !isla.classList.contains('open')) return;
    const items = [...links, btn];
    const i = items.indexOf(document.activeElement);
    if (e.shiftKey && i === 0) { e.preventDefault(); btn.focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  });
})();

// ===== Contacto: copiar el correo y enviar el mensaje con el gestor de correo =====
(() => {
  const btn = document.getElementById('copy');
  const lbl = document.getElementById('copyLbl');
  btn.addEventListener('click', () => {
    const select = () => {
      const r = document.createRange();
      r.selectNodeContents(document.getElementById('mail'));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      lbl.textContent = 'Seleccionado';
    };
    try { navigator.clipboard.writeText('hola@pivotagencia.com').then(() => { lbl.textContent = 'Copiado'; }, select); } catch (_) { select(); }
    setTimeout(() => { lbl.textContent = 'Copiar'; }, 2200);
  });
  document.getElementById('compose').addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(document.getElementById('asunto').value);
    const body = encodeURIComponent(document.getElementById('mensaje').value);
    window.location.href = `mailto:hola@pivotagencia.com?subject=${subject}&body=${body}`;
  });
})();

// ===== Easter egg: la página se inunda y aparece el minijuego =====
(() => {
  const btn = document.getElementById('eggBtn');
  const flood = document.getElementById('flood');
  const game = document.getElementById('game');
  const dial = document.getElementById('gDial');
  const needle = document.getElementById('gNeedle');
  const zone = document.getElementById('gZone');
  const core = document.getElementById('gCore');
  const scoreEl = document.getElementById('gScore');
  const msg = document.getElementById('gMsg');
  const lives = $$('#gLives svg');
  const play = document.getElementById('gamePlay');
  const end = document.getElementById('gameEnd');
  const title = document.getElementById('gameTitle');
  const BEST = 'pivot-giros';
  let a = 0, speed = 120, dir = 1, z0 = 0, zw = 64, score = 0, life = 3;
  let running = false, last = 0, raf = 0, locked = false, endedAt = 0;

  const best = () => { try { return +localStorage.getItem(BEST) || 0; } catch (_) { return 0; } };
  const saveBest = (n) => { try { localStorage.setItem(BEST, String(n)); } catch (_) {} };
  const newZone = () => {
    z0 = (a + 90 + Math.random() * 180) % 360;
    zone.style.setProperty('--z0', `${z0}deg`);
    zone.style.setProperty('--zw', `${zw}deg`);
  };
  const loop = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    a = (a + dir * speed * dt + 360) % 360;
    needle.style.setProperty('--a', `${a}deg`);
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    a = 0; speed = 120; dir = 1; zw = 64; score = 0; life = 3; locked = false;
    scoreEl.textContent = '0'; core.textContent = '0'; msg.textContent = '';
    title.textContent = 'Te dijimos! Ahora detén la perilla';
    lives.forEach((l) => l.classList.remove('lost'));
    play.hidden = false; end.hidden = true;
    newZone();
    running = true; last = performance.now(); raf = requestAnimationFrame(loop);
    setTimeout(() => dial.focus({ preventScroll: true }), 50);
  };
  const pulse = (cls) => { dial.classList.remove('hit', 'miss'); void dial.offsetWidth; dial.classList.add(cls); };
  const over = () => {
    running = false; cancelAnimationFrame(raf);
    let b = best();
    if (score > b) { saveBest(score); b = score; }
    title.textContent = 'Se acabó el giro';
    document.getElementById('gFinal').textContent = score;
    document.getElementById('gFinalTxt').textContent = score === 1 ? 'giro' : 'giros';
    document.getElementById('gBest').textContent = !b ? 'La perilla es tramposa. Inténtalo otra vez.'
      : (score >= b ? 'Nuevo récord en este navegador!' : `Tu récord: ${b} ${b === 1 ? 'giro' : 'giros'}.`);
    play.hidden = true; end.hidden = false; endedAt = performance.now();
    document.getElementById('gAgain').focus({ preventScroll: true });
  };
  const stop = () => {
    if (!running || locked) return;
    const d = ((a - z0) % 360 + 360) % 360;
    if (d <= zw) {
      score++; scoreEl.textContent = score; core.textContent = score;
      speed = Math.min(520, speed * 1.16 + 8); zw = Math.max(16, zw - 5); dir = -dir;
      msg.textContent = ['Giro!', 'Eso!', 'Otra vuelta!', 'Imparable!'][score % 4];
      pulse('hit'); newZone();
    } else {
      life--;
      if (lives[2 - life]) lives[2 - life].classList.add('lost');
      msg.textContent = life ? `Casi. Te quedan ${life}.` : 'Se acabó el giro.';
      pulse('miss');
      if (!life) { locked = true; setTimeout(over, 700); }
    }
  };
  const lock = (on) => {
    [main, topbar, footer, isla].forEach((el) => { el.inert = on; });
    root.style.overflow = on ? 'hidden' : '';
  };
  const openGame = () => { game.hidden = false; lock(true); start(); };
  const closeGame = (toContact) => {
    running = false; cancelAnimationFrame(raf);
    game.hidden = true; lock(false);
    if (toContact) {
      const c = document.getElementById('contacto');
      window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else btn.focus({ preventScroll: true });
  };
  btn.addEventListener('click', () => {
    if (reduceMotion) { openGame(); return; }
    flood.classList.add('on');
    setTimeout(() => {
      openGame();
      flood.classList.remove('on');
    }, 1250);
  });
  dial.addEventListener('pointerdown', (e) => { e.preventDefault(); stop(); });
  dial.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stop(); } });
  game.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeGame(false); }
    if (e.key === ' ' && running && e.target !== dial && !e.target.closest('button, a')) { e.preventDefault(); stop(); }
  });
  document.getElementById('gameClose').addEventListener('click', () => closeGame(false));
  document.getElementById('gAgain').addEventListener('click', () => { if (performance.now() - endedAt > 600) start(); });
  document.getElementById('gTalk').addEventListener('click', (e) => { e.preventDefault(); closeGame(true); });
})();

// ===== Todo lo que depende del scroll, en un solo cuadro de animación =====
(() => {
  const fill = isla.querySelector('.isla-fill');
  const mark = document.getElementById('lavaMark');
  const flow = document.getElementById('flow');
  const river = flow.querySelector('.r-fill');
  const steps = $$('#steps .step');
  const mBlob = document.getElementById('mBlob');
  const manifesto = document.getElementById('manifiesto');

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = root.scrollHeight - vh;
    fill.style.setProperty('--sp', (max > 0 ? y / max : 0).toFixed(3));
    if (reduceMotion) return;

    // El "!" de la lava se ladea mientras bajas
    if (y < vh * 1.5) mark.style.setProperty('--mr', `${Math.min(y * .08, 90).toFixed(1)}deg`);

    // El río se llena hasta la mitad de la pantalla
    const r = flow.getBoundingClientRect();
    const p = clamp((vh * .6 - r.top) / r.height);
    river.style.strokeDashoffset = (1 - p).toFixed(4);
    steps.forEach((s) => {
      const sr = s.getBoundingClientRect();
      s.classList.toggle('on', sr.top + sr.height * .35 < vh * .6 + 1);
    });

    // La gota del manifiesto crece al pasar
    const m = manifesto.getBoundingClientRect();
    const mp = clamp((vh - m.top) / (vh + m.height));
    mBlob.style.setProperty('--ms', (.82 + Math.sin(mp * Math.PI) * .2).toFixed(3));
  };

  if (reduceMotion) { river.style.strokeDashoffset = '0'; steps.forEach((s) => s.classList.add('on')); }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
