#!/bin/bash
# add-to-calendar.sh
# Add extracted driving hours to Google Calendar

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOURS_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$HOURS_DIR/calendar-sync.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Read JSON from stdin or file
if [ -n "$1" ]; then
    DATA=$(cat "$1")
else
    DATA=$(cat)
fi

# Parse JSON (requires jq)
if ! command -v jq &> /dev/null; then
    log "ERROR: jq not installed. Install with: brew install jq"
    exit 1
fi

# Process each entry
echo "$DATA" | jq -c '.entries[]' | while read -r entry; do
    date=$(echo "$entry" | jq -r '.date')
    start=$(echo "$entry" | jq -r '.start')
    end=$(echo "$entry" | jq -r '.end')
    type=$(echo "$entry" | jq -r '.type')
    hours=$(echo "$entry" | jq -r '.hours')
    
    # Determine color based on shift type
    if [ "$type" = "night" ]; then
        color=11  # Red for night
        summary="🚕 Fåvang Varetaxi - Night Shift"
    else
        color=10  # Green for day
        summary="🚕 Fåvang Varetaxi - Day Shift"
    fi
    
    # Create ISO timestamps
    start_iso="${date}T${start}:00"
    end_iso="${date}T${end}:00"
    
    # Create calendar event
    log "Creating calendar event: $date $start-$end ($type)"
    
    # Use gog to create event
    # Note: Adjust timezone as needed (Europe/Oslo)
    gog calendar create primary \
        --summary "$summary" \
        --from "$start_iso" \
        --to "$end_iso" \
        --event-color "$color" \
        --description "Auto-logged from taxi PDF.
Hours: $hours
Type: $type
Rate: $([ "$type" = "night" ] && echo "400 kr/h" || echo "300 kr/h")

Reply to Freddy with any corrections." \
        2>&1 | tee -a "$LOG_FILE"
    
    log "Calendar event created for $date"
done

log "All calendar events created successfully!"
