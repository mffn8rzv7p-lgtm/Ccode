// ===== Pivot · interacciones =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const pad = (n) => String(Math.round(n)).padStart(3, '0');
const norm = (d) => { d = ((d % 360) + 360) % 360; return d > 180 ? d - 360 : d; };
const main = document.getElementById('contenido');
const topbar = document.getElementById('topbar');
const footer = document.querySelector('.footer');

// Año del pie de página
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Preloader: el "!" da una vuelta completa y la portada entra al terminar =====
(() => {
  const pl = document.getElementById('preloader');
  const startHero = () => requestAnimationFrame(() => root.classList.add('loaded'));
  if (!root.classList.contains('pl')) { pl.remove(); startHero(); return; }
  try { sessionStorage.setItem('pivot-pl', '1'); } catch (e) {}
  const knob = document.getElementById('plKnob');
  const deg = document.getElementById('plDeg');
  const fill = document.getElementById('plFill');
  const t0 = performance.now();
  let ended = false;
  let fontsOk = false;
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { fontsOk = true; });
  const finish = () => {
    if (ended) return;
    ended = true;
    pl.classList.add('done');
    startHero();
    setTimeout(() => { pl.remove(); root.classList.remove('pl'); }, 750);
  };
  pl.addEventListener('click', finish);
  const tick = (now) => {
    if (ended) return;
    const p = Math.min(1, (now - t0) / 1000);
    const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    knob.style.setProperty('--pl', `${e * 360}deg`);
    deg.textContent = `${pad(e * 360)}°`;
    fill.style.setProperty('--p', e.toFixed(3));
    if (p < 1 || (!fontsOk && now - t0 < 2500)) requestAnimationFrame(tick);
    else setTimeout(finish, 180);
  };
  requestAnimationFrame(tick);
})();

// Aparecer al bajar por la página
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    io.observe(el);
  });
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

// Palabra que gira en la portada
const rotator = document.getElementById('rotator');
if (rotator && !reduceMotion) {
  const words = [...rotator.children];
  let i = 0;
  setInterval(() => {
    const prev = words[i];
    i = (i + 1) % words.length;
    prev.classList.remove('is-on');
    prev.classList.add('is-out');
    words[i].classList.remove('is-out');
    words[i].classList.add('is-on');
    setTimeout(() => prev.classList.remove('is-out'), 650);
  }, 2600);
}

// ===== Servicios: tarjetas que se voltean; en celular, baraja que se desliza =====
const cardsBox = document.getElementById('cards');
const cards = [...cardsBox.querySelectorAll('.card')];
let deckOn = false;
let deckIndex = 0;
let swiped = false;

document.querySelectorAll('.card-inner').forEach((card) => {
  card.addEventListener('click', () => {
    if (swiped) return;
    if (deckOn && !card.closest('.card').matches('[data-pos="0"]')) return;
    const on = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', on);
  });
});

(() => {
  const name = document.getElementById('deckName');
  const bars = [...document.querySelectorAll('#deckBars i')];
  const N = cards.length;
  const layout = () => {
    cards.forEach((c, k) => {
      const pos = (k - deckIndex + N) % N;
      c.dataset.pos = pos;
      c.style.setProperty('--pos', pos);
      c.inert = pos !== 0;
    });
    name.textContent = cards[deckIndex].querySelector('.front .card-title').textContent;
    bars.forEach((b, k) => b.classList.toggle('on', k === deckIndex));
  };
  const go = (d) => { deckIndex = (deckIndex + d + N) % N; layout(); };
  const fling = (dir) => {
    const c = cards[deckIndex];
    c.classList.remove('dragging');
    c.style.setProperty('--tx', `${dir * 120}vw`);
    c.style.setProperty('--rz', `${dir * 22}deg`);
    setTimeout(() => {
      c.classList.add('dragging');
      c.style.removeProperty('--tx');
      c.style.removeProperty('--rz');
      const inner = c.querySelector('.card-inner');
      inner.classList.remove('flipped');
      inner.setAttribute('aria-pressed', 'false');
      go(1);
      requestAnimationFrame(() => requestAnimationFrame(() => c.classList.remove('dragging')));
    }, reduceMotion ? 0 : 260);
  };
  const mq = window.matchMedia('(max-width: 639px)');
  const setDeck = () => {
    deckOn = mq.matches;
    cardsBox.classList.toggle('is-deck', deckOn);
    if (deckOn) { cards.forEach((c) => c.classList.add('in')); layout(); return; }
    cards.forEach((c) => { c.inert = false; c.removeAttribute('data-pos'); c.style.removeProperty('--pos'); });
  };
  mq.addEventListener('change', setDeck);
  setDeck();
  document.getElementById('deckPrev').addEventListener('click', () => go(-1));
  document.getElementById('deckNext').addEventListener('click', () => fling(-1));

  let sx = 0, sy = 0, down = false, drag = false;
  cardsBox.addEventListener('pointerdown', (e) => {
    if (!deckOn || !cards[deckIndex].contains(e.target)) return;
    down = true; drag = false; sx = e.clientX; sy = e.clientY;
  });
  cardsBox.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - sx, dy = e.clientY - sy, c = cards[deckIndex];
    if (!drag) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        drag = true; c.classList.add('dragging');
        try { cardsBox.setPointerCapture(e.pointerId); } catch (_) {}
      } else if (Math.abs(dy) > 10) down = false;
      return;
    }
    c.style.setProperty('--tx', `${dx}px`);
    c.style.setProperty('--rz', `${dx * 0.06}deg`);
  });
  const end = (e) => {
    if (!down) return;
    down = false;
    if (!drag) return;
    swiped = true; setTimeout(() => { swiped = false; }, 0);
    const dx = e.clientX - sx, c = cards[deckIndex];
    if (Math.abs(dx) > 80) fling(dx > 0 ? 1 : -1);
    else { c.classList.remove('dragging'); c.style.removeProperty('--tx'); c.style.removeProperty('--rz'); }
  };
  cardsBox.addEventListener('pointerup', end);
  cardsBox.addEventListener('pointercancel', end);
})();

// ===== Cómo trabajamos: dial interactivo según el caso =====
(() => {
  const STEPS = [
    { t: 'Diagnóstico', g: 'Entendemos tu marca, tu público y dónde estás hoy.', k: 'un diagnóstico claro' },
    { t: 'Estrategia', g: 'Definimos el giro: objetivos, mensajes y canales.', k: 'tu estrategia por escrito' },
    { t: 'Creación', g: 'Diseñamos, producimos y lanzamos.', k: 'piezas listas para salir' },
    { t: 'Optimización', g: 'Medimos, aprendemos y ajustamos para crecer.', k: 'un informe mensual con lo que funcionó' }
  ];
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
  const dial = document.getElementById('qdial');
  const hub = document.getElementById('qdeg');
  const card = document.getElementById('stepcard');
  const qs = [...dial.querySelectorAll('.q')];
  const prev = document.getElementById('stPrev');
  const next = document.getElementById('stNext');
  const cta = document.getElementById('stCta');
  let step = 0, cs = 0, deg = 90;

  const render = (anim) => {
    const s = STEPS[step];
    $('#scNum').textContent = step + 1;
    $('#scTitle').textContent = s.t;
    $('#scGen').textContent = s.g;
    $('#scCase').textContent = CASES[cs][step];
    $('#scTake').textContent = s.k;
    qs.forEach((q, k) => q.classList.toggle('on', k <= step));
    dial.setAttribute('aria-valuenow', step + 1);
    dial.setAttribute('aria-valuetext', `Paso ${step + 1}: ${s.t}`);
    prev.disabled = step === 0;
    next.hidden = step === 3;
    cta.hidden = step !== 3;
    if (anim && !reduceMotion) { card.classList.remove('in'); void card.offsetWidth; card.classList.add('in'); }
  };
  const setDeg = (d) => {
    deg = Math.max(0, Math.min(360, d));
    dial.style.setProperty('--deg', `${deg}deg`);
    hub.textContent = `${Math.round(deg)}°`;
    const st = Math.min(3, Math.max(0, Math.ceil(deg / 90) - 1));
    if (st !== step) { step = st; render(true); }
  };
  const goStep = (i) => setDeg((Math.max(0, Math.min(3, i)) + 1) * 90);

  prev.addEventListener('click', () => goStep(step - 1));
  next.addEventListener('click', () => { goStep(step + 1); if (step === 3) cta.focus({ preventScroll: true }); });
  document.querySelectorAll('input[name="caso"]').forEach((r) => {
    r.addEventListener('change', () => { cs = +r.value; render(true); });
  });
  dial.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowUp') { e.preventDefault(); goStep(step + 1); }
    if (k === 'ArrowLeft' || k === 'ArrowDown') { e.preventDefault(); goStep(step - 1); }
    if (k === 'Home') { e.preventDefault(); goStep(0); }
    if (k === 'End') { e.preventDefault(); goStep(3); }
  });
  const angle = (e) => {
    const r = dial.getBoundingClientRect();
    const a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
    return (a + 360) % 360;
  };
  let dn = false, moved = false, last = 0, x0 = 0, y0 = 0;
  dial.addEventListener('pointerdown', (e) => {
    dn = true; moved = false; last = angle(e); x0 = e.clientX; y0 = e.clientY;
    try { dial.setPointerCapture(e.pointerId); } catch (_) {}
  });
  dial.addEventListener('pointermove', (e) => {
    if (!dn) return;
    if (!moved && Math.hypot(e.clientX - x0, e.clientY - y0) < 6) return;
    if (!moved) { moved = true; dial.classList.add('drag'); }
    const a = angle(e);
    setDeg(deg + norm(a - last));
    last = a;
  });
  const up = (e) => {
    if (!dn) return;
    dn = false;
    if (!moved) { goStep(Math.ceil(Math.max(1, angle(e)) / 90) - 1); return; }
    dial.classList.remove('drag');
    goStep(step);
  };
  dial.addEventListener('pointerup', up);
  dial.addEventListener('pointercancel', up);
})();

// ===== Equipo: cromos que se giran (y se inclinan con el mouse) =====
(() => {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.querySelectorAll('.cromo-in').forEach((c) => {
    const reset = () => { c.classList.remove('tilting'); ['--rx', '--ry', '--fx'].forEach((p) => c.style.removeProperty(p)); };
    c.addEventListener('click', () => {
      reset();
      c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
    if (!fine || reduceMotion) return;
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.classList.add('tilting');
      c.style.setProperty('--ry', `${(px - .5) * 16}deg`);
      c.style.setProperty('--rx', `${(.5 - py) * 12}deg`);
      c.style.setProperty('--fx', `${px * 100}%`);
    });
    c.addEventListener('pointerleave', reset);
  });
})();

// Frase del manifiesto: se pinta letra por letra
const frase = document.getElementById('frase');
const pieces = [];
if (frase) {
  const lines = [...frase.querySelectorAll('.line')];
  lines.forEach((line, li) => {
    const text = line.textContent.trim();
    line.textContent = '';
    line.setAttribute('aria-hidden', 'true');
    // La última línea ("tuya gire!") se pinta de rojo
    const hot = li === lines.length - 1;
    text.split(' ').forEach((word, wi, arr) => {
      const w = document.createElement('span');
      w.style.whiteSpace = 'nowrap';
      [...word].forEach((ch) => {
        const s = document.createElement('span');
        s.className = hot ? 'letter hot' : 'letter';
        s.textContent = ch;
        w.appendChild(s);
        pieces.push(s);
      });
      line.appendChild(w);
      if (wi < arr.length - 1) line.appendChild(document.createTextNode(' '));
    });
  });
}

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

// ===== Menú: la ruleta =====
(() => {
  const ruleta = document.getElementById('ruleta');
  const stage = document.getElementById('stage');
  const wheel = document.getElementById('wheel');
  const menuBtn = document.getElementById('menuBtn');
  const spokes = [...ruleta.querySelectorAll('.spoke')];
  const btns = spokes.map((s) => s.querySelector('button'));
  const N = spokes.length;
  let active = 0, rot = 0, dragged = false;

  const setActive = (i, focus) => {
    i = ((i % N) + N) % N;
    rot += norm(-i * 60 - rot);
    active = i;
    wheel.style.setProperty('--rot', `${rot}deg`);
    spokes.forEach((s, k) => { s.classList.toggle('on', k === i); btns[k].setAttribute('aria-current', k === i ? 'true' : 'false'); });
    const b = btns[i];
    $('#infoDeg').textContent = `${b.dataset.deg}°`;
    $('#infoDesc').textContent = b.dataset.desc;
    $('#infoName').textContent = b.firstElementChild.textContent;
    if (focus) b.focus({ preventScroll: true });
  };
  const lock = (on) => {
    [main, topbar, footer].forEach((el) => { if (el) el.inert = on; });
    root.style.overflow = on ? 'hidden' : '';
  };
  const current = () => {
    // Sección que ocupa el centro de la pantalla, para abrir la ruleta ahí
    const mid = innerHeight / 2;
    const k = btns.findIndex((b) => {
      const r = document.getElementById(b.dataset.target).getBoundingClientRect();
      return r.top <= mid && r.bottom >= mid;
    });
    return Math.max(0, k);
  };
  const open = () => {
    const r = menuBtn.querySelector('.knob-sm').getBoundingClientRect();
    ruleta.style.setProperty('--ox', `${r.left + r.width / 2}px`);
    ruleta.style.setProperty('--oy', `${r.top + r.height / 2}px`);
    ruleta.classList.add('open');
    ruleta.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    lock(true);
    setActive(current());
    setTimeout(() => btns[active].focus({ preventScroll: true }), reduceMotion ? 0 : 380);
  };
  const close = (restore = true) => {
    ruleta.classList.remove('open');
    ruleta.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    lock(false);
    if (restore) menuBtn.focus({ preventScroll: true });
  };
  const go = (i) => {
    const el = document.getElementById(btns[i].dataset.target);
    close(false);
    setTimeout(() => {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: reduceMotion ? 'auto' : 'smooth' });
    }, reduceMotion ? 0 : 260);
  };
  menuBtn.addEventListener('click', open);
  document.getElementById('closeBtn').addEventListener('click', () => close());
  document.getElementById('goBtn').addEventListener('click', () => go(active));
  btns.forEach((b, k) => {
    b.addEventListener('focus', () => { if (k !== active) setActive(k); });
    b.addEventListener('click', (e) => {
      if (dragged) { e.preventDefault(); return; }
      if (k === active) go(k);
      else { setActive(k); setTimeout(() => go(k), reduceMotion ? 0 : 480); }
    });
  });
  ruleta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); setActive(active + 1, true); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); setActive(active - 1, true); return; }
    if (e.key === 'Tab') {
      const f = [...ruleta.querySelectorAll('button, a')];
      const idx = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(idx + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus({ preventScroll: true });
    }
  });
  let acc = 0, lastStep = 0;
  ruleta.addEventListener('wheel', (e) => {
    e.preventDefault();
    acc += e.deltaY;
    const now = Date.now();
    if (Math.abs(acc) > 40 && now - lastStep > 200) { setActive(active + (acc > 0 ? 1 : -1)); acc = 0; lastStep = now; }
  }, { passive: false });
  let y0 = 0, rot0 = 0, down = false;
  stage.addEventListener('pointerdown', (e) => { down = true; dragged = false; y0 = e.clientY; rot0 = rot; });
  stage.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dy = e.clientY - y0;
    if (!dragged && Math.abs(dy) > 6) {
      dragged = true; stage.classList.add('drag');
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    }
    if (dragged) { rot = rot0 + dy * 0.35; wheel.style.setProperty('--rot', `${rot}deg`); }
  });
  const end = () => {
    if (!down) return;
    down = false;
    if (dragged) {
      stage.classList.remove('drag');
      setActive(Math.round(-rot / 60), true);
      setTimeout(() => { dragged = false; }, 0);
    }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  setActive(0);
})();

// ===== Easter egg: la página da un giro y aparece el minijuego =====
(() => {
  const btn = document.getElementById('eggBtn');
  const game = document.getElementById('game');
  const dial = document.getElementById('gDial');
  const needle = document.getElementById('gNeedle');
  const zone = document.getElementById('gZone');
  const core = document.getElementById('gCore');
  const scoreEl = document.getElementById('gScore');
  const msg = document.getElementById('gMsg');
  const lives = [...document.querySelectorAll('#gLives svg')];
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
    [main, topbar, footer].forEach((el) => { if (el) el.inert = on; });
    root.style.overflow = on ? 'hidden' : '';
  };
  const openGame = () => { game.hidden = false; lock(true); start(); };
  const closeGame = (toContact) => {
    running = false; cancelAnimationFrame(raf);
    game.hidden = true; lock(false);
    if (toContact) {
      const c = document.getElementById('contacto');
      window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY - 64, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else btn.focus({ preventScroll: true });
  };
  btn.addEventListener('click', () => {
    if (reduceMotion) { openGame(); return; }
    main.style.transformOrigin = `50% ${window.scrollY + innerHeight / 2}px`;
    [main, footer, topbar].forEach((el) => el && el.classList.add('spinning'));
    setTimeout(() => {
      [main, footer, topbar].forEach((el) => el && el.classList.remove('spinning'));
      main.style.transformOrigin = '';
      openGame();
    }, 1550);
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

// Todo lo que depende del scroll, en un solo cuadro de animación
const progress = document.getElementById('progress');
const mark = document.getElementById('pivot-mark');
const turnKnob = document.getElementById('turnKnob');

const clamp = (v) => Math.min(1, Math.max(0, v));

const onScroll = () => {
  const y = window.scrollY;
  const vh = window.innerHeight;
  const max = document.documentElement.scrollHeight - vh;
  const p = max > 0 ? y / max : 0;

  topbar.classList.toggle('scrolled', y > 20);
  progress.style.transform = `scaleX(${p})`;

  // La perilla del menú gira con el avance de la página
  turnKnob.style.transform = `rotate(${p * 360}deg)`;

  // El "!" de la portada pivota mientras bajas
  if (mark && !reduceMotion) mark.style.transform = `rotate(${Math.min(y * 0.12, 90)}deg)`;

  // Frase del manifiesto
  if (frase) {
    const r = frase.getBoundingClientRect();
    const fp = clamp((vh * 0.85 - r.top) / (vh * 0.3 + r.height * 0.6));
    const n = reduceMotion ? pieces.length : Math.round(fp * pieces.length);
    pieces.forEach((el, i) => el.classList.toggle('painted', i < n));
  }
};

let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => { onScroll(); ticking = false; });
    ticking = true;
  }
}, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

// Fórmula: se arma cuando aparece en pantalla
const formula = document.getElementById('formula');
if (formula) {
  if ('IntersectionObserver' in window && !reduceMotion) {
    const fo = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        formula.classList.add('play');
        fo.disconnect();
      }
    }, { threshold: 0.5 });
    fo.observe(formula);
  } else {
    formula.classList.add('play');
  }
}

// Cursor rojo en computadora
const cursor = document.getElementById('cursor');
if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
  let cx = 0, cy = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', (e) => {
    tx = e.clientX; ty = e.clientY;
    cursor.classList.add('on');
    cursor.classList.toggle('grow', !!e.target.closest('a, button, summary, .qdial, .gdial'));
  });
  document.addEventListener('mouseleave', () => cursor.classList.remove('on'));
  // La gota se estira en la dirección del movimiento y vuelve a ser redonda al detenerse
  const follow = () => {
    const dx = (tx - cx) * 0.2, dy = (ty - cy) * 0.2;
    cx += dx; cy += dy;
    const v = Math.min(Math.hypot(dx, dy), 40);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    cursor.style.transform = `translate3d(${cx}px,${cy}px,0) rotate(${ang}deg) scale(${1 + v / 45},${1 - v / 110})`;
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
}

// ===== Portada: una gota sigue al mouse y se funde con la mancha roja =====
(() => {
  const art = document.querySelector('.hero-art');
  const drop = document.getElementById('curBlob');
  if (!art || !drop || reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  art.addEventListener('pointermove', (e) => {
    const r = art.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);
    const max = r.width * 0.42, d = Math.hypot(x, y);
    if (d > max) { x *= max / d; y *= max / d; }
    drop.style.setProperty('--cx', `${x}px`);
    drop.style.setProperty('--cy', `${y}px`);
  });
  art.addEventListener('pointerleave', () => {
    drop.style.setProperty('--cx', '0px');
    drop.style.setProperty('--cy', '0px');
  });
})();
