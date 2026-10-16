"""Arma una vista previa de un solo archivo (para publicarla como artefacto).

Toma web/index.html, mete styles.css y script.js dentro del mismo archivo y quita
el <!doctype>, <html>, <head> y <body>, que el visor de artefactos agrega solo.
El sitio que se sube a Hostinger es web/ tal cual; esto es solo para revisar.

Uso: python3 -I pivot/fluido-nuevo/vista-previa.py
"""
import re

BASE = "pivot/fluido-nuevo"
html = open(f"{BASE}/web/index.html", encoding="utf8").read()
css = open(f"{BASE}/web/styles.css", encoding="utf8").read()
js = open(f"{BASE}/web/script.js", encoding="utf8").read()

head = html[html.index("<head>") + 6:html.index("</head>")]
body = html[html.index("<body>") + 6:html.index("</body>")]
keep = [l for l in head.splitlines() if re.search(r"<title>|name=\"description\"|rel=\"icon\"|preconnect|fonts.googleapis.com/css2", l)]
early = head[head.index("<script>"):head.index("</script>") + 9]
body = body.replace('<script src="script.js?v=1"></script>', f"<script>\n{js}\n</script>")
keep = ["<title>Pivot Líquido</title>" if "<title>" in l else l for l in keep]
out = "\n".join(l.strip() for l in keep) + f"\n<style>\n{css}\n</style>\n{early}\n{body.strip()}\n"
open(f"{BASE}/vista-previa.html", "w", encoding="utf8").write(out)
print(f"{BASE}/vista-previa.html listo")
