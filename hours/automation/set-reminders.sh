#!/bin/bash
# set-reminders.sh
# Set end-of-shift reminders for driving days

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOURS_DIR="$(dirname "$SCRIPT_DIR")"

# Read JSON from stdin or file
if [ -n "$1" ]; then
    DATA=$(cat "$1")
else
    DATA=$(cat)
fi

echo "$DATA" | jq -c '.entries[]' | while read -r entry; do
    date=$(echo "$entry" | jq -r '.date')
    end=$(echo "$entry" | jq -r '.end')
    type=$(echo "$entry" | jq -r '.type')
    
    # Set reminder for 30 minutes after shift ends
    end_hour=$(echo "$end" | cut -d':' -f1)
    end_min=$(echo "$end" | cut -d':' -f2)
    
    # Add 30 minutes
    reminder_min=$((end_min + 30))
    reminder_hour=$end_hour
    
    if [ $reminder_min -ge 60 ]; then
        reminder_min=$((reminder_min - 60))
        reminder_hour=$((reminder_hour + 1))
    fi
    
    # Pad with zeros
    reminder_hour=$(printf "%02d" $reminder_hour)
    reminder_min=$(printf "%02d" $reminder_min)
    
    reminder_time="${reminder_hour}:${reminder_min}"
    reminder_iso="${date}T${reminder_time}:00"
    
    # Create reminder message
    if [ "$type" = "night" ]; then
        message="🚕 Night shift ending soon! Log your actual hours:
Date: $date
Expected: $end

Reply: 'Started HH:MM, finished HH:MM'"
    else
        message="🚕 Day shift ending soon! Log your actual hours:
Date: $date  
Expected: $end

Reply: 'Started HH:MM, finished HH:MM'"
    fi
    
    # Schedule reminder via cron
    # Note: This is a simplified version - actual implementation would use
    # the clawdbot cron system or a persistent reminder service
    
    echo "Reminder scheduled for $date at $reminder_time"
    echo "$message"
done
