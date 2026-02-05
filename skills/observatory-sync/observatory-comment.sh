#!/bin/bash
#
# Observatory Add Comment
# Add a comment to a task
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
Usage: observatory-comment.sh TASK_ID "COMMENT"

Add a comment to a task

ARGUMENTS:
    TASK_ID                 Task ID (can be partial - first 6+ chars)
    COMMENT                 Comment text (in quotes)

OPTIONS:
    -i, --internal          Mark as internal note (Fred-only)
    -h, --help              Show this help

EXAMPLES:
    observatory-comment.sh abc123 "Waiting for Henrik's reply"
    observatory-comment.sh abc123 "Need to review this" -i
EOF
}

# Check args
if [[ $# -lt 2 ]]; then
    usage
    exit 1
fi

TASK_ID="$1"
COMMENT="$2"
shift 2

INTERNAL=false

# Parse remaining args
while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--internal)
            INTERNAL=true
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

# Escape comment for SQL
ESCAPED_COMMENT=$(echo "$COMMENT" | sed "s/'/''/g")

# Find task by partial ID
QUERY="SELECT id, title FROM tasks WHERE id LIKE '${TASK_ID}%' LIMIT 1"
RESULT=$(cd /Users/jakobbakken/clawd-fresh && ./skills/supabase/scripts/supabase.sh query "$QUERY" 2>/dev/null || echo "[]")

# Check if task found
TASK_DATA=$(echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d[0])) if d else print('')" 2>/dev/null)

if [[ -z "$TASK_DATA" ]]; then
    echo -e "${RED}Error: Task not found with ID starting with '${TASK_ID}'${NC}"
    exit 1
fi

FULL_TASK_ID=$(echo "$TASK_DATA" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
TASK_TITLE=$(echo "$TASK_DATA" | python3 -c "import json,sys; print(json.load(sys.stdin)['title'])")

# Insert comment
INTERNAL_FLAG="false"
[[ "$INTERNAL" == true ]] && INTERNAL_FLAG="true"

INSERT_QUERY="INSERT INTO task_comments (task_id, author, content, is_internal_note, created_at, updated_at) 
VALUES ('${FULL_TASK_ID}', 'fred', '${ESCAPED_COMMENT}', ${INTERNAL_FLAG}, NOW(), NOW())"

RESULT=$(cd /Users/jakobbakken/clawd-fresh && ./skills/supabase/scripts/supabase.sh query "$INSERT_QUERY" 2>/dev/null || echo "ERROR")

if [[ "$RESULT" == "ERROR" ]]; then
    echo -e "${RED}Error: Failed to add comment${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Comment added to:${NC} $TASK_TITLE"
echo -e "${BLUE}  Comment:${NC} $COMMENT"

if [[ "$INTERNAL" == true ]]; then
    echo -e "${YELLOW}  (Internal note)${NC}"
fi
