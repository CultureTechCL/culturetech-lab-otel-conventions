#!/usr/bin/env bash
# =============================================================================
# Genera las constantes de los 4 lenguajes desde el registro `model/` a las
# ubicaciones canónicas de cada paquete. Idempotente: sobreescribe la salida.
#
# Uso:  ./scripts/generate.sh
# Requiere: `weaver` (OpenTelemetry Weaver) >= 0.24.2 en el PATH.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ Generando constantes desde model/ ..."

# Go   -> módulo raíz, paquete ctattributes
weaver registry generate --registry model/ --templates templates/ go \
  otel/ctattributes

# TypeScript -> paquete npm (src/)
weaver registry generate --registry model/ --templates templates/ typescript \
  packages/typescript/src

# Java -> layout Maven
weaver registry generate --registry model/ --templates templates/ java \
  packages/java/src/main/java/cl/culturetech/otel

# Python -> paquete culturetech_otel
weaver registry generate --registry model/ --templates templates/ python \
  packages/python/src/culturetech_otel

echo "✔ Generación completa:"
echo "  - otel/ctattributes/attributes.go"
echo "  - packages/typescript/src/attributes.ts"
echo "  - packages/java/src/main/java/cl/culturetech/otel/CtAttributes.java"
echo "  - packages/python/src/culturetech_otel/attributes.py"
