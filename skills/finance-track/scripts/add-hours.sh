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
UPDATE_IF_EXISTS=false

# Check for --night flag and --update flag
for arg in "$@"; do
  if [[ "$arg" == "--night" ]]; then
    BUSINESS_TYPE="night"
  fi
  if [[ "$arg" == "--update" ]]; then
    UPDATE_IF_EXISTS=true
  fi
done

# Check for duplicate entry (same date + source)
CHECK=$(curl -s "$SUPABASE_URL/rest/v1/finance_entries?date=eq.$DATE&source=eq.$SOURCE&select=id,hours,rate_nok" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY")

EXISTING_COUNT=$(echo "$CHECK" | jq '. | length')

if [[ "$EXISTING_COUNT" -gt 0 ]]; then
  EXISTING_ID=$(echo "$CHECK" | jq -r '.[0].id')
  EXISTING_HOURS=$(echo "$CHECK" | jq -r '.[0].hours')
  EXISTING_RATE=$(echo "$CHECK" | jq -r '.[0].rate_nok')

  if [[ "$UPDATE_IF_EXISTS" == true ]]; then
    echo "⚠️  Entry exists for $DATE ($SOURCE). Updating..."

    # Update the existing entry
    JSON=$(cat <<EOF
{
  "hours": $HOURS,
  "rate_nok": $RATE,
  "business_type": "$BUSINESS_TYPE",
  "description": "$DESCRIPTION"
}
EOF
)

    RESPONSE=$(curl -s -X PATCH "$SUPABASE_URL/rest/v1/finance_entries?id=eq.$EXISTING_ID" \
      -H "apikey: $SUPABASE_KEY" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=representation" \
      -d "$JSON")

    if echo "$RESPONSE" | grep -q '"id"'; then
      SUBTOTAL=$(echo "$HOURS * $RATE" | bc -l | xargs printf "%.2f")
      TOTAL=$(echo "$SUBTOTAL * 1.25" | bc -l | xargs printf "%.2f")
      echo "✅ Updated entry for $DATE"
      echo "   Changed: ${EXISTING_HOURS}h × ${EXISTING_RATE} kr/h → ${HOURS}h × ${RATE} kr/h"
      echo "   New total with MVA: $TOTAL kr"
    else
      echo "❌ Failed to update entry"
      echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
      exit 1
    fi
    exit 0
  else
    echo "❌ Duplicate entry detected for $DATE ($SOURCE)"
    echo "   Existing: ${EXISTING_HOURS}h × ${EXISTING_RATE} kr/h"
    echo "   Use --update flag to overwrite, or delete the old entry first"
    exit 1
  fi
fi

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
