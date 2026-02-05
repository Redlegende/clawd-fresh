#!/bin/bash
#
# Observatory Task Manager
# Lists, filters, and manages tasks from Supabase
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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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
Usage: observatory-tasks.sh [OPTIONS]

List and filter tasks from the Observatory

OPTIONS:
    -s, --status STATUS     Filter by status (backlog|todo|in_progress|review|done)
    -p, --priority PRIORITY Filter by priority (low|medium|high|urgent)
    -l, --limit N           Limit results (default: 50)
    -u, --urgent            Show only urgent tasks
    -o, --overdue           Show overdue tasks
    -c, --count             Show count only
    -h, --help              Show this help

EXAMPLES:
    observatory-tasks.sh                    # List all active tasks
    observatory-tasks.sh -u                 # Show urgent tasks
    observatory-tasks.sh -s todo            # Show todo tasks
    observatory-tasks.sh -p high -l 10      # Show 10 high priority tasks
EOF
}

# Parse arguments
STATUS=""
PRIORITY=""
LIMIT=50
URGENT_ONLY=false
OVERDUE_ONLY=false
COUNT_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--status)
            STATUS="$2"
            shift 2
            ;;
        -p|--priority)
            PRIORITY="$2"
            shift 2
            ;;
        -l|--limit)
            LIMIT="$2"
            shift 2
            ;;
        -u|--urgent)
            URGENT_ONLY=true
            shift
            ;;
        -o|--overdue)
            OVERDUE_ONLY=true
            shift
            ;;
        -c|--count)
            COUNT_ONLY=true
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

# Build query
QUERY="SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    t.due_date,
    p.name as project_name,
    COUNT(tc.id) as comment_count
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN task_comments tc ON t.id = tc.task_id
WHERE 1=1"

# Add filters
if [[ -n "$STATUS" ]]; then
    QUERY="$QUERY AND t.status = '$STATUS'"
else
    # Default: exclude done tasks
    QUERY="$QUERY AND t.status != 'done'"
fi

if [[ -n "$PRIORITY" ]]; then
    QUERY="$QUERY AND t.priority = '$PRIORITY'"
fi

if [[ "$URGENT_ONLY" == true ]]; then
    QUERY="$QUERY AND t.priority = 'urgent'"
fi

if [[ "$OVERDUE_ONLY" == true ]]; then
    QUERY="$QUERY AND t.due_date < CURRENT_DATE AND t.status != 'done'"
fi

QUERY="$QUERY 
GROUP BY t.id, t.title, t.status, t.priority, t.due_date, p.name
ORDER BY 
    CASE t.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        ELSE 4 
    END,
    t.due_date ASC NULLS LAST
LIMIT $LIMIT"

# Execute query using supabase skill
RESULT=$(cd /Users/jakobbakken/clawd-fresh && ./skills/supabase/scripts/supabase.sh query "$QUERY" 2>/dev/null || echo "[]")

# Check if result is empty
if [[ "$RESULT" == "[]" ]] || [[ -z "$RESULT" ]]; then
    echo -e "${YELLOW}No tasks found${NC}"
    exit 0
fi

# Parse and display
echo "$RESULT" | python3 << 'PYTHON'
import json
import sys
from datetime import datetime

data = json.load(sys.stdin)

if not data:
    print("No tasks found")
    sys.exit(0)

# Priority colors
priority_colors = {
    'urgent': '\033[0;31m',  # Red
    'high': '\033[1;33m',     # Yellow
    'medium': '\033[0;33m',   # Orange-ish
    'low': '\033[0;32m'       # Green
}
reset = '\033[0m'

# Status icons
status_icons = {
    'backlog': '◯',
    'todo': '○',
    'in_progress': '◐',
    'review': '◑',
    'done': '●'
}

print(f"\n{'ID':<8} {'Status':<12} {'Priority':<8} {'Due':<12} {'Title'}")
print("=" * 80)

for task in data:
    task_id = task.get('id', '')[:6]
    status = task.get('status', 'unknown')
    priority = task.get('priority', 'medium')
    due_date = task.get('due_date', '')
    title = task.get('title', 'Untitled')
    project = task.get('project_name', '')
    comments = task.get('comment_count', 0)
    
    # Format due date
    if due_date:
        try:
            d = datetime.strptime(due_date, '%Y-%m-%d')
            today = datetime.now()
            if d.date() < today.date():
                due_str = f"{priority_colors['urgent']}{due_date}{reset}"
            elif d.date() == today.date():
                due_str = f"{priority_colors['high']}TODAY{reset}"
            else:
                due_str = due_date
        except:
            due_str = due_date
    else:
        due_str = '-'
    
    # Color priority
    p_color = priority_colors.get(priority, '')
    priority_str = f"{p_color}{priority[:6]:<6}{reset}"
    
    # Status icon
    icon = status_icons.get(status, '?')
    status_str = f"{icon} {status[:10]}"
    
    # Comments indicator
    comment_str = f" 💬{comments}" if comments > 0 else ""
    
    # Project indicator
    project_str = f" [{project}]" if project else ""
    
    print(f"{task_id:<8} {status_str:<12} {priority_str:<8} {due_str:<12} {title}{project_str}{comment_str}")

print(f"\n{len(data)} tasks")
PYTHON
