#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
secret_file='.production-secrets'
out='audit-exposure-current/public-secret-comparison.txt'
if [ ! -f "$secret_file" ]; then echo 'secret_file_present=0' > "$out"; exit 0; fi
email=$(awk -F= '/^AUTH_ADMIN_EMAIL/{sub(/^[^=]*=/,"",$0); gsub(/^ +| +$/,"",$0); print}' "$secret_file")
hash=$(awk -F= '/^AUTH_ADMIN_PASSWORD_HASH/{sub(/^[^=]*=/,"",$0); gsub(/^ +| +$/,"",$0); print}' "$secret_file")
secret=$(awk -F= '/^AUTH_SESSION_SECRET/{sub(/^[^=]*=/,"",$0); gsub(/^ +| +$/,"",$0); print}' "$secret_file")
password=$(awk -F= '/^TEMPORARY_PASSWORD/{sub(/^[^=]*=/,"",$0); gsub(/^ +| +$/,"",$0); print}' "$secret_file")
public_dir='audit-exposure-current'
contains() { grep -RIlF -- "$1" "$public_dir" 2>/dev/null | head -n 1 | grep -q .; }
printf 'secret_file_present=1\n' > "$out"
if git check-ignore -q "$secret_file"; then echo 'git_ignored=1' >> "$out"; else echo 'git_ignored=0' >> "$out"; fi
if git ls-files --error-unmatch "$secret_file" >/dev/null 2>&1; then echo 'git_tracked=1' >> "$out"; else echo 'git_tracked=0' >> "$out"; fi
if contains "$email" >/dev/null 2>&1; then echo 'public_contains_admin_email=1' >> "$out"; else echo 'public_contains_admin_email=0' >> "$out"; fi
if contains "$hash" >/dev/null 2>&1; then echo 'public_contains_password_hash=1' >> "$out"; else echo 'public_contains_password_hash=0' >> "$out"; fi
if contains "$secret" >/dev/null 2>&1; then echo 'public_contains_session_secret=1' >> "$out"; else echo 'public_contains_session_secret=0' >> "$out"; fi
if contains "$password" >/dev/null 2>&1; then echo 'public_contains_cleartext_password=1' >> "$out"; else echo 'public_contains_cleartext_password=0' >> "$out"; fi
cat "$out"
