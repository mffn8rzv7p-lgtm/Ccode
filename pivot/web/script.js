// ===== Pivot · interacciones =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

// Año del pie de página
document.getElementById('year').textContent = new Date().getFullYear();

// Entrada de la portada
requestAnimationFrame(() => root.classList.add('loaded'));

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

// Tarjetas de servicios: se voltean al tocarlas
document.querySelectorAll('.card-inner').forEach((card) => {
  card.addEventListener('click', () => {
    const on = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', on);
  });
});

// Equipo: en celular, la tarjeta pivota al tocarla
document.querySelectorAll('.person-card').forEach((card) => {
  card.addEventListener('click', () => card.classList.toggle('on'));
});

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

// Todo lo que depende del scroll, en un solo cuadro de animación
const topbar = document.getElementById('topbar');
const progress = document.getElementById('progress');
const mark = document.getElementById('pivot-mark');
const steps = document.getElementById('steps');
const stepItems = steps ? [...steps.children] : [];

const clamp = (v) => Math.min(1, Math.max(0, v));

const onScroll = () => {
  const y = window.scrollY;
  const vh = window.innerHeight;
  const max = document.documentElement.scrollHeight - vh;

  topbar.classList.toggle('scrolled', y > 20);
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

  // El "!" de la portada pivota mientras bajas
  if (mark && !reduceMotion) mark.style.transform = `rotate(${Math.min(y * 0.12, 90)}deg)`;

  // Línea de los pasos
  if (steps) {
    const r = steps.getBoundingClientRect();
    const p = reduceMotion ? 1 : clamp((vh * 0.75 - r.top) / (r.height + vh * 0.1));
    steps.style.setProperty('--p', p.toFixed(3));
    stepItems.forEach((el, i) => el.classList.toggle('on', p >= (i + 0.15) / stepItems.length || p === 1));
  }

  // Frase del manifiesto
  if (frase) {
    const r = frase.getBoundingClientRect();
    const p = clamp((vh * 0.85 - r.top) / (vh * 0.3 + r.height * 0.6));
    const n = reduceMotion ? pieces.length : Math.round(p * pieces.length);
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
    cursor.classList.toggle('grow', !!e.target.closest('a, button, summary'));
  });
  document.addEventListener('mouseleave', () => cursor.classList.remove('on'));
  const follow = () => {
    cx += (tx - cx) * 0.2;
    cy += (ty - cy) * 0.2;
    cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
}
