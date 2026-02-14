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

MONTH="$1"
WORKPLACE="${2:-all}"

# Build filter
if [[ "$WORKPLACE" == "all" ]]; then
  FILTER="date=gte.${MONTH}-01&date=lt.${MONTH}-32&invoiced=eq.false"
else
  FILTER="date=gte.${MONTH}-01&date=lt.${MONTH}-32&source=eq.$WORKPLACE&invoiced=eq.false"
fi

# Update
RESPONSE=$(curl -s -X PATCH "$SUPABASE_URL/rest/v1/finance_entries?${FILTER}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"invoiced": true, "invoiced_at": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}')

COUNT=$(echo "$RESPONSE" | jq 'length // 0')

if [[ "$COUNT" -gt 0 ]]; then
  echo "✅ Marked $COUNT entries as invoiced for $MONTH"
  if [[ "$WORKPLACE" != "all" ]]; then
    echo "   Workplace: $WORKPLACE"
  fi
else
  echo "ℹ️  No uninvoiced entries found for $MONTH"
fi
