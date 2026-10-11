#!/usr/bin/env python3
"""Revisa el framework de Pivot después de editarlo.

Uso (desde la raíz del repositorio):  python3 -I pivot/framework/validar.py

- ERROR si un enlace entre documentos apunta a un archivo que no existe.
- ERROR si aparece algo que parece una contraseña o una clave.
- AVISO si un tiempo (horas, días, semanas) no está marcado como "(sugerencia".
"""
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent

ENLACE = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
SECRETOS = [
    re.compile(r"(contraseña|password|clave|token)\s*[:=]\s*\S", re.I),
    re.compile(r"\bEAA[A-Za-z0-9]{20,}"),       # tokens de Meta
    re.compile(r"\bsk-[A-Za-z0-9_-]{20,}"),      # claves de API
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}"), # tokens de GitHub
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),         # claves de AWS
]
TIEMPO = re.compile(r"\b\d+\s*(horas?|días?|semanas?)\b", re.I)
# Hechos fijos (de Pivot o de las plataformas) que no son sugerencias.
HECHOS = ("15 días", "dura 24 horas")


def revisar(archivo):
    errores, avisos = [], []
    nombre = archivo.relative_to(RAIZ)
    for n, linea in enumerate(archivo.read_text(encoding="utf-8").splitlines(), 1):
        for destino in ENLACE.findall(linea):
            if destino.startswith(("http://", "https://", "mailto:", "#")):
                continue
            ruta = destino.split("#")[0]
            if ruta and not (archivo.parent / ruta).exists():
                errores.append(f"{nombre}:{n}: enlace roto -> {destino}")
        for patron in SECRETOS:
            if patron.search(linea):
                errores.append(f"{nombre}:{n}: posible contraseña o clave")
        if TIEMPO.search(linea) and "sugerencia" not in linea.lower() \
                and not any(h in linea for h in HECHOS):
            avisos.append(f"{nombre}:{n}: tiempo sin marcar como sugerencia")
    return errores, avisos


def main():
    errores, avisos = [], []
    for archivo in sorted(RAIZ.rglob("*.md")):
        e, a = revisar(archivo)
        errores += e
        avisos += a
    for a in avisos:
        print("AVISO ", a)
    for e in errores:
        print("ERROR ", e)
    print(f"\n{len(errores)} errores, {len(avisos)} avisos.")
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(main())
