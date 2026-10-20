"""Arma el informe final de /plm-ecc (HTML) a partir de un .json.

El diseño copia el de la propuesta "Flamingo - Black Fiao" de PLM:
- Lámina oscura (#0d0d0d) de portada y de cierre, con MED, COL / SINCE 2010 /
  PLM.COM.CO en las esquinas y el título en rojo.
- Láminas grises (#e2e2e2) con etiqueta espaciada en negro, titular rojo
  (#e54529) y tarjetas redondeadas blancas, con la última en negro.
- Separadores rojos a pantalla completa con el titular en negro.
- Cifras grandes en rojo con una franja roja de conclusión y la fuente abajo.
- Letra Calibri (Carlito como reemplazo con las mismas medidas).

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

ESQUINAS = """
  <p class="esq si">MED, COL</p><p class="esq sd">SINCE 2010</p>
  <p class="esq ii">PLM.COM.CO<br>PLM EVERY_</p>"""
MARCA = '<p class="marca"><span>&#10033;</span><i></i>PLM.COM.CO</p>'


def gris(kicker, titular, cuerpo):
    return f"""
<section class="lamina gris">
  <div class="caja">
    <p class="kicker">{e(kicker)}</p>
    <h2>{e(titular)}</h2>
    {cuerpo}
  </div>
  {MARCA}
</section>"""


def separador(kicker, titular):
    return f"""
<section class="lamina roja">
  <div class="caja"><p class="kicker">{e(kicker)}</p><h2>{e(titular)}</h2></div>
</section>"""


def tarjetas(items):
    # items: (etiqueta, titulo, texto); la última tarjeta va en negro, como en la presentación.
    html_items = "".join(
        f'<article class="tarjeta{" negra" if i == len(items) - 1 else ""}">'
        f'<p class="kicker">{e(k)}</p>'
        + (f"<h3>{e(t)}</h3>" if t else "")
        + f"<p>{e(x)}</p></article>"
        for i, (k, t, x) in enumerate(items)
    )
    return f'<div class="tarjetas">{html_items}</div>'


hechos = [p for p in pasos if p.get("estado", "hecho") == "hecho"]
corregidos = [h for h in hallazgos if h.get("estado") == "corregido"]
cifras = [
    (len(hechos), "Pasos completados", f"de {len(pasos)} del plan"),
    (len({m["agente"] for m in equipo}), "Agentes y skills de ECC", "trabajaron en la tarea"),
    (len(corregidos), "Hallazgos corregidos", f"de {len(hallazgos)} en la revisión"),
    (len(pendientes), "Pendientes", "quedan para después"),
]

partes = []

partes.append(f"""
<section class="lamina negra portada">
  {ESQUINAS}
  <div class="caja">
    <p class="cliente">{e(d.get("cliente") or "Informe de trabajo")}</p>
    <h1>{e(tarea)}</h1>
    <p class="bajada">{e(d.get("subtitulo"))}</p>
    <p class="firma">Informe PLM Marketing Group {e(anio)}</p>
  </div>
</section>""")

partes.append(gris(
    "¿Cómo leímos el reto?",
    reto.get("titular") or tarea,
    tarjetas([
        ("Lo que nos pidieron", None, reto.get("pedido")),
        ("Lo que leímos", None, reto.get("lectura")),
        ("Nuestra misión", None, reto.get("mision")),
    ]),
))

partes.append(separador("Equipo ECC", "Así trabajó el equipo"))

cifras_html = "".join(
    f'<div class="cifra"><strong>{n}</strong><span>{e(t)}<br><small>{e(s)}</small></span></div>' for n, t, s in cifras
)
franja = f'<p class="franja">{e(d["conclusion"])}</p>' if d.get("conclusion") else ""
partes.append(gris("En cifras", "¿Qué hizo el equipo?", f'<div class="cifras">{cifras_html}</div>{franja}'))

partes.append(gris(
    "El equipo",
    "Quién trabajó",
    tarjetas([(m.get("tipo", "agente"), m["agente"], m.get("rol")) for m in equipo]),
))

filas = "".join(
    f'<li class="{"pendiente" if p.get("estado") == "pendiente" else "hecho"}"><span class="num">{i:02d}</span>'
    f'<div><h3>{e(p["titulo"])}</h3><p><b>{e(p.get("agente"))}</b> &middot; {e(p.get("para_que"))}</p></div></li>'
    for i, p in enumerate(pasos, 1)
)
partes.append(gris("Paso a paso", "El recorrido", f'<ol class="recorrido">{filas}</ol>'))

if hallazgos:
    filas = "".join(
        f'<li><span class="estado {"corregido" if h.get("estado") == "corregido" else ""}">{e(h.get("estado"))}</span>'
        f'<p><b>{e(h.get("agente"))}</b> &middot; {e(h.get("hallazgo"))}</p></li>'
        for h in hallazgos
    )
    partes.append(gris("Revisión", "Antes de entregarlo", f'<ul class="hallazgos">{filas}</ul>'))

if d.get("antes") and d.get("ahora"):
    partes.append(gris(
        "El cambio de mirada",
        d.get("cambio_titular") or d["ahora"],
        f"""<div class="antes-ahora">
      <div class="tarjeta"><p><b>ANTES:</b><br>{e(d["antes"])}</p></div>
      <div class="tarjeta negra"><p><b>AHORA:</b><br>{e(d["ahora"])}</p></div>
    </div>""",
    ))

lista = "".join(f"<li>{e(p)}</li>" for p in pendientes) or "<li>Nada pendiente.</li>"
fuentes = d.get("fuentes") or ["Documentación oficial de ECC: github.com/affaan-m/ECC"]
partes.append(f"""
<section class="lamina negra cierre">
  {ESQUINAS}
  <div class="caja">
    <p class="cliente">Lo que sigue</p>
    <h2>Qué queda pendiente</h2>
    <ul class="pendientes">{lista}</ul>
    <p class="fuentes">Fuentes: {" &middot; ".join(e(f) for f in fuentes)} &middot; {e(fecha)}</p>
  </div>
</section>""")

css = """
:root{--gris:#e2e2e2;--negro:#0d0d0d;--rojo:#e54529;--blanco:#fff;--texto:#111;--suave:#6b6b6b;--claro:#b5b5b5}
*{box-sizing:border-box;margin:0}
html,body{overflow-x:clip}
body{background:var(--gris);color:var(--texto);font:400 17px/1.45 Calibri,Carlito,"Segoe UI",system-ui,sans-serif}
.lamina{position:relative;min-height:100vh;display:flex;align-items:center;padding:88px 16px}
.caja{width:100%;max-width:1040px;margin:0 auto}
.gris{background:var(--gris)}
.negra{background:var(--negro);color:var(--blanco)}
.roja{background:var(--rojo);color:#000}
.kicker{text-transform:uppercase;letter-spacing:.32em;font-size:.82rem;color:#000}
h1{color:var(--rojo);font-size:clamp(2.6rem,7.5vw,5.2rem);line-height:1;font-weight:700;margin:6px 0 18px}
h2{color:var(--rojo);font-size:clamp(1.8rem,4.2vw,2.75rem);line-height:1.08;font-weight:700;margin:10px 0 40px}
.roja h2{color:#000;font-size:clamp(2.4rem,6vw,4rem);margin:8px 0 0}
.roja .kicker{font-size:.75rem}
h3{font-size:1.25rem;line-height:1.2;font-weight:700;margin-bottom:12px}
.esq{position:absolute;font-size:.7rem;text-transform:uppercase;color:var(--rojo);letter-spacing:.02em;line-height:1.2}
.si{top:20px;left:20px}.sd{top:20px;right:20px}.ii{bottom:20px;left:20px}
.cliente{text-transform:uppercase;font-size:1.3rem;letter-spacing:.03em}
.bajada{color:var(--claro);font-size:1.4rem;letter-spacing:.06em;max-width:34ch}
.firma{margin-top:72px;text-transform:uppercase;letter-spacing:.18em;font-size:.9rem}
.marca{position:absolute;right:20px;bottom:20px;display:flex;align-items:center;gap:6px;font:400 .72rem/1 ui-monospace,"SFMono-Regular",Menlo,monospace;letter-spacing:.06em}
.marca i{display:block;width:56px;height:1px;background:#000}
.tarjetas{display:grid;gap:24px 40px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.tarjeta{background:var(--blanco);border-radius:16px;padding:28px 22px}
.tarjeta .kicker{text-align:center;font-weight:700;font-size:.72rem;margin-bottom:18px}
.tarjeta.negra{background:#000;color:var(--blanco)}
.tarjeta.negra .kicker{color:var(--rojo)}
.tarjeta.negra p:not(.kicker){color:var(--claro)}
.cifras{display:grid;gap:28px;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));text-align:center}
.cifra strong{display:block;color:var(--rojo);font-size:clamp(3.2rem,8vw,4.6rem);line-height:1;font-weight:700}
.cifra span{display:block;margin-top:8px;color:var(--suave);font-weight:700}
.cifra small{font-weight:400;font-size:.9rem}
.franja{background:var(--rojo);color:var(--blanco);text-align:center;font-size:1.15rem;padding:6px 16px;margin:56px auto 0;max-width:820px}
.recorrido,.hallazgos{list-style:none;padding:0;display:grid;gap:12px}
.recorrido li{display:flex;gap:20px;align-items:flex-start;background:var(--blanco);border-radius:16px;padding:18px 22px}
.recorrido .num{color:var(--rojo);font-weight:700;font-size:1.7rem;line-height:1;min-width:2ch}
.recorrido h3{margin-bottom:4px}
.recorrido li.pendiente{background:#000;color:var(--blanco)}
.recorrido li.pendiente p{color:var(--claro)}
.hallazgos li{display:flex;gap:16px;align-items:baseline;background:var(--blanco);border-radius:16px;padding:16px 22px}
.estado{text-transform:uppercase;letter-spacing:.2em;font-size:.68rem;font-weight:700;white-space:nowrap;color:var(--suave)}
.estado.corregido{color:var(--rojo)}
.antes-ahora{display:grid;gap:24px 64px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));max-width:600px;margin:0 auto}
.antes-ahora p{font-size:1.4rem;line-height:1.3}
.antes-ahora .tarjeta.negra p{color:var(--blanco)}
.cierre h2{text-transform:uppercase}
.pendientes{list-style:none;padding:0;display:grid;gap:10px;max-width:760px}
.pendientes li{color:var(--claro);font-size:1.25rem;letter-spacing:.03em;padding-left:28px;position:relative}
.pendientes li::before{content:"\\2731";position:absolute;left:0;color:var(--rojo)}
.fuentes{margin-top:56px;color:var(--suave);font-size:.75rem}
@media (max-width:600px){.lamina{min-height:auto;padding:72px 16px}.firma{margin-top:40px}.portada{min-height:100vh}}
@page{size:A4 landscape;margin:0}
@media print{.lamina{min-height:100vh;break-after:page;break-inside:avoid}}
"""

pagina = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(tarea)} · Informe PLM</title>
<meta name="description" content="{e(d.get("subtitulo") or tarea)}">
<meta name="theme-color" content="#0d0d0d">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Carlito:wght@400;700&display=swap" rel="stylesheet">
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
