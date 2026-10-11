# Diseño web

Para qué sirve: guía para crear, revisar, publicar y mantener la página web de un cliente, de la entrevista inicial a la página funcionando en internet, con lo básico para que Google la encuentre y se vea bien en el celular.

## Qué incluye y qué no

Alcance típico (como guía; lo que se cobra lo define la cotización hecha con la skill `pivot-cotizacion`):

**Incluye**
- Entrevista del negocio y propuesta de estilo (colores, letras, secciones, tono) para aprobar.
- Página estática (hecha solo con archivos HTML, CSS y JavaScript, sin sistemas que haya que actualizar como WordPress), pensada primero para celular.
- Revisión en computador y celular antes de mostrarla.
- SEO básico (ajustes para que Google entienda la página y la muestre) y accesibilidad básica (que la pueda usar cualquier persona, también con dificultades visuales o con teclado).
- Entrega en `.zip`, publicación en Hostinger o Netlify y verificación en vivo.
- Botón de WhatsApp y enlaces a redes del cliente.

**No incluye (salvo que se cotice aparte)**
- Tienda en línea con pagos, sistemas de reservas o áreas con usuario y contraseña.
- Redacción de blog o contenido continuo (ver [Creación de contenido](creacion-contenido.md)).
- Pauta para llevar visitas (ver [Pauta digital](pauta-digital.md)). El hosting no trae visitas: las visitas vienen de la promoción.
- Compra del dominio o del hosting: los paga y los tiene el cliente, a su nombre.
- Fotos profesionales o logo nuevo.

## Metodología paso a paso

Aterriza las 7 etapas de [la metodología base](../03-metodologia-base.md). La parte técnica la guía la skill del proyecto `/neweb` ([`.claude/skills/neweb/SKILL.md`](../../../.claude/skills/neweb/SKILL.md)); aquí no se repite, solo se dice qué pasa en cada etapa.

1. **Brief: entrevista del negocio.** Con la [plantilla de brief](../plantillas/brief-cliente.md) y la entrevista de `/neweb`: qué hace el negocio, a quién le vende, productos o servicios, cómo compran, contacto y redes, estilo deseado y material visual (logo, fotos). No inventar datos del negocio: lo que no se sepa, se pregunta o se deja fuera.
2. **Estrategia: propuesta de estilo.** Se muestran colores (sacados del logo si existe), letras, detalles visuales, orden de secciones y tono de los textos. Se define también la frase principal por la que el negocio quiere que lo encuentren en Google (por ejemplo, "qué vende + en qué ciudad"). **No se construye sin un sí del cliente.**
3. **Producción: construcción estática.** `/neweb` arma la página en `<cliente>/web/`. Cada versión queda guardada en GitHub (el lugar donde se guardan las versiones de las webs, así nada se pierde y se puede volver atrás).
4. **Aprobación: revisión en computador y celular.** `/neweb` saca capturas de ambas vistas y revisa errores, textos cortados e imágenes rotas. Luego se pasa la revisión de diseño con la skill `web-design-guidelines` y la [lista de chequeo](#lista-de-chequeo) de este archivo. Se le envían al cliente las capturas para aprobar; se aceptan hasta 2 rondas de cambios (sugerencia, editable).
5. **Lanzamiento: entrega y publicación.** Se arma el `.zip` en `<cliente>/entregas/`, se publica en Hostinger (si el cliente ya tiene cuenta y dominio) o en Netlify (gratis y sencillo) y se **verifica en vivo** que lo publicado sea igual a lo aprobado. Se firma el [acta de entrega](../plantillas/acta-entrega.md) y se cobra el 50% final.
6. **Informe.** Si el cliente tiene mantenimiento, se reporta en el [informe mensual](../plantillas/informe-mensual.md) (ver [Qué medimos](#qué-medimos-informe-mensual)).
7. **Optimización: mantenimiento posterior.** Cambios de precios, fotos o textos: se hace el cambio, se sube el número de versión de los archivos (para que los visitantes no vean la versión vieja guardada en su navegador), se revisa, se guarda en GitHub y se vuelve a verificar en vivo. Se sugiere revisar la web cada 3 meses (sugerencia, editable): enlaces, precios, WhatsApp y velocidad.

### Checklist SEO básico, en palabras simples

- **Title (título de la página):** el nombre que sale en la pestaña del navegador y en azul en Google. Uno por página, de unos 50 a 60 caracteres (sugerencia, editable), con lo que vende y la ciudad al inicio. Ej. de estructura: `[Negocio] | [qué vende] en [ciudad]`.
- **Meta description (descripción):** las 1 o 2 líneas grises debajo del título en Google. De 120 a 160 caracteres (sugerencia, editable), honesta y con una invitación a actuar.
- **Encabezados:** un solo título principal (H1) por página y subtítulos (H2, H3) en orden lógico. Ayudan a Google y a quien lee rápido.
- **Textos alternativos en imágenes (alt):** una frase corta que describe cada imagen. La leen Google y los lectores de pantalla que usan personas ciegas. Las imágenes solo decorativas van con alt vacío.
- **Open Graph:** datos ocultos que hacen que, al compartir el enlace por WhatsApp, Facebook o Instagram, aparezca una vista previa bonita con imagen, título y descripción en vez de un enlace pelado. Revisar enviándose el enlace a uno mismo por WhatsApp.
- **Velocidad:** que cargue rápido incluso con datos móviles. Imágenes livianas en formato `.webp`, pocas fuentes y nada pesado innecesario. Meta: que el contenido principal aparezca en menos de 2,5 segundos (sugerencia, editable). Se puede medir gratis en PageSpeed Insights (herramienta de Google que califica la velocidad).
- **Versión móvil:** la mayoría de visitas llegan desde el celular y Google califica la página por su versión de celular. Sin desplazamiento hacia los lados, botones fáciles de tocar y textos legibles.
- **Datos estructurados de negocio local (cuando aplique):** un bloque de información invisible que le dice a Google, en su idioma, el nombre, dirección, teléfono y horario del negocio. Solo si el negocio tiene sitio físico o atiende en una zona, y solo con datos reales confirmados por el cliente.

### Accesibilidad básica

- Buen contraste entre texto y fondo (que se lea a pleno sol en el celular).
- Botones grandes, de al menos 44 píxeles de alto (sugerencia, editable), y que se vea dónde está el foco al navegar con teclado.
- Textos alternativos en imágenes (ver arriba).
- Respetar a quien pidió en su celular "reducir movimiento": sin animaciones para esa persona.
- Enlaces con texto claro ("Escríbenos por WhatsApp", no "clic aquí").

### Dominio y hosting a nombre del cliente

El dominio (la dirección, como `negocio.com`) y el hosting (el espacio donde vive la página) **siempre se compran y quedan a nombre del cliente**, con su correo y su medio de pago. Pivot entra con acceso de colaborador o el cliente comparte pantalla; nunca se piden contraseñas por chat. Ver [Seguridad y datos](../04-seguridad-y-datos.md).

## Herramientas

| Herramienta | Para qué | Estado |
|---|---|---|
| Skill `/neweb` | Entrevista, estilo, construcción, revisión, entrega y verificación en vivo | conectada (en el proyecto) |
| Skill `web-design-guidelines` | Revisión de diseño y accesibilidad | conectada (en el proyecto) |
| GitHub | Guardar todas las versiones de cada web | conectada |
| Hostinger / Netlify | Publicar la página | cuenta del cliente |
| Canva | Imagen para compartir (Open Graph), piezas gráficas | conectada |
| Google Drive | Material del cliente (logo, fotos) | conectada |
| Asana | Tareas y fechas del proyecto | conectada |
| Google Search Console | Ver cómo aparece la web en Google y avisarle que existe | pendiente de conectar |
| Google Analytics | Medir visitas y clics | pendiente de conectar |
| Google Business Profile | Ficha del negocio en Google Maps | pendiente de conectar |

## Lista de chequeo

- [ ] Brief completo y material del cliente guardado en su carpeta de Drive.
- [ ] Estilo aprobado por escrito por el cliente.
- [ ] Todos los datos (precios, horarios, teléfonos) confirmados por el cliente, nada inventado.
- [ ] Title y meta description escritos para cada página.
- [ ] Un solo H1 y subtítulos en orden.
- [ ] Todas las imágenes con texto alternativo y en formato liviano.
- [ ] Vista previa al compartir por WhatsApp revisada (Open Graph).
- [ ] Datos estructurados de negocio local, si aplica, con datos reales.
- [ ] Revisión en computador y celular sin errores (`/neweb`).
- [ ] Revisión de diseño con `web-design-guidelines`.
- [ ] Botón de WhatsApp y enlaces probados uno por uno.
- [ ] Versión guardada en GitHub.
- [ ] `.zip` en `<cliente>/entregas/`.
- [ ] Dominio y hosting a nombre del cliente.
- [ ] Publicada y verificada en vivo (computador y celular).
- [ ] Acta de entrega firmada.

## Definición de terminado

La web está "lista" cuando: el cliente aprobó el diseño, está publicada en su dominio o en Netlify, la verificación en vivo confirma que es la versión aprobada, se ve bien en computador y celular, el botón de WhatsApp funciona, la lista de chequeo está completa, la versión final está en GitHub y el acta de entrega está firmada.

## Qué medimos (informe mensual)

Solo aplica si el cliente tiene mantenimiento. **Para medir visitas, clics y posición hay que conectar Google Analytics y Google Search Console (pendiente de conectar).** Mientras tanto, solo se puede reportar la velocidad.

- **Visitas:** cuántas personas entraron a la web en el mes.
- **Clics a WhatsApp:** cuántas personas tocaron el botón para escribir. Es el número que más se parece a "clientes interesados".
- **Velocidad:** calificación de PageSpeed Insights en celular (de 0 a 100).
- **Posición en Google:** en qué lugar aparece la web al buscar la frase principal del negocio.

## Agentes y skills de apoyo

- **`/neweb`** (skill del proyecto): hace la web paso a paso, de la entrevista a la verificación en vivo.
- **`web-design-guidelines`** (skill del proyecto): revisa diseño, usabilidad y accesibilidad.
- **`seo-specialist`**, agente de ECC (requiere el plugin instalado): auditoría SEO (títulos, descripciones, encabezados, datos estructurados, velocidad).
- **`seo`**, skill de ECC (requiere el plugin instalado): guía de SEO técnico y de contenido.
- **`pivot-cotizacion`** (skill personal): para cotizar la web antes de empezar.

## Errores comunes a evitar

- Construir antes de que el cliente apruebe el estilo.
- Inventar precios, testimonios u horarios para "llenar" la página.
- Comprar el dominio o el hosting a nombre de Pivot o de alguien del equipo.
- Pedir la contraseña de Hostinger por WhatsApp.
- Olvidar subir el número de versión: los visitantes siguen viendo la página vieja.
- Decir "ya está publicada" sin verificar en vivo.
- Imágenes pesadas que hacen la página lenta en el celular.
- Prometer primeros lugares en Google: el posicionamiento toma tiempo y nadie lo puede garantizar.
- No guardar la versión en GitHub y perder el trabajo.
