#!/usr/bin/env bash
set -u
export RENDER_TOKEN="rnd_ODfIW1lRnPlAHJ2psZYcPUkvhaJC"
SVC="srv-d92cvnlckfvc73diojh0"
DEPLOY="dep-d92d6abtqb8s73f9qha0"

for i in $(seq 1 40); do
  RESP=$(curl -sS "https://api.render.com/v1/services/$SVC/deploys/$DEPLOY" \
    -H "Authorization: Bearer $RENDER_TOKEN")
  STATUS=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))")
  echo "[$(date +%H:%M:%S)] [$i/40] status=$STATUS"
  case "$STATUS" in
    live)
      echo ">>> DEPLOY LIVE!"
      break
      ;;
    build_failed|update_failed|deactivated|canceled| canceled)
      echo ">>> DEPLOY FALLITO: $STATUS"
      echo "$RESP"
      break
      ;;
  esac
  sleep 30
done

echo ""
echo "=== Eventi recenti ==="
curl -sS "https://api.render.com/v1/services/$SVC/events?limit=10" \
  -H "Authorization: Bearer $RENDER_TOKEN" | python3 -m json.tool 2>/dev/null | head -120
