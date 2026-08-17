#!/usr/bin/env bash
# build-deploy.sh — gera a pasta pronta para subir no alwaysdata
#
# O que ele faz, na ordem:
#   1. Compila o front-end (Vite) → frontend/dist
#   2. Copia o front compilado para backend/public
#   3. Monta a pasta deploy/ com TUDO que o servidor precisa
#      (server.js, auth.js, db.js, routes/, public/, node_modules de produção)
#   4. Gera o arquivo gestor-ml-deploy.tar.gz para upload
#
# Por que instalar o node_modules aqui e não no servidor:
#   o plano free do alwaysdata tem 256MB de RAM — `npm install` e `vite build`
#   estouram a memória e são mortos. O servidor só executa `node server.js`.
#
# Uso:
#   ./build-deploy.sh              # build completo + pacote .tar.gz
#   ./build-deploy.sh --sem-pacote # só a pasta deploy/, sem gerar o .tar.gz
set -euo pipefail
cd "$(dirname "$0")"

RAIZ="$(pwd)"
DESTINO="$RAIZ/deploy"
PACOTE="$RAIZ/gestor-ml-deploy.tar.gz"
GERAR_PACOTE=1
[ "${1:-}" = "--sem-pacote" ] && GERAR_PACOTE=0

echo "==> 1/4 Compilando o front-end (React + Vite)..."
cd "$RAIZ/frontend"
if [ -d node_modules ]; then npm install --no-audit --no-fund; else npm ci --no-audit --no-fund; fi
npm run build

echo "==> 2/4 Copiando frontend/dist para backend/public..."
cd "$RAIZ"
rm -rf backend/public
cp -r frontend/dist backend/public

echo "==> 3/4 Montando a pasta deploy/..."
rm -rf "$DESTINO"
mkdir -p "$DESTINO"
cp backend/server.js backend/db.js backend/auth.js "$DESTINO/"
cp backend/package.json backend/package-lock.json "$DESTINO/"
cp backend/schema.sql backend/seed.sql "$DESTINO/"
cp backend/.env.exemplo "$DESTINO/"
cp -r backend/routes "$DESTINO/routes"
cp -r backend/public "$DESTINO/public"

echo "    Instalando dependências de produção dentro de deploy/..."
cd "$DESTINO"
npm ci --omit=dev --no-audit --no-fund

if [ "$GERAR_PACOTE" = "1" ]; then
  echo "==> 4/4 Gerando o pacote gestor-ml-deploy.tar.gz..."
  cd "$RAIZ"
  rm -f "$PACOTE"
  tar -czf "$PACOTE" -C "$RAIZ" deploy
else
  echo "==> 4/4 Pacote não gerado (--sem-pacote)."
fi

echo
echo "PRONTO."
echo "  Pasta pronta para o servidor: $DESTINO"
[ "$GERAR_PACOTE" = "1" ] && echo "  Pacote para upload:          $PACOTE"
echo
echo "Teste local antes de subir:"
echo "  (cd deploy && node server.js)   →  http://localhost:3001"
echo
echo "Para enviar ao alwaysdata:  ./enviar-alwaysdata.sh"
echo "ATENÇÃO: o .env NÃO vai no pacote. Crie-o no servidor (use .env.exemplo)."
