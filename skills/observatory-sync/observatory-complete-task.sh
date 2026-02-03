#!/bin/bash
# observatory-complete-task
# Mark a task as done via API

OBSERVATORY_URL="${OBSERVATORY_URL:-https://the-observatory-2k8lny34s-redlegendes-projects.vercel.app}"

if [ $# -lt 1 ]; then
    echo "Usage: observatory-complete-task <task-id> [notes]"
    echo ""
    echo "Examples:"
    echo "  observatory-complete-task abc-123"
    echo "  observatory-complete-task abc-123 'Completed via automation'"
    exit 1
fi

TASK_ID="$1"
NOTES="${2:-Completed by Fred}"

echo "✅ Marking task as done..."
echo "  Task ID: $TASK_ID"
echo "  Notes: $NOTES"
echo ""

response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"notes\": \"$NOTES\", \"completed_by\": \"fred\"}" \
    "$OBSERVATORY_URL/api/fred/tasks/$TASK_ID/complete")

# Check response
if echo "$response" | jq -e '.ok' >/dev/null 2>&1; then
    echo "✓ Success!"
    echo "$response" | jq -r '.message'
    echo ""
    echo "Task details:"
    echo "$response" | jq '.task | {id, title, status, completed_at}'
else
    echo "❌ Error:"
    echo "$response" | jq .
    exit 1
fi
