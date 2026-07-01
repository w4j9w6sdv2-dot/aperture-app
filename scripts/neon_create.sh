#!/usr/bin/env bash
set -eu
export NEON_API_KEY="napi_265z0j25awfmpomr276txvwsvigooh1mm49j5mi3ems8cmpnb6cb04y7hpm3hbru"

USER_ID="d87a8a59-f49b-433a-9553-cd28ae7c687f"

echo "=== Tentativo 1: crea progetto senza org_id ==="
curl -sS -w "\nHTTP %{http_code}\n" -X POST "https://console.neon.tech/api/v2/projects" \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"project\": {
      \"name\": \"infinitepx\",
      \"region_id\": \"aws-eu-central-1\",
      \"pg_version\": 16
    }
  }"

echo ""
echo "=== Tentativo 2: lista progetti utente (no org) ==="
curl -sS -w "\nHTTP %{http_code}\n" "https://console.neon.tech/api/v2/projects?search=infinitepx" \
  -H "Authorization: Bearer $NEON_API_KEY"
