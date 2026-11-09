// Íconos de las apps del hub (SVG propios, 100 × 100). Son constantes del código, no contenido de usuarios.
const fondo = (relleno, extra = "") =>
  `<rect width="100" height="100" rx="23" fill="${relleno}"/>${extra}`;

const brillo = `<rect width="100" height="100" rx="23" fill="url(#brillo)"/>`;
const defs = `<defs>
  <linearGradient id="brillo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="g-auditoria" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0582A"/><stop offset="1" stop-color="#C42F10"/></linearGradient>
  <linearGradient id="g-parrillas" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2E8C72"/><stop offset="1" stop-color="#1B5E4C"/></linearGradient>
  <linearGradient id="g-briefs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7C24F"/><stop offset="1" stop-color="#E9A21F"/></linearGradient>
</defs>`;

const ICONOS = {
  // Bong: lista de tareas con la primera marcada en rojo
  bong: fondo("#121010", `
    <rect x="24" y="25" width="14" height="14" rx="4" fill="#E63915"/>
    <path d="M27.5 32l3 3 5-6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="45" y="29.5" width="31" height="5" rx="2.5" fill="#F5F0E8" opacity=".45"/>
    <rect x="24" y="44" width="14" height="14" rx="4" fill="none" stroke="#F5F0E8" stroke-width="3"/>
    <rect x="45" y="48.5" width="25" height="5" rx="2.5" fill="#F5F0E8"/>
    <rect x="24" y="63" width="14" height="14" rx="4" fill="none" stroke="#F5F0E8" stroke-width="3"/>
    <rect x="45" y="67.5" width="29" height="5" rx="2.5" fill="#F5F0E8"/>`),

  // Auditoría: cuadrícula de Instagram con una lupa
  auditoria: fondo("url(#g-auditoria)", `
    <g fill="#fff" opacity=".35">
      <rect x="20" y="20" width="16" height="16" rx="3"/><rect x="40" y="20" width="16" height="16" rx="3"/><rect x="60" y="20" width="16" height="16" rx="3"/>
      <rect x="20" y="40" width="16" height="16" rx="3"/><rect x="20" y="60" width="16" height="16" rx="3"/>
    </g>
    <circle cx="55" cy="55" r="15" fill="none" stroke="#fff" stroke-width="6"/>
    <path d="M66 66l12 12" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`),

  // Cotizador: hoja con precio y sello rojo
  cotizador: fondo("#F5F0E8", `
    <rect x="25" y="17" width="44" height="60" rx="6" fill="#fff" stroke="#121010" stroke-width="3.5"/>
    <rect x="32" y="27" width="22" height="4" rx="2" fill="#121010"/>
    <rect x="32" y="36" width="30" height="3.5" rx="1.75" fill="#8A847C"/>
    <rect x="32" y="44" width="26" height="3.5" rx="1.75" fill="#8A847C"/>
    <circle cx="66" cy="68" r="15" fill="#E63915"/>
    <text x="66" y="75.5" text-anchor="middle" font-family="Bricolage Grotesque, Arial Black, sans-serif" font-weight="800" font-size="21" fill="#fff">$</text>`),

  // Briefs: portapapeles con líneas
  briefs: fondo("url(#g-briefs)", `
    <rect x="25" y="22" width="50" height="60" rx="7" fill="#fff"/>
    <rect x="38" y="16" width="24" height="12" rx="4" fill="#121010"/>
    <rect x="34" y="40" width="32" height="4" rx="2" fill="#121010"/>
    <rect x="34" y="50" width="26" height="4" rx="2" fill="#8A847C"/>
    <rect x="34" y="60" width="30" height="4" rx="2" fill="#8A847C"/>
    <circle cx="66" cy="70" r="4" fill="#E63915"/>`),

  // Moodboards: collage de recortes con chinche
  moodboards: fondo("#FFFFFF", `
    <rect x="17" y="20" width="32" height="38" rx="5" fill="#E63915" transform="rotate(-6 33 39)"/>
    <rect x="50" y="18" width="33" height="26" rx="5" fill="#121010" transform="rotate(5 66 31)"/>
    <rect x="52" y="49" width="30" height="32" rx="5" fill="#F2B33D" transform="rotate(-4 67 65)"/>
    <rect x="19" y="62" width="30" height="20" rx="5" fill="#B9D4C7" transform="rotate(4 34 72)"/>
    <circle cx="33" cy="24" r="4.5" fill="#121010"/>`),

  // Parrillas: calendario con publicaciones marcadas
  parrillas: fondo("url(#g-parrillas)", `
    <rect x="18" y="24" width="64" height="56" rx="8" fill="#fff"/>
    <rect x="18" y="24" width="64" height="14" rx="8" fill="#121010"/>
    <rect x="18" y="32" width="64" height="6" fill="#121010"/>
    <rect x="30" y="16" width="5" height="14" rx="2.5" fill="#fff"/><rect x="65" y="16" width="5" height="14" rx="2.5" fill="#fff"/>
    <g fill="#E0D8CA">
      <rect x="26" y="45" width="10" height="9" rx="2"/><rect x="45" y="45" width="10" height="9" rx="2"/>
      <rect x="26" y="61" width="10" height="9" rx="2"/><rect x="64" y="61" width="10" height="9" rx="2"/>
    </g>
    <rect x="64" y="45" width="10" height="9" rx="2" fill="#E63915"/>
    <rect x="45" y="61" width="10" height="9" rx="2" fill="#E63915"/>`),
};

/** Devuelve el elemento SVG del ícono de una app. */
export function icono(id) {
  const plantilla = document.createElement("template");
  plantilla.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${defs}${ICONOS[id] ?? fondo("#8A847C")}${brillo}</svg>`;
  return plantilla.content.firstElementChild;
}
