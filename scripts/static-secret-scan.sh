#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
{
  printf '%s\n' '--- tracked files with suspicious names ---'
  git ls-files | grep -Ei '(^|/)(\.env|.*secret.*|.*password.*|.*credential.*|.*auth.*\.json|.*\.map$)' || true
  printf '%s\n' '--- suspicious references with values redacted ---'
  grep -RIn --exclude-dir=.git --exclude-dir=node_modules --exclude='*.lock' -E 'AUTH_ADMIN_EMAIL|AUTH_ADMIN_PASSWORD|AUTH_PASSWORD|PASSWORD_HASH|SESSION_SECRET|localStorage|sessionStorage|setItem\(|password[[:space:]]*[:=]|secret[[:space:]]*[:=]|token[[:space:]]*[:=]' . 2>/dev/null | sed -E 's/(password|secret|token|hash)[[:space:]]*([:=])[[:space:]]*[^,;}]*/\1 \2 [REDACTED]/Ig' | cut -c1-280 || true
  printf '%s\n' '--- env/secret values in tracked text files ---'
  git grep -n -I -E '(AUTH_ADMIN_EMAIL|AUTH_ADMIN_PASSWORD|AUTH_SESSION_SECRET|PASSWORD_HASH|BEGIN [A-Z ]+ PRIVATE KEY|sk-[A-Za-z0-9_-]{16,})' -- ':!*.lock' 2>/dev/null | sed -E 's/(=|:)[^ ]+$/\1[REDACTED]/' | cut -c1-280 || true
} > audit-exposure-current/static-scan.txt
cat audit-exposure-current/static-scan.txt
