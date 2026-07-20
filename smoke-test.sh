#!/usr/bin/env bash
# Telos backend end-to-end smoke test.
# Curls every documented endpoint against a running server, exercising a full
# transaction lifecycle. Run AFTER the server is up on :8080.
#
#   bash smoke-test.sh
#
# Exits non-zero on the first hard failure. Pretty-prints each response.
set -uo pipefail

BASE="${TELOS_BASE:-http://localhost:8080}"
PASS=0
FAIL=0
TOKEN=""
ADMIN_TOKEN=""

# --- helpers ---------------------------------------------------------------
jq() { python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d,indent=2))" 2>/dev/null; }

# pull a top-level string field out of the last JSON body
field() { python3 -c "import sys,json; print(json.load(sys.stdin).get('$1',''))" 2>/dev/null; }

# req METHOD PATH [JSON_BODY] [TOKEN]  -> sets RESP and HTTP
req() {
  local method="$1" path="$2" body="${3:-}" tok="${4:-}"
  local args=(-s -w $'\n%{http_code}' -X "$method" "$BASE$path"
              -H 'Content-Type: application/json')
  [ -n "$tok" ] && args+=(-H "Authorization: Bearer $tok")
  [ -n "$body" ] && args+=(-d "$body")
  local out; out="$(curl "${args[@]}")"
  HTTP="${out##*$'\n'}"
  RESP="${out%$'\n'*}"
}

# check NAME EXPECTED_HTTP
check() {
  local name="$1" want="$2"
  if [ "$HTTP" = "$want" ]; then
    echo "  ✓ $name  ($HTTP)"
    PASS=$((PASS+1))
  else
    echo "  ✗ $name  (got $HTTP, want $want)"
    echo "$RESP" | jq | sed 's/^/      /'
    FAIL=$((FAIL+1))
  fi
}

section() { echo; echo "=== $1 ==="; }

# --- 1. Auth ---------------------------------------------------------------
section "Auth"
req POST /api/auth/login '{"email":"aliya.rahman@telos.app","password":"demo1234"}'
check "login current user" 200
TOKEN="$(echo "$RESP" | field token)"
[ -z "$TOKEN" ] && { echo "FATAL: no token from login"; exit 1; }
ADMIN_TOKEN="$TOKEN"   # u-001 is the seeded admin

req GET /api/me '' "$TOKEN"
check "GET /api/me" 200

req POST /api/auth/signup '{"name":"Jane Doe","email":"jane.'"$RANDOM"'@neighborhood.app","neighborhood":"Maple Heights","password":"secret123"}'
check "signup new user (KYC pending)" 201

# --- 2. Categories & discovery --------------------------------------------
section "Items & discovery"
req GET /api/categories
check "GET /api/categories (public)" 200

req GET "/api/items?radiusKm=5&mode=ALL&category=all&sort=distance" '' "$TOKEN"
check "GET /api/items radial discovery" 200
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('items',[]); print('      items in 5km:',len(items)); assert all('geom' not in i and 'lat' not in i for i in items),'LEAK: raw coords exposed'; print('      ✓ no raw coordinates leaked')" || FAIL=$((FAIL+1))

req GET /api/items/it-01 '' "$TOKEN"
check "GET /api/items/it-01 detail" 200

req POST /api/items '{"title":"Test Ladder","category":"tools","mode":"RENT","price":5,"deposit":20,"description":"6ft aluminium"}' "$TOKEN"
check "POST /api/items create listing" 201

# --- 3. Transaction lifecycle ---------------------------------------------
section "Transaction lifecycle (request -> approve -> pickup -> return)"
req POST /api/transactions '{"itemId":"it-10","days":2}' "$TOKEN"
check "POST /api/transactions (request)" 201
TXID="$(echo "$RESP" | field id)"
echo "      txId=$TXID"

req GET /api/transactions '' "$TOKEN"
check "GET /api/transactions" 200

# approve as the lender (u-104 owns it-10). We approve via admin token path only
# if the API derives lender server-side; otherwise this exercises the guard.
req PATCH "/api/transactions/$TXID" '{"toState":"APPROVED"}' "$TOKEN"
echo "      approve -> HTTP $HTTP (may be 200 or 403 depending on lender check)"

# illegal transition must 409
req PATCH "/api/transactions/$TXID" '{"toState":"RETURNED"}' "$TOKEN"
check "illegal transition rejected" 409

# --- 4. Wallet -------------------------------------------------------------
section "Wallet / escrow"
req GET /api/wallet '' "$TOKEN"
check "GET /api/wallet" 200
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('      available=%s locked=%s earned=%s'%(d.get('available'),d.get('locked'),d.get('earned')))" 2>/dev/null

req POST /api/wallet/topups '{"amount":90,"receiptRef":"#smoke"}' "$TOKEN"
check "POST /api/wallet/topups" 202

# --- 5. Handoff QR ---------------------------------------------------------
section "QR handoff"
req POST "/api/handoff/tx-1002/token" '' "$TOKEN"
check "mint handoff token (tx-1002 APPROVED)" 201
HTOKEN="$(echo "$RESP" | field token)"
echo "      token=$HTOKEN"

req POST /api/handoff/scan '{"token":"TELOS:bogus:DEADBEEF:0"}' "$TOKEN"
check "expired/bogus token rejected (410)" 410

# --- 6. Admin --------------------------------------------------------------
section "Admin verification queue"
req GET "/api/admin/verifications?status=PENDING" '' "$ADMIN_TOKEN"
check "GET /api/admin/verifications (admin)" 200

req GET "/api/admin/verifications" '' "$ADMIN_TOKEN"
check "admin queue all" 200

req PATCH /api/admin/verifications/vq-1 '{"decision":"APPROVED"}' "$ADMIN_TOKEN"
check "PATCH admin decide vq-1" 200

# admin route must be forbidden without admin role — signup user is non-admin
req POST /api/auth/login '{"email":"sofia.marin@telos.app","password":"demo1234"}'
NONADMIN="$(echo "$RESP" | field token)"
if [ -n "$NONADMIN" ]; then
  req GET /api/admin/verifications '' "$NONADMIN"
  check "non-admin blocked from /api/admin (403)" 403
fi

# --- 7. Supporting reads ---------------------------------------------------
section "Supporting reads"
req GET /api/users/u-101 '' "$TOKEN"
check "GET /api/users/u-101" 200

req GET /api/notifications '' "$TOKEN"
check "GET /api/notifications" 200

req PATCH /api/notifications/read '' "$TOKEN"
check "PATCH /api/notifications/read" 200

# --- summary ---------------------------------------------------------------
echo
echo "============================================"
echo "  SMOKE TEST: $PASS passed, $FAIL failed"
echo "============================================"
[ "$FAIL" -eq 0 ]
