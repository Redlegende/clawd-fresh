#!/bin/bash
# Sync finance entries to Google Calendar
# Creates calendar events for work shifts that aren't already in the calendar
# Usage: sync-to-calendar.sh [--date YYYY-MM-DD] [--range YYYY-MM-DD YYYY-MM-DD]

set -euo pipefail

WORKSPACE="/Users/jakobbakken/clawd-fresh"
cd "$WORKSPACE"

# Load Supabase credentials
ENV_FILE="projects/the-observatory/.env.local"
SUPABASE_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_KEY=$(grep '^SUPABASE_SERVICE_KEY=' "$ENV_FILE" | cut -d= -f2-)

# Color mapping for calendar events
# 7 = cyan/teal (Treffen)
# 9 = blue (Fåvang Varetaxi day)
# 3 = purple (Fåvang Varetaxi night)
# 6 = orange (Other)
get_color() {
  local source="$1"
  local business_type="${2:-day}"
  case "$source" in
    *Treffen*|*treffen*) echo "7" ;;
    *Varetaxi*|*varetaxi*|*Favang*|*favang*|*Fåvang*)
      if [[ "$business_type" == "night" ]]; then echo "3"; else echo "9"; fi
      ;;
    *) echo "6" ;;
  esac
}

get_emoji() {
  local source="$1"
  case "$source" in
    *Treffen*|*treffen*) echo "🍽️" ;;
    *Varetaxi*|*varetaxi*|*Favang*|*favang*|*Fåvang*) echo "🚗" ;;
    *) echo "💼" ;;
  esac
}

# Parse arguments
START_DATE=""
END_DATE=""

if [[ "${1:-}" == "--date" ]]; then
  START_DATE="$2"
  END_DATE="$2"
elif [[ "${1:-}" == "--range" ]]; then
  START_DATE="$2"
  END_DATE="$3"
else
  # Default: today + next 7 days
  START_DATE=$(date +%Y-%m-%d)
  END_DATE=$(date -v+7d +%Y-%m-%d)
fi

echo "📅 Syncing finance entries to Google Calendar: $START_DATE → $END_DATE"
echo ""

# Fetch finance entries for the date range
ENTRIES=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/finance_entries?date=gte.$START_DATE&date=lte.$END_DATE&order=date.asc,start_time.asc" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY")

ENTRY_COUNT=$(echo "$ENTRIES" | jq 'length')
echo "Found $ENTRY_COUNT finance entries"

if [[ "$ENTRY_COUNT" -eq 0 ]]; then
  echo "Nothing to sync."
  exit 0
fi

# Fetch existing calendar events for the same range
EXISTING_EVENTS=$(gog calendar events primary --from "${START_DATE}T00:00:00" --to "${END_DATE}T23:59:59" --plain 2>/dev/null || echo "")

CREATED=0
SKIPPED=0

echo "$ENTRIES" | jq -c '.[]' | while read -r entry; do
  entry_date=$(echo "$entry" | jq -r '.date')
  source=$(echo "$entry" | jq -r '.source')
  start_time=$(echo "$entry" | jq -r '.start_time // "09:00:00"' | cut -c1-5)
  end_time=$(echo "$entry" | jq -r '.end_time // "17:00:00"' | cut -c1-5)
  hours=$(echo "$entry" | jq -r '.hours')
  business_type=$(echo "$entry" | jq -r '.business_type // "day"')
  
  emoji=$(get_emoji "$source")
  color=$(get_color "$source" "$business_type")
  
  # Build event summary
  if [[ "$business_type" == "night" ]]; then
    summary="${emoji} ${source} (kveldskjøring)"
  else
    summary="${emoji} ${source}"
  fi
  
  # Check if event already exists (match by date + source keywords)
  source_keyword=$(echo "$source" | awk '{print $1}')
  if echo "$EXISTING_EVENTS" | grep -q "${entry_date}" && echo "$EXISTING_EVENTS" | grep -qi "$source_keyword"; then
    echo "⏭️  Skip: $entry_date $source — already in calendar"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi
  
  # Create the calendar event
  echo "➕ Creating: $entry_date ${start_time}–${end_time} $summary"
  gog calendar create primary \
    --summary "$summary" \
    --from "${entry_date}T${start_time}:00+01:00" \
    --to "${entry_date}T${end_time}:00+01:00" \
    --event-color "$color" \
    --no-input \
    --force 2>/dev/null || echo "   ⚠️ Failed to create event"
  
  CREATED=$((CREATED + 1))
done

echo ""
echo "✅ Done! Created: $CREATED | Skipped: $SKIPPED"
