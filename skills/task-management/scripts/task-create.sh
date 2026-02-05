#!/bin/bash
# Create a new task in The Observatory
# Usage: ./task-create.sh "Task title" [priority] [status]

set -e

OBSERVATORY_URL="${OBSERVATORY_URL:-https://the-observatory-2k8lny34s-redlegendes-projects.vercel.app}"

TITLE="$1"
PRIORITY="${2:-medium}"
STATUS="${3:-todo}"

if [ -z "$TITLE" ]; then
  echo "Usage: ./task-create.sh \"Task title\" [priority] [status]"
  echo "  priority: low, medium, high, urgent (default: medium)"
  echo "  status: backlog, todo, in_progress, review (default: todo)"
  exit 1
fi

curl -s -X POST "$OBSERVATORY_URL/api/fred/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"$TITLE\",
    \"priority\": \"$PRIORITY\",
    \"status\": \"$STATUS\",
    \"source\": \"fred\"
  }" | jq .
