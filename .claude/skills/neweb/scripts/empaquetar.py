"""Empaqueta la carpeta web de un cliente en un .zip listo para subir.

Los archivos quedan sueltos en la raíz del .zip (index.html arriba del todo),
que es lo que necesita Hostinger al extraer dentro de public_html. Netlify Drop
también lo acepta.

Uso: python3 -I empaquetar.py <carpeta-web> <carpeta-salida> <nombre>
     python3 -I empaquetar.py chispazo/web chispazo/entregas chispazo
     -> chispazo/entregas/chispazo-hostinger.zip
"""
import os
import sys
import zipfile

if len(sys.argv) != 4:
    sys.exit(__doc__)

web, out, name = sys.argv[1:]
if not os.path.isfile(os.path.join(web, "index.html")):
    sys.exit(f"No encontré {web}/index.html")

os.makedirs(out, exist_ok=True)
dest = os.path.join(out, f"{name}-hostinger.zip")
count = 0
with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(web):
        for f in sorted(files):
            if f.startswith(".") or f.endswith(".zip"):
                continue
            p = os.path.join(root, f)
            z.write(p, os.path.relpath(p, web))
            count += 1

print(f"{dest}: {count} archivos, {os.path.getsize(dest) // 1024} KB")
