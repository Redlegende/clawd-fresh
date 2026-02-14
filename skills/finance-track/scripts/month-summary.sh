#!/usr/bin/env bash
set -euo pipefail

# Supabase credentials
SUPABASE_URL="https://vhrmxtolrrcrhrxljemp.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NDAwNCwiZXhwIjoyMDg1NTUwMDA0fQ.jnZEhrFl823cgQHubVZv_-qRwvS8aO90Yosp_jxY2cs"

MONTH="$1"
WORKPLACE="${2:-all}"

# Calculate next month for date range
YEAR=$(echo "$MONTH" | cut -d'-' -f1)
MON=$(echo "$MONTH" | cut -d'-' -f2 | sed 's/^0//')
NEXT_MON=$((MON + 1))
NEXT_YEAR=$YEAR
if [[ $NEXT_MON -gt 12 ]]; then
  NEXT_MON=1
  NEXT_YEAR=$((YEAR + 1))
fi
NEXT_MONTH=$(printf "%d-%02d" "$NEXT_YEAR" "$NEXT_MON")

# Build filter
if [[ "$WORKPLACE" == "all" ]]; then
  FILTER="date=gte.${MONTH}-01&date=lt.${NEXT_MONTH}-01"
else
  FILTER="date=gte.${MONTH}-01&date=lt.${NEXT_MONTH}-01&source=eq.$WORKPLACE"
fi

# Fetch
DATA=$(curl -s "$SUPABASE_URL/rest/v1/finance_entries?${FILTER}&select=hours,subtotal_nok,total_nok,invoiced,paid,source,date,description,rate_nok&order=date.asc" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY")

if [[ -z "$DATA" ]] || [[ "$DATA" == "[]" ]]; then
  echo "No entries found for $MONTH"
  exit 0
fi

# Calculate totals
TOTAL_HOURS=$(echo "$DATA" | jq '[.[].hours | tostring | tonumber] | add // 0')
TOTAL_EX_MVA=$(echo "$DATA" | jq '[.[].subtotal_nok | tostring | tonumber] | add // 0')
TOTAL_WITH_MVA=$(echo "$DATA" | jq '[.[].total_nok | tostring | tonumber] | add // 0')
TOTAL_MVA=$(echo "$TOTAL_WITH_MVA - $TOTAL_EX_MVA" | bc -l)
INVOICED=$(echo "$DATA" | jq '[.[] | select(.invoiced == true) | .total_nok | tostring | tonumber] | add // 0')
PAID=$(echo "$DATA" | jq '[.[] | select(.paid == true) | .total_nok | tostring | tonumber] | add // 0')
PENDING=$(echo "$TOTAL_WITH_MVA - $INVOICED" | bc -l)
ENTRY_COUNT=$(echo "$DATA" | jq 'length')

echo ""
echo "═══════════════════════════════════════"
echo "  Finance Summary — $MONTH"
if [[ "$WORKPLACE" != "all" ]]; then
  echo "  Workplace: $WORKPLACE"
fi
echo "═══════════════════════════════════════"
echo ""
echo "  Hours worked:       ${TOTAL_HOURS} hours"
echo "  Entries:            ${ENTRY_COUNT}"
echo ""
echo "  Earnings (ex-MVA):  $(printf "%.2f" "$TOTAL_EX_MVA") kr"
echo "  MVA owed (25%):     $(printf "%.2f" "$TOTAL_MVA") kr"
echo "  Total with MVA:     $(printf "%.2f" "$TOTAL_WITH_MVA") kr"
echo ""
echo "  Invoiced:           $(printf "%.2f" "$INVOICED") kr"
echo "  Paid:               $(printf "%.2f" "$PAID") kr"
echo "  Pending:            $(printf "%.2f" "$PENDING") kr"

# Breakdown by workplace if "all"
if [[ "$WORKPLACE" == "all" ]]; then
  echo ""
  echo "───────────────────────────────────────"
  echo "  By workplace:"
  echo "$DATA" | jq -r 'group_by(.source) | .[] | "  \(.[0].source): \([.[].hours | tostring | tonumber] | add) hours, \([.[].total_nok | tostring | tonumber] | add) kr"'
fi

# Entry list
echo ""
echo "───────────────────────────────────────"
echo "  Entries:"
echo "$DATA" | jq -r '.[] | "  \(.date)  \(.description // "-")  \(.hours)h x \(.rate_nok) kr/h = \(.total_nok) kr  \(if .paid then "PAID" elif .invoiced then "INVOICED" else "PENDING" end)"'
echo "═══════════════════════════════════════"
