#!/usr/bin/env bash
# Deploy local: npm run deploy
# Requiere: sshpass (brew install hudochenkov/sshpass/sshpass)
# y variables en .env.deploy (no se sube a git)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.deploy ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env.deploy
  set +a
fi

: "${DEPLOY_HOST:?Falta DEPLOY_HOST}"
: "${DEPLOY_USER:?Falta DEPLOY_USER}"
: "${DEPLOY_PASSWORD:?Falta DEPLOY_PASSWORD}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/premiundev}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"

if ! command -v sshpass >/dev/null 2>&1; then
  echo "Instala sshpass: brew install hudochenkov/sshpass/sshpass"
  exit 1
fi

echo "→ Build…"
npm run build

export SSHPASS="$DEPLOY_PASSWORD"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -p "$DEPLOY_PORT")

echo "→ Limpiar remoto…"
sshpass -e ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "mkdir -p '$DEPLOY_PATH' && find '$DEPLOY_PATH' -mindepth 1 -maxdepth 1 -exec rm -rf {} +"

echo "→ Subir dist/ → ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
sshpass -e rsync -avz --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  dist/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "✓ Publicado en https://${DEPLOY_HOST}"
