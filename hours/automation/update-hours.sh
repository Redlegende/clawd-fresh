#!/bin/bash
# update-hours.sh
# Update hours markdown file with extracted data

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOURS_DIR="$(dirname "$SCRIPT_DIR")"

# Read JSON from stdin or file
if [ -n "$1" ]; then
    DATA=$(cat "$1")
else
    DATA=$(cat)
fi

# Get month from first entry
MONTH=$(echo "$DATA" | jq -r '.entries[0].date' | cut -d'-' -f2)
YEAR=$(echo "$DATA" | jq -r '.entries[0].date' | cut -d'-' -f1)

MONTH_FILE="$HOURS_DIR/fåvang-varetaxi/${YEAR}-${MONTH}.md"

# Create month file if doesn't exist
if [ ! -f "$MONTH_FILE" ]; then
    cat > "$MONTH_FILE" << EOF
# Fåvang Varetaxi — $(date -j -f "%m" "$MONTH" "+%B" 2>/dev/null || echo "Month $MONTH") $YEAR

*All hours before invoicing*

---

EOF
fi

# Append entries
echo "" >> "$MONTH_FILE"
echo "## Week $(date +%V)" >> "$MONTH_FILE"
echo "" >> "$MONTH_FILE"

echo "$DATA" | jq -c '.entries[]' | while read -r entry; do
    date=$(echo "$entry" | jq -r '.date')
    start=$(echo "$entry" | jq -r '.start')
    end=$(echo "$entry" | jq -r '.end')
    type=$(echo "$entry" | jq -r '.type')
    hours=$(echo "$entry" | jq -r '.hours')
    rate=$(echo "$entry" | jq -r '.rate')
    amount=$(echo "$entry" | jq -r '.amount')
    day_name=$(echo "$entry" | jq -r '.day_of_week')
    
    # Format date nicely
    formatted_date=$(date -j -f "%Y-%m-%d" "$date" "+%A, %d %B %Y" 2>/dev/null || echo "$date")
    
    cat >> "$MONTH_FILE" << EOF
### $formatted_date
- **$start - $end** | ${hours}h @ ${rate} kr = ${amount} kr$([ "$type" = "night" ] && echo " *(night rate)*" || echo "")

EOF
done

echo "Updated $MONTH_FILE"
