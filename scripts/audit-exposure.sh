#!/usr/bin/env bash
set -euo pipefail
out="${1:-/home/ubuntu/sistemas-auth-migration/audit-exposure-$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$out"
base='https://sistemas.administradoramutual.com.br'
for path in /login.html /index.html /auth.js /login.js /portal.js /api/auth/me /api/auth/login /api/auth/logout /auth.js.map /login.js.map /portal.js.map; do
  safe="${path#/}"
  safe="${safe//\//_}"
  curl -ksS --max-time 20 -D "$out/${safe}.headers" "$base$path" -o "$out/${safe}.body" || true
done
{
  printf '%s\n' '--- resource URLs ---'
  grep -RhoE 'https?://[^"[:space:]]+|/[^"[:space:]]+\.(js|map|json|css)' "$out"/*.body 2>/dev/null | sort -u || true
  printf '%s\n' '--- sensitive key names (values omitted) ---'
  grep -RhoiE 'AUTH_ADMIN_EMAIL|AUTH_ADMIN_PASSWORD|AUTH_PASSWORD|PASSWORD_HASH|SESSION_SECRET|localStorage|sessionStorage|setItem|password[[:space:]]*[:=]|hash[[:space:]]*[:=]|token[[:space:]]*[:=]' "$out"/*.body 2>/dev/null | sed -E 's/[[:space:]]+/ /g' | cut -c1-240 | sort -u || true
  printf '%s\n' '--- public response status ---'
  for f in "$out"/*.headers; do printf '%s ' "$(basename "$f")"; awk 'NR==1 {print; exit}' "$f"; done
} > "$out/summary.txt"
printf '%s\n' "$out"
