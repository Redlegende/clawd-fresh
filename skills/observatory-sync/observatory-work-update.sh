#!/bin/bash
#
# Observatory Work Update
# Add a comment about work done on a task (without completing it)
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
Usage: observatory-work-update.sh TASK_ID "WORK_DONE"

Add a comment about work done on a task (Fred's usage)

ARGUMENTS:
    TASK_ID                 Task ID (can be partial - first 6+ chars)
    WORK_DONE               Description of work done (in quotes)

OPTIONS:
    -h, --help              Show this help

EXAMPLES:
    observatory-work-update.sh abc123 "Researched API endpoints, found 3 candidates"
    observatory-work-update.sh abc123 "Fixed bug in authentication flow"
EOF
}

# Check args
if [[ $# -lt 2 ]]; then
    usage
    exit 1
fi

TASK_ID="$1"
WORK_DONE="$2"

# Escape comment for SQL
ESCAPED_COMMENT=$(echo "$WORK_DONE" | sed "s/'/''/g")

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

# Add comment
COMMENT_QUERY="INSERT INTO task_comments (task_id, author, content, created_at, updated_at) 
VALUES ('${FULL_TASK_ID}', 'fred', '${ESCAPED_COMMENT}', NOW(), NOW())"

RESULT=$(cd /Users/jakobbakken/clawd-fresh && ./skills/supabase/scripts/supabase.sh query "$COMMENT_QUERY" 2>/dev/null || echo "ERROR")

if [[ "$RESULT" == "ERROR" ]]; then
    echo -e "${RED}Error: Failed to add work update${NC}"
    exit 1
fi

# Also notify Jakob
NOTIFY_QUERY="INSERT INTO fred_notifications (type, message, task_id, task_title, read, created_at)
VALUES ('task_comment', '💬 Fred updated task: \"${TASK_TITLE}\"', '${FULL_TASK_ID}', '${TASK_TITLE}', false, NOW())"

cd /Users/jakobbakken/clawd-fresh && ./skills/supabase/scripts/supabase.sh query "$NOTIFY_QUERY" >/dev/null 2>&1

echo -e "${CYAN}✓ Work logged for:${NC} $TASK_TITLE"
echo -e "${BLUE}  Status:${NC} $TASK_STATUS"
echo -e "${BLUE}  Update:${NC} $WORK_DONE"
