#!/bin/bash
#
# Observatory Notifications
# Check Fred's notification queue
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Config
ENV_FILE="/Users/jakobbakken/clawd-fresh/projects/the-observatory/.env.local"

# Load environment variables
if [[ -f "$ENV_FILE" ]]; then
    export SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL "$ENV_FILE" | cut -d'=' -f2)
    export SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY "$ENV_FILE" | cut -d'=' -f2)
else
    echo -e "${RED}Error: .env.local not found${NC}"
    exit 1
fi

# Usage
usage() {
    cat << EOF
Usage: observatory-notifications.sh [OPTIONS]

Check Fred's notification inbox

OPTIONS:
    -r, --read              Mark all as read after showing
    -a, --all               Show all notifications (not just unread)
    -l, --limit N           Limit results (default: 20)
    -c, --clear             Clear all notifications
    -h, --help              Show this help

EXAMPLES:
    observatory-notifications.sh          # Show unread notifications
    observatory-notifications.sh -r       # Show and mark as read
    observatory-notifications.sh -a -l 5  # Show last 5 notifications
EOF
}

# Parse arguments
READ_AFTER=false
SHOW_ALL=false
LIMIT=20
CLEAR_ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--read)
            READ_AFTER=true
            shift
            ;;
        -a|--all)
            SHOW_ALL=true
            shift
            ;;
        -l|--limit)
            LIMIT="$2"
            shift 2
            ;;
        -c|--clear)
            CLEAR_ALL=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Clear all if requested
if [[ "$CLEAR_ALL" == true ]]; then
    QUERY="DELETE FROM fred_notifications WHERE read = false"
    cd /Users/jakobbakken/clawd-fresh && ./skills/supabase/scripts/supabase.sh query "$QUERY" >/dev/null 2>&1
    echo -e "${GREEN}✓ All notifications cleared${NC}"
    exit 0
fi

# Build query
if [[ "$SHOW_ALL" == true ]]; then
    QUERY="SELECT * FROM fred_notifications ORDER BY created_at DESC LIMIT $LIMIT"
else
    QUERY="SELECT * FROM fred_notifications WHERE read = false ORDER BY created_at DESC LIMIT $LIMIT"
fi

RESULT=$(cd /Users/jakobbakken/clawd-fresh && ./skills/supabase/scripts/supabase.sh query "$QUERY" 2>/dev/null || echo "[]")

# Check if result is empty
if [[ "$RESULT" == "[]" ]] || [[ -z "$RESULT" ]]; then
    if [[ "$SHOW_ALL" == true ]]; then
        echo -e "${YELLOW}No notifications${NC}"
    else
        echo -e "${GREEN}✓ No unread notifications${NC}"
    fi
    exit 0
fi

# Parse and display
echo "$RESULT" | python3 << PYTHON
import json
import sys
from datetime import datetime

data = json.load(sys.stdin)

if not data:
    print("No notifications")
    sys.exit(0)

# Type icons
type_icons = {
    'task_completed': '✅',
    'task_created': '🆕',
    'task_updated': '🔄',
    'task_rescheduled': '📅',
    'task_comment': '💬',
    'system': '⚙️'
}

print(f"\n{'Type':<15} {'Time':<12} {'Message'}")
print("=" * 80)

for notif in data:
    notif_type = notif.get('type', 'system')
    icon = type_icons.get(notif_type, '•')
    message = notif.get('message', '')
    created_at = notif.get('created_at', '')
    task_title = notif.get('task_title', '')
    
    # Format time
    if created_at:
        try:
            dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            now = datetime.now(dt.tzinfo)
            diff = now - dt
            hours = diff.total_seconds() / 3600
            
            if hours < 1:
                time_str = 'Just now'
            elif hours < 24:
                time_str = f'{int(hours)}h ago'
            else:
                time_str = dt.strftime('%m/%d')
        except:
            time_str = created_at[:10]
    else:
        time_str = '-'
    
    # Truncate message
    display_msg = message[:50] + '...' if len(message) > 50 else message
    
    print(f"{icon} {notif_type:<12} {time_str:<12} {display_msg}")

unread_count = len([n for n in data if not n.get('read', False)])
print(f"\n{len(data)} notifications ({unread_count} unread)")
PYTHON

# Mark as read if requested
if [[ "$READ_AFTER" == true ]]; then
    MARK_QUERY="UPDATE fred_notifications SET read = true, read_at = NOW() WHERE read = false"
    cd /Users/jakobbakken/clawd-fresh && ./skills/supabase/scripts/supabase.sh query "$MARK_QUERY" >/dev/null 2>&1
    echo -e "${GREEN}✓ Marked all as read${NC}"
fi
