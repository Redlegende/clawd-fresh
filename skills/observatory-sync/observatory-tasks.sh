#!/bin/bash
# observatory-tasks
# List tasks from Observatory

OBSERVATORY_URL="${OBSERVATORY_URL:-https://the-observatory-2k8lny34s-redlegendes-projects.vercel.app}"

# Parse arguments
STATUS=""
PRIORITY=""
LIMIT="50"

while [[ $# -gt 0 ]]; do
    case $1 in
        --status)
            STATUS="$2"
            shift 2
            ;;
        --priority)
            PRIORITY="$2"
            shift 2
            ;;
        --limit)
            LIMIT="$2"
            shift 2
            ;;
        --done)
            STATUS="done"
            shift
            ;;
        --urgent)
            PRIORITY="urgent"
            shift
            ;;
        -h|--help)
            echo "Usage: observatory-tasks [options]"
            echo ""
            echo "Options:"
            echo "  --status <status>    Filter by status (backlog, todo, in_progress, review, done)"
            echo "  --priority <prio>    Filter by priority (low, medium, high, urgent)"
            echo "  --limit <n>          Limit results (default: 50)"
            echo "  --done               Show only completed tasks"
            echo "  --urgent             Show only urgent tasks"
            echo ""
            echo "Examples:"
            echo "  observatory-tasks --urgent"
            echo "  observatory-tasks --status in_progress"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Build URL
url="$OBSERVATORY_URL/api/fred/tasks?limit=$LIMIT"
if [ -n "$STATUS" ]; then
    url="$url&status=$STATUS"
fi
if [ -n "$PRIORITY" ]; then
    url="$url&priority=$PRIORITY"
fi

echo "📋 Fetching tasks..."
echo "URL: $url"
echo ""

response=$(curl -s "$url")

# Check if valid JSON
if ! echo "$response" | jq -e . >/dev/null 2>&1; then
    echo "❌ Error: Invalid response"
    echo "$response"
    exit 1
fi

# Show summary
if echo "$response" | jq -e '.summary' >/dev/null 2>&1; then
    echo "📊 Summary:"
    echo "$response" | jq -r '.summary | to_entries[] | "  \(.key): \(.value)"'
    echo ""
fi

# Show tasks
echo "📝 Tasks:"
echo "$response" | jq -r '.tasks[] | 
    "  ──────────────────────────────\n" +
    "  \(.title)\n" +
    "  Status: \(.status) | Priority: \(.priority)\n" +
    "  ID: \(.id)\n" +
    (if .due_date then "  Due: \(.due_date)\n" else "" end) +
    (if .projects.name then "  Project: \(.projects.name)\n" else "" end)
'
