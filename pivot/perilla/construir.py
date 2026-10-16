"""Construye la versión publicable de La Perilla a partir del prototipo.

Toma pivot/rediseno-v3/index.html (formato artefacto, sin <head>) y escribe
pivot/perilla/web/index.html como documento HTML completo, con idioma, SEO,
Open Graph e íconos. Las imágenes se copian de pivot/rediseno-v3/img
(apple-touch-icon.png y og.jpg ya viven en pivot/perilla/web/img).

Uso: python3 -I pivot/perilla/construir.py
Luego: python3 -I .claude/skills/neweb/scripts/empaquetar.py pivot/perilla/web pivot/perilla/entregas pivot
"""
import os
import shutil

SRC = "pivot/rediseno-v3"
WEB = "pivot/perilla/web"
FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800'
         '&family=DM+Sans:opsz,wght@9..40,400..700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">')

src = open(f"{SRC}/index.html", encoding="utf8").read()
if FONTS not in src:
    raise SystemExit("Las fuentes del prototipo cambiaron: actualiza FONTS en construir.py")
body = src[src.index("<style>"):]
cut = body.index("</style>") + len("</style>")
style, rest = body[:cut], body[cut:]
style = style.replace("<style>", "<style>\nbody{margin:0}\n", 1)

head = f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Pivot · Agencia de marketing digital, pauta y diseño web</title>
  <meta name="description" content="Pivot es una agencia de marketing digital en Medellín: estrategia, creación de contenido, pauta, branding y diseño web para que tu marca deje de pasar desapercibida.">
  <link rel="canonical" href="https://pivotagencia.com/">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://pivotagencia.com/">
  <meta property="og:title" content="Pivot · Tu marca necesita un giro">
  <meta property="og:description" content="Agencia de marketing digital: estrategia, contenido, pauta, branding y diseño web.">
  <meta property="og:image" content="https://pivotagencia.com/img/og.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#E63915">
  <link rel="icon" href="img/favicon.png">
  <link rel="apple-touch-icon" href="img/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  {FONTS}
"""
os.makedirs(f"{WEB}/img", exist_ok=True)
for f in os.listdir(f"{SRC}/img"):
    shutil.copy2(f"{SRC}/img/{f}", f"{WEB}/img/{f}")
with open(f"{WEB}/index.html", "w", encoding="utf8") as out:
    out.write(head + style + "\n</head>\n<body>\n" + rest.strip() + "\n</body>\n</html>\n")
print(f"{WEB}/index.html listo")
