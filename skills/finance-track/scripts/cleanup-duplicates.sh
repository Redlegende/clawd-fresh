#!/usr/bin/env bash
set -euo pipefail

# Find and remove duplicate finance entries
# A duplicate is defined as: same date, same source, same hours, same rate

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

DRY_RUN=true
if [[ "${1:-}" == "--execute" ]]; then
  DRY_RUN=false
  echo "⚠️  EXECUTE mode - duplicates will be deleted"
else
  echo "🔍 DRY RUN mode - no changes will be made"
  echo "   Use --execute to actually delete duplicates"
fi
echo ""

# Fetch all entries
ENTRIES=$(curl -s "$SUPABASE_URL/rest/v1/finance_entries?select=*&order=date.asc,created_at.asc" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY")

# Group by date+source+hours+rate and find duplicates
DUPLICATES=$(echo "$ENTRIES" | jq -r '
  group_by([.date, .source, .hours, .rate_nok]) |
  map(select(length > 1)) |
  map({
    date: .[0].date,
    source: .[0].source,
    hours: .[0].hours,
    rate: .[0].rate_nok,
    count: length,
    ids: map(.id),
    keep: .[0].id
  }) |
  .[]
')

DUPLICATE_COUNT=$(echo "$DUPLICATES" | jq -s 'length')

if [[ "$DUPLICATE_COUNT" -eq 0 ]]; then
  echo "✅ No duplicates found"
  exit 0
fi

echo "Found $DUPLICATE_COUNT duplicate groups:"
echo ""

echo "$DUPLICATES" | jq -c '.' | while IFS= read -r dup; do
  DATE=$(echo "$dup" | jq -r '.date')
  SOURCE=$(echo "$dup" | jq -r '.source')
  HOURS=$(echo "$dup" | jq -r '.hours')
  RATE=$(echo "$dup" | jq -r '.rate')
  COUNT=$(echo "$dup" | jq -r '.count')
  KEEP_ID=$(echo "$dup" | jq -r '.keep')
  DELETE_IDS=$(echo "$dup" | jq -r '.ids | .[1:] | .[]')

  echo "📅 $DATE | $SOURCE | ${HOURS}h × ${RATE} kr/h | $COUNT duplicates"
  echo "   Keep: $KEEP_ID (oldest)"

  for DELETE_ID in $DELETE_IDS; do
    echo "   Delete: $DELETE_ID"

    if [[ "$DRY_RUN" == false ]]; then
      RESPONSE=$(curl -s -X DELETE "$SUPABASE_URL/rest/v1/finance_entries?id=eq.$DELETE_ID" \
        -H "apikey: $SUPABASE_KEY" \
        -H "Authorization: Bearer $SUPABASE_KEY")

      if [[ -z "$RESPONSE" ]]; then
        echo "      ✅ Deleted"
      else
        echo "      ❌ Failed: $RESPONSE"
      fi
    fi
  done

  echo ""
done

if [[ "$DRY_RUN" == true ]]; then
  echo "Run with --execute to delete these duplicates"
fi
