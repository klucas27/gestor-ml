#!/usr/bin/env bash
# build-deploy.sh — prepara o back-end para o deploy no alwaysdata
#
# O que ele faz:
#   1. Compila o front-end (Vite) na pasta frontend/
#   2. Copia o resultado (frontend/dist) para backend/public
#
# Depois disso a pasta backend/ é autossuficiente: o Express serve o front
# estático de backend/public e a API em /api, tudo na mesma porta.
#
# Uso:  ./build-deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Compilando o front-end..."
(cd frontend && npm ci && npm run build)

echo "==> Copiando frontend/dist para backend/public..."
rm -rf backend/public
cp -r frontend/dist backend/public

echo "==> Pronto! A pasta backend/ está completa para o deploy."
echo "    Teste local: node backend/server.js  →  http://localhost:3001"
