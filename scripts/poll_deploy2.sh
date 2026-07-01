#!/usr/bin/env bash
set -u
export RENDER_TOKEN="rnd_ODfIW1lRnPlAHJ2psZYcPUkvhaJC"
SVC="srv-d92cvnlckfvc73diojh0"
DEPLOY="dep-d92degh9rddc73dej75g"

# Render build di un'app Rails può impiegare 5-10 minuti (bundle install + npm install + webpack + assets:precompile + db:migrate + seed)
# Poll ogni 30s per 30 minuti
for i in $(seq 1 60); do
  RESP=$(curl -sS "https://api.render.com/v1/services/$SVC/deploys/$DEPLOY" \
    -H "Authorization: Bearer $RENDER_TOKEN")
  STATUS=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))")
  echo "[$(date +%H:%M:%S)] [$i/60] status=$STATUS"
  case "$STATUS" in
    live)
      echo ">>> DEPLOY LIVE!"
      echo "$RESP"
      break
      ;;
    build_failed|update_failed|deactivated|canceled)
      echo ">>> DEPLOY FALLITO: $STATUS"
      echo "$RESP"
      break
      ;;
  esac
  sleep 30
done

echo ""
echo "=== Ultimi 5 eventi ==="
curl -sS "https://api.render.com/v1/services/$SVC/events?limit=5" \
  -H "Authorization: Bearer $RENDER_TOKEN" | python3 -m json.tool 2>/dev/null | head -80
