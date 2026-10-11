#!/usr/bin/env python3
"""Revisa el framework de Pivot después de editarlo.

Uso (desde la raíz del repositorio):  python3 -I pivot/framework/validar.py

- ERROR si un enlace entre documentos apunta a un archivo que no existe.
- ERROR si aparece algo que parece una contraseña o una clave.
- AVISO si aparece un correo o un celular (¿es un dato personal?).
- AVISO si un tiempo o una frecuencia no está marcado como "(sugerencia".
"""
import re
import sys
from pathlib import Path
from urllib.parse import unquote

RAIZ = Path(__file__).resolve().parent

# [texto](destino), [texto](<destino con espacios>) y [texto](destino "título")
ENLACE = re.compile(r"\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+[\"'(][^)]*)?\s*\)")
SECRETOS = [
    re.compile(r"\b(contraseña|password|pass|pwd|clave|token)(\s+de\s+\w+)?\s*(:|=|\bes\b)\s*\S", re.I),
    re.compile(r"\bEAA[A-Za-z0-9]{20,}"),              # tokens de Meta
    re.compile(r"\bsk-[A-Za-z0-9_-]{20,}"),             # claves de API
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}"),        # tokens de GitHub
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"\bAIza[0-9A-Za-z_-]{35}"),             # claves de Google
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),                # claves de AWS
    re.compile(r"\bxox[abpr]-[A-Za-z0-9-]{10,}"),       # tokens de Slack
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
]
PERSONALES = [
    re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"),             # correos
    re.compile(r"(\+?57\s?)?\b3\d{2}\s?\d{3}\s?\d{4}\b"),  # celulares de Colombia
]
TIEMPO = re.compile(
    r"\b\d+\s*(segundos?|minutos?|horas?|días?|semanas?|mes(es)?|trimestres?|veces)\b", re.I)
# Hechos fijos (de Pivot o de las plataformas) que no son sugerencias.
HECHOS = ("15 días", "dura 24 horas")
# Distancia máxima (en letras) entre el número y su marca "(sugerencia".
CERCA = 60


def tiempo_sin_marcar(linea):
    for m in TIEMPO.finditer(linea):
        if any(h in linea[max(0, m.start() - 15):m.end() + 15] and m.group(0) in h
               for h in HECHOS):
            continue
        if "(sugerencia" not in linea[m.end():m.end() + CERCA].lower():
            return True
    return False


def revisar(archivo):
    errores, avisos = [], []
    nombre = archivo.relative_to(RAIZ)
    en_bloque = False
    for n, linea in enumerate(archivo.read_text(encoding="utf-8").splitlines(), 1):
        if linea.lstrip().startswith("```"):
            en_bloque = not en_bloque
        for patron in SECRETOS:
            if patron.search(linea):
                errores.append(f"{nombre}:{n}: posible contraseña o clave")
        for patron in PERSONALES:
            if patron.search(linea):
                avisos.append(f"{nombre}:{n}: posible dato personal (correo o celular)")
        if en_bloque:
            continue
        for destino in ENLACE.findall(linea):
            destino = unquote(destino.strip("<>"))
            if destino.startswith(("http://", "https://", "mailto:", "#")):
                continue
            ruta = destino.split("#")[0]
            if ruta and not (archivo.parent / ruta).exists():
                errores.append(f"{nombre}:{n}: enlace roto -> {destino}")
        if tiempo_sin_marcar(linea):
            avisos.append(f"{nombre}:{n}: tiempo o frecuencia sin marcar como sugerencia")
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
