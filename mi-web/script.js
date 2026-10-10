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

// Mandala que se colorea solo
const svg = document.getElementById('mandala');
const NS = 'http://www.w3.org/2000/svg';
const palette = ['#FFC226', '#F26A21', '#1E3770', '#8CC63F', '#E0322E', '#2F8FE0', '#7B3FA0', '#FF5E9A'];
const shapes = [];

function petal(length, width) {
  // Pétalo en forma de gota, apuntando hacia arriba desde el centro
  return `M 0 0 C ${width} ${-length * 0.35}, ${width * 0.6} ${-length * 0.85}, 0 ${-length} C ${-width * 0.6} ${-length * 0.85}, ${-width} ${-length * 0.35}, 0 0 Z`;
}

function ring(count, inner, length, width, offset = 0) {
  const group = [];
  for (let i = 0; i < count; i++) {
    const p = document.createElementNS(NS, 'path');
    const angle = (360 / count) * i + offset;
    p.setAttribute('d', petal(length, width));
    p.setAttribute('transform', `rotate(${angle}) translate(0 ${-inner})`);
    svg.appendChild(p);
    group.push(p);
  }
  return group;
}

function dots(count, radius, size, offset = 0) {
  const group = [];
  for (let i = 0; i < count; i++) {
    const c = document.createElementNS(NS, 'circle');
    const a = ((360 / count) * i + offset) * Math.PI / 180;
    c.setAttribute('cx', (Math.sin(a) * radius).toFixed(2));
    c.setAttribute('cy', (-Math.cos(a) * radius).toFixed(2));
    c.setAttribute('r', size);
    svg.appendChild(c);
    group.push(c);
  }
  return group;
}

if (svg) {
  // Del exterior al interior, para que el centro quede encima
  const layers = [
    dots(24, 186, 7, 7.5),
    ring(12, 96, 86, 34),
    ring(12, 70, 80, 26, 15),
    ring(16, 44, 56, 18),
    ring(8, 22, 50, 20, 22.5),
    ring(8, 8, 34, 14),
  ];
  const center = document.createElementNS(NS, 'circle');
  center.setAttribute('r', 16);
  svg.appendChild(center);
  layers.push([center]);

  // Orden de coloreado: del centro hacia afuera
  layers.slice().reverse().forEach((layer, li) => {
    layer.forEach((shape) => shapes.push({ shape, color: palette[li % palette.length] }));
  });

  const section = document.getElementById('para-ti');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const paint = () => {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh * 0.2)));
    const n = reduceMotion ? shapes.length : Math.round(progress * 1.25 * shapes.length);
    shapes.forEach(({ shape, color }, i) => {
      shape.style.fill = i < n ? color : '';
    });
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
