#!/usr/bin/env bash
set -euo pipefail

# Load Observatory env
if [[ -f /Users/jakobbakken/clawd-fresh/projects/the-observatory/.env.local ]]; then
  export $(grep -v '^#' /Users/jakobbakken/clawd-fresh/projects/the-observatory/.env.local | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_SERVICE_KEY}"

if [[ -z "$SUPABASE_URL" ]] || [[ -z "$SUPABASE_KEY" ]]; then
  echo "Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not set"
  exit 1
fi

# Parse args
DATE="$1"
SOURCE="$2"
HOURS="$3"
RATE="$4"
DESCRIPTION="${5:-}"
BUSINESS_TYPE="day"

# Check for --night flag
for arg in "$@"; do
  if [[ "$arg" == "--night" ]]; then
    BUSINESS_TYPE="night"
  fi
done

# Build JSON
JSON=$(cat <<EOF
{
  "date": "$DATE",
  "source": "$SOURCE",
  "hours": $HOURS,
  "rate_nok": $RATE,
  "business_type": "$BUSINESS_TYPE",
  "mva_rate": 1.25,
  "description": "$DESCRIPTION"
}
EOF
)

# Insert
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/finance_entries" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$JSON")

if echo "$RESPONSE" | grep -q '"id"'; then
  SUBTOTAL=$(echo "$HOURS * $RATE" | bc -l | xargs printf "%.2f")
  TOTAL=$(echo "$SUBTOTAL * 1.25" | bc -l | xargs printf "%.2f")
  echo "✅ Added entry for $DATE"
  echo "   $SOURCE | $HOURS hours × $RATE kr/h = $SUBTOTAL kr (ex-MVA)"
  echo "   Total with MVA: $TOTAL kr"
else
  echo "❌ Failed to add entry"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  exit 1
fi
