"""Arma el informe final de /plm-ecc (HTML) a partir de un .json.

El diseño sigue la estructura de la propuesta "Flamingo - Black Fiao" de PLM:
portada con etiqueta espaciada, "¿Cómo leímos el reto?" en tres columnas,
cifras grandes con su fuente, el cambio de mirada (antes / ahora) y cierre.

Todo el texto del .json se escapa antes de entrar al HTML: el informe nunca
ejecuta nada de lo que venga en los datos.

Uso: python3 -I informe.py <datos.json> <salida.html>
     python3 -I informe.py scratchpad/plm-ecc/informe.json entregas/informe.html
"""
import datetime
import html
import json
import os
import sys

if len(sys.argv) != 3:
    sys.exit(__doc__)

src, dest = sys.argv[1:]
with open(src, encoding="utf-8") as f:
    d = json.load(f)


def e(value):
    return html.escape(str(value or ""), quote=True)


def need(key):
    if not d.get(key):
        sys.exit(f"Falta '{key}' en {src}")
    return d[key]


tarea = need("tarea")
reto = need("reto")
pasos = need("pasos")
equipo = need("equipo")
hallazgos = d.get("hallazgos", [])
pendientes = d.get("pendientes", [])
fecha = d.get("fecha") or datetime.date.today().isoformat()
anio = fecha[:4]


def espaciado(texto):
    # Etiqueta en mayúsculas con letras separadas (letter-spacing en .kicker).
    return f'<p class="kicker">{e(texto)}</p>'


cifras = [
    (len([p for p in pasos if p.get("estado", "hecho") == "hecho"]), "Pasos completados", f"de {len(pasos)} del plan"),
    (len({m["agente"] for m in equipo}), "Agentes y skills de ECC", "trabajaron en la tarea"),
    (len([h for h in hallazgos if h.get("estado") == "corregido"]), "Hallazgos corregidos", f"de {len(hallazgos)} encontrados en la revisión"),
    (len(pendientes), "Pendientes", "quedan para después"),
]

partes = []

partes.append(f"""
<header class="portada">
  {espaciado(d.get("cliente") or "Informe de trabajo")}
  <h1>{e(tarea)}</h1>
  <p class="bajada">{e(d.get("subtitulo"))}</p>
  <p class="firma">Equipo ECC &middot; PLM Marketing Group {e(anio)}</p>
</header>""")

columnas = [("Lo que nos pidieron", reto.get("pedido")), ("Lo que leímos", reto.get("lectura")), ("Nuestra misión", reto.get("mision"))]
partes.append(f"""
<section>
  {espaciado("El reto")}
  <h2>¿Cómo leímos el reto?</h2>
  <div class="tres">
    {"".join(f'<article class="col"><h3>{e(t)}</h3><p>{e(v)}</p></article>' for t, v in columnas)}
  </div>
</section>""")

partes.append(f"""
<section>
  {espaciado("En cifras")}
  <h2>Lo que hizo el equipo</h2>
  <div class="cifras">
    {"".join(f'<div class="cifra"><strong>{n}</strong><span>{e(t)}</span><small>{e(s)}</small></div>' for n, t, s in cifras)}
  </div>
</section>""")

partes.append(f"""
<section>
  {espaciado("El equipo")}
  <h2>Quién trabajó</h2>
  <div class="equipo">
    {"".join(f'<article class="miembro"><p class="tipo">{e(m.get("tipo", "agente"))}</p><h3>{e(m["agente"])}</h3><p>{e(m.get("rol"))}</p></article>' for m in equipo)}
  </div>
</section>""")

filas = "".join(
    f'<li class="{e(p.get("estado", "hecho"))}"><span class="num">{i:02d}</span>'
    f'<div><h3>{e(p["titulo"])}</h3><p><b>{e(p.get("agente"))}</b> &middot; {e(p.get("para_que"))}</p></div></li>'
    for i, p in enumerate(pasos, 1)
)
partes.append(f"""
<section>
  {espaciado("Paso a paso")}
  <h2>El recorrido</h2>
  <ol class="recorrido">{filas}</ol>
</section>""")

if hallazgos:
    partes.append(f"""
<section>
  {espaciado("Revisión")}
  <h2>Antes de entregarlo</h2>
  <ul class="hallazgos">
    {"".join(f'<li><span class="estado {e(h.get("estado"))}">{e(h.get("estado"))}</span><p><b>{e(h.get("agente"))}</b> &middot; {e(h.get("hallazgo"))}</p></li>' for h in hallazgos)}
  </ul>
</section>""")

if d.get("antes") and d.get("ahora"):
    partes.append(f"""
<section class="cambio">
  {espaciado("El cambio de mirada")}
  <div class="dos">
    <div><p class="rotulo">Antes</p><p class="frase">{e(d["antes"])}</p></div>
    <div><p class="rotulo">Ahora</p><p class="frase acento">{e(d["ahora"])}</p></div>
  </div>
</section>""")

lista = "".join(f"<li>{e(p)}</li>" for p in pendientes) or "<li>Nada pendiente.</li>"
partes.append(f"""
<section>
  {espaciado("Lo que sigue")}
  <h2>Qué queda pendiente</h2>
  <ul class="pendientes">{lista}</ul>
</section>""")

fuentes = d.get("fuentes") or ["Documentación oficial de ECC: github.com/affaan-m/ECC"]
partes.append(f"""
<footer>
  <p>Fuentes: {" &middot; ".join(e(f) for f in fuentes)}</p>
  <p>{e(fecha)}</p>
</footer>""")

css = """
:root{--fondo:#0b0b0c;--texto:#f5f5f2;--suave:#a9a9a4;--linea:#2a2a2c;--acento:#f2c94c;--tarjeta:#151517}
*{box-sizing:border-box;margin:0}
html,body{overflow-x:clip}
body{background:var(--fondo);color:var(--texto);font:400 17px/1.55 Montserrat,system-ui,sans-serif}
main{max-width:1080px;margin:0 auto;padding:0 16px}
section,.portada{padding:72px 0;border-bottom:1px solid var(--linea)}
.portada{min-height:88vh;display:flex;flex-direction:column;justify-content:center;gap:20px}
.kicker,.rotulo,.tipo{text-transform:uppercase;letter-spacing:.32em;font-size:.78rem;font-weight:600;color:var(--acento)}
h1{font-size:clamp(2.4rem,7vw,5rem);line-height:1.02;font-weight:800;letter-spacing:-.01em}
h2{font-size:clamp(1.7rem,4vw,2.6rem);line-height:1.1;font-weight:800;margin:10px 0 36px}
h3{font-size:1rem;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px}
.bajada{font-size:1.25rem;color:var(--suave);max-width:46ch}
.firma{color:var(--suave);font-size:.85rem;letter-spacing:.2em;text-transform:uppercase}
.tres,.equipo{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.col,.miembro{background:var(--tarjeta);border-top:3px solid var(--acento);padding:24px}
.col p,.miembro p{color:var(--suave)}
.miembro .tipo{font-size:.68rem;margin-bottom:6px}
.cifras{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.cifra{display:flex;flex-direction:column;gap:4px;border-left:3px solid var(--acento);padding-left:18px}
.cifra strong{font-size:clamp(3rem,8vw,4.5rem);line-height:1;font-weight:800;color:var(--acento)}
.cifra span{font-weight:700}
.cifra small{color:var(--suave)}
.recorrido,.hallazgos,.pendientes{list-style:none;padding:0;display:grid;gap:12px}
.recorrido li{display:flex;gap:18px;align-items:flex-start;background:var(--tarjeta);padding:18px 20px}
.recorrido .num{font-weight:800;font-size:1.6rem;color:var(--acento);min-width:2ch}
.recorrido li p{color:var(--suave)}
.recorrido li.pendiente{opacity:.55}
.hallazgos li{display:flex;gap:14px;align-items:baseline;padding:12px 0;border-bottom:1px solid var(--linea)}
.estado{font-size:.7rem;text-transform:uppercase;letter-spacing:.15em;padding:4px 8px;border:1px solid var(--suave);white-space:nowrap}
.estado.corregido{border-color:var(--acento);color:var(--acento)}
.dos{display:grid;gap:24px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));margin-top:16px}
.frase{font-size:clamp(1.4rem,3.4vw,2.2rem);font-weight:800;line-height:1.15}
.acento{color:var(--acento)}
.pendientes li{padding:14px 18px;background:var(--tarjeta);border-left:3px solid var(--acento)}
footer{padding:32px 0 48px;color:var(--suave);font-size:.8rem;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px}
@media print{section,.portada{break-inside:avoid}.portada{min-height:auto}}
"""

pagina = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(tarea)} · Informe</title>
<meta name="description" content="{e(d.get("subtitulo") or tarea)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>{css}</style>
</head>
<body>
<main>{"".join(partes)}</main>
</body>
</html>
"""

os.makedirs(os.path.dirname(os.path.abspath(dest)), exist_ok=True)
with open(dest, "w", encoding="utf-8") as f:
    f.write(pagina)
print(f"{dest}: {len(pasos)} pasos, {len(equipo)} en el equipo, {len(pendientes)} pendientes")
