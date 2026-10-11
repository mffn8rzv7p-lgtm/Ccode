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
