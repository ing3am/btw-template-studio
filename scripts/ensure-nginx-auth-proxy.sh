#!/usr/bin/env bash
# Ensures nginx proxies /api-auth/ → test-apiconnect.febtw.co
# Run on the production host (as a user that can write nginx config + reload).

set -euo pipefail

AUTH_UPSTREAM="${AUTH_UPSTREAM:-https://test-apiconnect.febtw.co}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/premiundev}"
SNIPPET_PATH="${SNIPPET_PATH:-/etc/nginx/snippets/btw-api-auth.conf}"

run_root() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    echo "Need root or sudo to configure nginx" >&2
    exit 1
  fi
}

run_root mkdir -p "$(dirname "$SNIPPET_PATH")"
run_root tee "$SNIPPET_PATH" >/dev/null <<EOF
# Managed by btw-template-studio deploy — do not edit by hand
location /api-auth/ {
    proxy_pass ${AUTH_UPSTREAM}/;
    proxy_http_version 1.1;
    proxy_ssl_server_name on;
    proxy_set_header Host test-apiconnect.febtw.co;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_connect_timeout 15s;
    proxy_read_timeout 30s;
}
EOF

mapfile -t CONFS < <(
  {
    grep -Rsl --include='*.conf' -E "root[[:space:]]+${DEPLOY_PATH}|server_name[[:space:]].*premiundev" \
      /etc/nginx/sites-enabled /etc/nginx/sites-available /etc/nginx/conf.d 2>/dev/null || true
    find /etc/nginx/sites-enabled -mindepth 1 2>/dev/null || true
  } | awk 'NF && !seen[$0]++'
)

if [[ ${#CONFS[@]} -eq 0 ]]; then
  echo "No nginx site config found for ${DEPLOY_PATH}" >&2
  exit 1
fi

INCLUDE_LINE="include ${SNIPPET_PATH};"
changed=0

for conf in "${CONFS[@]}"; do
  real="$(readlink -f "$conf" 2>/dev/null || printf '%s' "$conf")"
  [[ -f "$real" ]] || continue
  if grep -Fq "$SNIPPET_PATH" "$real"; then
    echo "Proxy already included in $real"
    continue
  fi

  tmp="$(mktemp)"
  python3 - "$real" "$INCLUDE_LINE" "$tmp" <<'PY'
import sys
from pathlib import Path

src, include_line, dst = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
text = src.read_text()
needle = "\n    " + include_line + "\n"
# Prefer inserting before the SPA catch-all location /
import re
m = re.search(r"\n([ \t]*)location\s+/\s*\{", text)
if m:
    indent = m.group(1)
    insert = f"\n{indent}{include_line}\n"
    text = text[: m.start()] + insert + text[m.start() :]
else:
    # Fallback: before the last closing brace in the file
    idx = text.rfind("}")
    if idx < 0:
        raise SystemExit(f"Cannot find insertion point in {src}")
    text = text[:idx] + f"    {include_line}\n" + text[idx:]
dst.write_text(text)
PY

  run_root cp "$tmp" "$real"
  rm -f "$tmp"
  echo "Added auth proxy include to $real"
  changed=1
done

run_root nginx -t
run_root systemctl reload nginx
echo "nginx auth proxy ready (changed=${changed})"
