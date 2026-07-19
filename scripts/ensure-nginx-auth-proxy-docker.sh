#!/usr/bin/env bash
# Applies /api-auth nginx proxy via Docker (no host sudo; needs docker group).
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/premiundev}"
AUTH_HOST="${AUTH_HOST:-test-app.febtw.co}"
CONF_DIR="/etc/nginx/conf.d"

echo "→ Finding nginx conf for ${DEPLOY_PATH}"
CONF_FILE="$(
  docker run --rm -v "${CONF_DIR}:${CONF_DIR}:ro" alpine:3.20 sh -c "
    grep -Rsl --include='*.conf' -E 'root[[:space:]]+${DEPLOY_PATH}|server_name[[:space:]].*premiundev' '${CONF_DIR}' 2>/dev/null | head -1
  "
)"
if [[ -z "${CONF_FILE}" ]]; then
  CONF_FILE="$(
    docker run --rm -v "${CONF_DIR}:${CONF_DIR}:ro" alpine:3.20 sh -c \
      "ls -1 ${CONF_DIR}/*premiun*.conf 2>/dev/null | head -1"
  )"
fi
if [[ -z "${CONF_FILE}" ]]; then
  echo "No premiundev nginx conf found" >&2
  docker run --rm -v "${CONF_DIR}:${CONF_DIR}:ro" alpine:3.20 ls -la "${CONF_DIR}"
  exit 1
fi
echo "→ Conf: ${CONF_FILE}"

echo "→ Patching location /api-auth/"
docker run --rm -i -v "${CONF_DIR}:${CONF_DIR}" alpine:3.20 sh -c "apk add --no-cache python3 >/dev/null && python3 -" <<PY
from pathlib import Path
import re

conf = Path("${CONF_FILE}")
text = conf.read_text()
marker = "location /api-auth/"
block = """
    location /api-auth/ {
        proxy_pass https://${AUTH_HOST}/;
        proxy_http_version 1.1;
        proxy_ssl_server_name on;
        proxy_set_header Host ${AUTH_HOST};
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 15s;
        proxy_read_timeout 30s;
    }
"""
# Always refresh the block so AUTH_HOST changes apply on redeploy.
pattern = re.compile(r"\n[ \t]*location /api-auth/\s*\{.*?\}", re.S)
text, n = pattern.subn("", text)
if n:
    print(f"Removed {n} old /api-auth/ block(s)")
m = re.search(r"\n([ \t]*)location\s+/\s*\{", text)
if not m:
    raise SystemExit("No location / block found")
indent = m.group(1)
lines = [indent + line.lstrip() if line.strip() else "" for line in block.strip("\n").splitlines()]
insert = "\n" + "\n".join(lines) + "\n"
text = text[: m.start()] + insert + text[m.start() :]
conf.write_text(text)
print("Inserted /api-auth/ proxy → ${AUTH_HOST}")
PY

NGINX_PID=""
for pidfile in /run/nginx.pid /var/run/nginx.pid; do
  NGINX_PID="$(docker run --rm -v "${pidfile}:${pidfile}:ro" alpine:3.20 cat "${pidfile}" 2>/dev/null | tr -d '[:space:]' || true)"
  if [[ -n "${NGINX_PID}" ]]; then
    break
  fi
done
if [[ -z "${NGINX_PID}" ]]; then
  echo "Could not read nginx pid file" >&2
  exit 1
fi

echo "→ reload nginx (HUP ${NGINX_PID})"
docker run --rm --privileged --pid host alpine:3.20 kill -HUP "${NGINX_PID}"
echo "✓ /api-auth proxy ready"
