---
name: neweb
description: Crea la página web profesional de un negocio nuevo, de principio a fin, guiando paso a paso a una persona principiante (sin experiencia con la Terminal). Entrevista sobre el negocio, propone un estilo para aprobar, construye una página estática animada, la revisa en computadora y celular, y la entrega lista para publicar en Hostinger o Netlify. Usar cuando el usuario escriba /neweb o pida una página web nueva para un cliente o negocio.
argument-hint: "[nombre del cliente o negocio]"
---

# /neweb: página web profesional para un negocio

Vas a acompañar a una persona **principiante** a crear la página web de un negocio, de la idea a la página publicada. El ejemplo terminado de referencia es `chispazo/web/` en este repositorio: léelo cuando necesites ver cómo se resolvió algo (secciones, animaciones, selector de moneda, botón de WhatsApp).

## Cómo tratar a la persona (obligatorio)

- Habla en español, claro y cálido, sin jerga. Si usas un término técnico, explícalo en la misma frase.
- **Un paso a la vez.** Antes de cada acción, explica en una frase qué vas a hacer y para qué.
- **Pide permiso antes de instalar cualquier cosa.**
- **Espera su confirmación** en todo lo que dependa de ella: crear cuentas, pagar, iniciar sesión, subir archivos, aprobar el estilo. Nunca des por hecho que lo hizo.
- **Si algo falla, arréglalo antes de seguir**, y cuéntale qué pasó en palabras simples, sin culparla.
- No inventes datos del negocio (precios, envíos, materiales, testimonios). Si no lo sabes, pregúntalo o déjalo fuera.

## Paso 0: Carpeta del cliente

Cada cliente va en su propia carpeta en la raíz del repositorio, en minúsculas y sin espacios:

```
<cliente>/
  web/        ← la página: index.html, styles.css, script.js, img/
  entregas/   ← .zip para publicar y fotos de vista previa
```

Si el nombre viene en el argumento, úsalo. Si no, pregúntalo. Si la carpeta ya existe, pregunta si es una página nueva o un cambio a la existente.

## Paso 1: Revisar el entorno (antes de prometer nada)

Comprueba en silencio qué hay disponible y luego cuéntale el resultado en una o dos líneas:

- `node -v`, y si responde el registro de npm (`npm view vite version --fetch-timeout=15000 --fetch-retries=0`).
- Si estás en la **nube** (Claude Code en la web), explícale una sola vez que trabajas en una computadora remota y que no puedes tocar la suya.
- **Si npm no responde** (pasa en la nube con red limitada): no pierdas tiempo intentando cambiar la configuración de red. Propón directamente el camino **"sin instalar"**: HTML + CSS + JavaScript sin dependencias. Es el camino por defecto y el que se usó con Chispazo. Solo si npm funciona y la persona lo pide, ofrece React + Vite + Tailwind + Motion, pidiendo permiso antes.

## Paso 2: Entrevista del negocio

Pide esto en un solo mensaje corto, como lista para completar:

- **Negocio:** nombre y qué hace
- **Clientes:** a quién le vende
- **Productos o servicios:** lista, con precios si quiere mostrarlos
- **Cómo compran:** enlaces (Amazon, tienda, WhatsApp, formulario…)
- **Contacto y redes:** WhatsApp, correo, Instagram, etc.
- **Estilo:** elegante / minimalista / moderno, o "recomiéndame uno"
- **Material visual:** logo, fotos y portadas, o enlaces donde estén

### Sacar material de enlaces (Amazon y otros)

Si comparte enlaces, extrae tú el material real (textos, imágenes y precios) en vez de pedirle capturas:

- Descarga con navegador simulado: `curl -sSL --compressed -A "Mozilla/5.0 …Chrome/128…" -H "Accept-Language: es-ES,es;q=0.9"`. Sin `--compressed` el HTML llega comprimido.
- **Amazon, ficha de libro o producto:** usa `https://www.amazon.com/-/es/dp/<ASIN>`, porque `/dp/<ASIN>` sin `/-/es` a veces devuelve captcha. Del HTML saca `productTitle`, la descripción (`bookDescription_feature_div`), el precio (`a-offscreen`), los detalles (páginas, dimensiones) y la portada en alta (`"hiRes":"…"`).
- **Amazon, página de autor** (`/stores/author/<ID>/about`): la biografía y la foto o logo están en el JSON `"biography":[…]` y `"image":"…amzn-author-media-prod…"`.
- Si un sitio está bloqueado por la red, díselo, sigue con lo demás y pídele ese material directamente en el chat.
- Mira cada imagen descargada antes de usarla.

## Paso 3: Proponer el estilo y esperar aprobación

Antes de construir, muéstrale una propuesta concreta, **sacada de su logo y su material** si existe:

- **Colores**, 4 a 6 con su código (#hex), diciendo de dónde salen ("el amarillo de tu logo").
- **Letras** de Google Fonts: una para títulos, una para etiquetas si hace falta, una para textos. Aclara que son las más parecidas si no conoces la original.
- **Detalles visuales y animaciones**, ligados a lo que vende (con Chispazo: globos de diálogo como en sus portadas y una frase que se colorea al bajar, porque vende libros para colorear).
- **Secciones**, en orden.
- **Tono de los textos**, con un ejemplo de frase.

Termina con: **"¿Apruebas este estilo?"** y **espera**. No construyas sin un sí.

## Paso 4: Construir

Archivos en `<cliente>/web/`: `index.html`, `styles.css`, `script.js` e `img/`.

**Imágenes** (con Pillow, `python3 -I`):
- Convierte a `.webp`, de 700px de ancho máximo para portadas y fotos (calidad ~82).
- Logos con fondo blanco o negro: quítale el fondo con relleno por inundación desde los bordes (solo los píxeles claros u oscuros conectados al borde), suaviza el borde y recorta.
- Favicon PNG de 64px.

**Requisitos de la página:**
- Mobile first. Sin scroll horizontal: `overflow-x: clip` en `html` y `body`.
- Colores como variables en `:root`. Fuentes de Google Fonts con `display=swap`.
- Animación al aparecer: clase `reveal` + IntersectionObserver. Para evitar parpadeo, agrega `<script>document.documentElement.classList.add('js')</script>` en el `<head>`, y en el CSS `.js .reveal`.
- Respeta `prefers-reduced-motion` (sin animaciones y todo visible).
- Botones de al menos 44px de alto, con `:focus-visible`. Enlaces externos con `target="_blank" rel="noopener"`.
- `<title>`, `meta description`, Open Graph y `theme-color`.
- **Versión en los archivos** para evitar la caché: `styles.css?v=1` y `script.js?v=1`. **Sube el número en cada entrega** (Hostinger guarda CSS y JS en caché 7 días; sin esto, los visitantes ven la versión vieja).
- Textos en el idioma y el tono del negocio, usando sus propias frases cuando existan.
- Todo lo que guardes en `localStorage` va dentro de `try/catch`.

**Módulos ya probados en `chispazo/web/`**, para reutilizar si aplican:
- Selector de moneda como menú desplegable en la barra superior, con banderas SVG (COP, MXN, ARS, CLP, USD), accesible con teclado y nota de precios debajo de las tarjetas: tasa del día desde `https://open.er-api.com/v6/latest/USD` con caché de 12 h y tasas de respaldo, moneda inicial según `navigator.language`, nota de "precio aproximado". Las banderas en SVG, porque los emojis de banderas no se ven en Windows.
- Sección de grupo de WhatsApp con botón verde e ícono. Un enlace `chat.whatsapp.com/…` es un **grupo**; `whatsapp.com/channel/…` es un **canal**. Usa la palabra correcta.
- Frase que se colorea letra por letra al bajar (`#frase` en `script.js`).
- Tarjetas para seguir varias cuentas de Instagram (`.social`), con logo de cada submarca.
- Cinta animada con frases (`.marquee`), preguntas frecuentes con `<details>` y tarjetas de producto con botón de compra.

## Paso 5: Revisar antes de mostrar

```bash
node .claude/skills/neweb/scripts/capturas.js <cliente>/web/index.html <scratchpad>/capturas "Fuente1,Fuente2"
```

- Lee el reporte: errores, scroll horizontal, fuentes, imágenes rotas y enlaces.
- **Mira las capturas** de computadora y celular. Busca textos cortados, elementos desalineados entre tarjetas, letras pegadas y contraste bajo.
- Corrige y repite hasta que diga "Todo en orden" y se vea bien. Cuéntale qué corregiste, en una línea.

## Paso 6: Entregar

1. Copia `vista-computadora.png` y `vista-celular.png` a `<cliente>/entregas/` y envíalas con SendUserFile (`display: render`).
2. Arma el .zip:
   ```bash
   python3 -I .claude/skills/neweb/scripts/empaquetar.py <cliente>/web <cliente>/entregas <cliente>
   ```
   y envíalo con SendUserFile (`display: attach`). Dile que lo descargue y que **no lo descomprima**.
3. Haz commit y push (los archivos se pierden si la sesión en la nube termina). Explícale que su página quedó guardada en GitHub.
4. Resume en lista corta qué tiene la página y qué datos conviene que confirme (por ejemplo, precios que pueden cambiar).
5. Pregunta si quiere cambiar algo o si pasamos a publicar.

## Paso 7: Publicar

Pregunta dónde: **Hostinger** (si ya tiene cuenta y dominio), **Netlify** (gratis, el más fácil) o **GitHub Pages** (gratis, pero el repositorio debe ser público). Aclara que el servicio de hosting no trae visitas; las visitas vienen de la promoción.

**Hostinger, paso a paso, esperando confirmación en cada uno:**
1. hpanel.hostinger.com → **Sitios web** → ¿ve un sitio con **Administrar**? ¿Tiene dominio?
2. **Administrar** → **Archivos** → **Administrador de archivos** → carpeta **`public_html`**. Pregunta qué hay adentro **antes de borrar nada**: si hay un WordPress, no lo borres sin hablarlo.
3. Subir el `.zip` en `public_html` → clic derecho → **Extraer** en la misma carpeta → **reemplazar** → borrar el `.zip`.
4. Abrir el sitio con **Ctrl + F5** (en Mac, **Cmd + Shift + R**).

**Netlify:** app.netlify.com/drop → arrastrar la carpeta `web` (o el `.zip`) → crear la cuenta gratis para que el sitio quede a su nombre.

## Paso 8: Verificar en vivo (siempre que diga "ya lo subí")

1. Compara lo publicado con lo local:
   ```bash
   for f in index.html styles.css script.js; do echo "$f local=$(md5sum < <cliente>/web/$f | cut -c1-8) vivo=$(curl -sS --compressed https://SITIO/$f | md5sum | cut -c1-8)"; done
   ```
2. Revisa con `capturas.js` usando la URL pública.
3. Problemas comunes:
   - **El `index.html` en vivo es el viejo:** casi siempre el navegador descargó el archivo nuevo como `index (1).html` y así se subió. Pídele que lo busque en `public_html`, borre el viejo y renombre el nuevo.
   - **Archivos dentro de una subcarpeta** (`public_html/web/index.html`): el sitio muestra la página de bienvenida de Hostinger.
   - **"No veo el cambio" pero el servidor tiene lo nuevo:** es la caché. Sube el número `?v=` y pide Ctrl + F5 o una ventana de incógnito.

## Cambios después de publicada

- Haz el cambio, **sube el número `?v=`**, revisa con `capturas.js`, haz commit y push.
- Si solo cambió `index.html`, envía ese archivo suelto. Si cambiaron varios, el `.zip` completo.
- Repite el Paso 8 cuando lo suba.

## Lecciones aprendidas (no repetir)

- En la nube, la red puede bloquear npm, Amazon u otros sitios. Prueba con `curl -m 15` antes de prometer algo, y si falla, explícalo y ofrece el camino alternativo enseguida.
- Los cambios de red del entorno pueden no aplicar a la sesión ya abierta; no insistas en eso.
- A la persona dale instrucciones de clic con los nombres exactos de los botones, en español y con el nombre en inglés entre paréntesis, no comandos para copiar.
- No asumas que el `.zip` está bien estructurado: Hostinger necesita `index.html` en la raíz del zip (eso hace `empaquetar.py`).
