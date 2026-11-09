#!/usr/bin/env bash
# Arma el .zip de Bong v2 para subir a Hostinger (bong.pivotagencia.com) con la configuración de producción.
# Uso: bash scripts/empaquetar-hostinger.sh   →   entregas/bong-v2-hostinger.zip
set -euo pipefail
cd "$(dirname "$0")/.."
salida="entregas/bong-v2-hostinger.zip"
tmp="$(mktemp -d)"
cp -R web/. "$tmp/"
cp despliegue/config.js "$tmp/config.js"
cp despliegue/gestor-config.js "$tmp/gestor/config.js"
mkdir -p entregas
rm -f "$salida"
(cd "$tmp" && zip -qr - .) > "$salida"
rm -rf "$tmp"
echo "Listo: $salida ($(du -h "$salida" | cut -f1))"
