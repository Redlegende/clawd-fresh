#!/bin/bash
#
# Observatory Complete Task
# Mark a task as done
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
Usage: observatory-complete-task.sh TASK_ID [OPTIONS]

Mark a task as completed

ARGUMENTS:
    TASK_ID                 Task ID (can be partial - first 6+ chars)

OPTIONS:
    -c, --comment COMMENT   Add a completion comment
    -h, --help              Show this help

EXAMPLES:
    observatory-complete-task.sh abc123
    observatory-complete-task.sh abc123 -c "Done, deployed to prod"
EOF
}

# Check args
if [[ $# -lt 1 ]]; then
    usage
    exit 1
fi

TASK_ID="$1"
shift
COMMENT=""

# Parse remaining args
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--comment)
            COMMENT="$2"
            shift 2
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

# Find task by partial ID
QUERY="SELECT id, title, status FROM tasks WHERE id LIKE '${TASK_ID}%' LIMIT 1"
RESULT=$(cd /Users/jakobbakken/clawd-fresh && ./skills/supabase/scripts/supabase.sh query "$QUERY" 2>/dev/null || echo "[]")

# Check if task found
TASK_DATA=$(echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d[0])) if d else print('')" 2>/dev/null)

if [[ -z "$TASK_DATA" ]]; then
    echo -e "${RED}Error: Task not found with ID starting with '${TASK_ID}'${NC}"
    exit 1
fi

FULL_TASK_ID=$(echo "$TASK_DATA" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
TASK_TITLE=$(echo "$TASK_DATA" | python3 -c "import json,sys; print(json.load(sys.stdin)['title'])")
TASK_STATUS=$(echo "$TASK_DATA" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")

if [[ "$TASK_STATUS" == "done" ]]; then
    echo -e "${YELLOW}Task is already completed:${NC} $TASK_TITLE"
    exit 0
fi

# Update task
UPDATE_QUERY="UPDATE tasks SET 
    status = 'done',
    completed_at = NOW(),
    updated_at = NOW()
WHERE id = '${FULL_TASK_ID}'"

RESULT=$(cd /Users/jakobbakken/clawd-fresh && ./skills/supabase/scripts/supabase.sh query "$UPDATE_QUERY" 2>/dev/null || echo "ERROR")

if [[ "$RESULT" == "ERROR" ]]; then
    echo -e "${RED}Error: Failed to update task${NC}"
    exit 1
fi

# Add comment if provided
if [[ -n "$COMMENT" ]]; then
    COMMENT_QUERY="INSERT INTO task_comments (task_id, author, content, created_at) 
VALUES ('${FULL_TASK_ID}', 'fred', '${COMMENT}', NOW())"
    
    cd /Users/jakobbakken/clawd-fresh && ./skills/supabase/scripts/supabase.sh query "$COMMENT_QUERY" >/dev/null 2>&1
fi

# Log to sync log
LOG_QUERY="INSERT INTO task_sync_log (event_type, task_id, task_title, new_status, completed_by, synced_at) 
VALUES ('completed', '${FULL_TASK_ID}', '${TASK_TITLE}', 'done', 'fred', NOW())"

cd /Users/jakobbakken/clawd-fresh && ./skills/supabase/scripts/supabase.sh query "$LOG_QUERY" >/dev/null 2>&1

echo -e "${GREEN}✓ Task completed:${NC} $TASK_TITLE"

if [[ -n "$COMMENT" ]]; then
    echo -e "${BLUE}  Comment:${NC} $COMMENT"
fi
