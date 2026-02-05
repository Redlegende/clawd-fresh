#!/bin/bash
# Complete a task in The Observatory
# Usage: ./task-complete.sh <task-id> [notes]

set -e

OBSERVATORY_URL="${OBSERVATORY_URL:-https://the-observatory-2k8lny34s-redlegendes-projects.vercel.app}"

TASK_ID="$1"
NOTES="${2:-Completed via CLI}"

if [ -z "$TASK_ID" ]; then
  echo "Usage: ./task-complete.sh <task-id> [notes]"
  exit 1
fi

curl -s -X POST "$OBSERVATORY_URL/api/fred/tasks/$TASK_ID/complete" \
  -H "Content-Type: application/json" \
  -d "{
    \"notes\": \"$NOTES\",
    \"completed_by\": \"fred\"
  }" | jq .
