#!/usr/bin/env bash
# enviar-alwaysdata.sh — envia a pasta deploy/ para o servidor alwaysdata
#
# Roda o build (build-deploy.sh) e copia tudo por SSH/rsync para
# ~/www/gestor-ml no servidor, sem apagar o .env que está lá.
#
# Antes do primeiro uso, crie o arquivo alwaysdata.conf nesta pasta:
#
#   CONTA=minhaconta                      # nome da conta alwaysdata
#   SSH_HOST=ssh-minhaconta.alwaysdata.net
#   SSH_USER=minhaconta                   # ou minhaconta_deploy
#   PASTA_REMOTA=www/gestor-ml
#   API_KEY=                              # opcional: reinicia o site sozinho
#   SITE_ID=                              # opcional: id numérico do site
#
# (alwaysdata.conf está no .gitignore — não vai para o GitHub.)
#
# Uso:
#   ./enviar-alwaysdata.sh              # build + envio
#   ./enviar-alwaysdata.sh --so-enviar  # envia a pasta deploy/ já existente
set -euo pipefail
cd "$(dirname "$0")"

CONF="./alwaysdata.conf"
if [ ! -f "$CONF" ]; then
  echo "ERRO: arquivo alwaysdata.conf não encontrado."
  echo "Crie-o seguindo o exemplo no topo deste script."
  exit 1
fi
# shellcheck disable=SC1090
source "$CONF"

: "${SSH_HOST:?defina SSH_HOST em alwaysdata.conf}"
: "${SSH_USER:?defina SSH_USER em alwaysdata.conf}"
PASTA_REMOTA="${PASTA_REMOTA:-www/gestor-ml}"

if [ "${1:-}" != "--so-enviar" ]; then
  ./build-deploy.sh --sem-pacote
fi

if [ ! -d deploy ]; then
  echo "ERRO: pasta deploy/ não existe. Rode ./build-deploy.sh primeiro."
  exit 1
fi

echo "==> Enviando arquivos para $SSH_USER@$SSH_HOST:$PASTA_REMOTA ..."
# --delete limpa arquivos antigos do servidor; --exclude protege o .env de lá
rsync -az --delete --exclude='.env' --exclude='alwaysdata.conf' \
  deploy/ "$SSH_USER@$SSH_HOST:$PASTA_REMOTA/"

if [ -n "${API_KEY:-}" ] && [ -n "${SITE_ID:-}" ] && [ -n "${CONTA:-}" ]; then
  echo "==> Reiniciando o site pelo painel (API do alwaysdata)..."
  curl --silent --fail --show-error -X POST \
    --basic --user "$API_KEY account=$CONTA:" \
    "https://api.alwaysdata.com/v1/site/$SITE_ID/restart/"
  echo "    Site reiniciado."
else
  echo "==> Reinicie o site manualmente no painel (Web → Sites → Restart)."
fi

echo
echo "PRONTO. Abra: https://${CONTA:-minhaconta}.alwaysdata.net"
echo "Se for o primeiro envio, confira no servidor:"
echo "  - o arquivo .env existe em $PASTA_REMOTA (DATABASE_URL, USUARIO_ACESSO, SENHA_ACESSO, SEGREDO_TOKEN)"
echo "  - o schema.sql já foi carregado no banco PostgreSQL"
