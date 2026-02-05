#!/bin/bash
# List tasks from The Observatory
# Usage: ./task-list.sh [--urgent] [--todo] [--in-progress]

set -e

OBSERVATORY_URL="${OBSERVATORY_URL:-https://the-observatory-2k8lny34s-redlegendes-projects.vercel.app}"

QUERY=""

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --urgent) QUERY="?priority=urgent" ;;
    --high) QUERY="?priority=high" ;;
    --todo) QUERY="?status=todo" ;;
    --in-progress) QUERY="?status=in_progress" ;;
    --backlog) QUERY="?status=backlog" ;;
    --done) QUERY="?status=done" ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

curl -s "$OBSERVATORY_URL/api/fred/tasks$QUERY" | jq '.tasks[] | {id, title, status, priority}'
