#!/bin/bash
# observatory.sh — Fast access to The Observatory data
# Usage: ./observatory.sh [tasks|projects|notifications|complete|sync] [options]

set -e

# Observatory credentials (pre-configured)
SUPABASE_URL="https://vhrmxtolrrcrhrxljemp.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NDAwNCwiZXhwIjoyMDg1NTUwMDA0fQ.jnZEhrFl823cgQHubVZv_-qRwvS8aO90Yosp_jxY2cs"

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SKILL_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    cat << EOF
Observatory CLI — Quick access to your dashboard data

Commands:
  tasks              List active tasks (todo + backlog, sorted by priority)
  tasks --urgent     Show only high/critical priority tasks
  projects           List all projects
  notifications      Check Fred's notification inbox
  complete <id>      Mark a task as done
  sync               Sync Observatory tasks to TODO.md backup

Examples:
  ./observatory.sh tasks
  ./observatory.sh tasks --urgent
  ./observatory.sh complete d5c54719-6eff-4600-a9d4-c7963f8f143b
EOF
}

# Run supabase query with pre-configured credentials
run_query() {
    export SUPABASE_URL="$SUPABASE_URL"
    export SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY"
    "$BASE_DIR/supabase/scripts/supabase.sh" "$@"
}

# Format tasks for human reading
format_tasks() {
    local json="$1"
    local count=$(echo "$json" | jq 'length')
    
    if [ "$count" -eq 0 ]; then
        echo "No active tasks found."
        return
    fi
    
    echo ""
    echo "$json" | jq -r '.[] | 
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" +
        "\n📝 " + .title +
        "\n   Status: " + .status + " | Priority: " + .priority +
        "\n   ID: " + .id +
        (if .description then "\n   " + .description else "" end)
    '
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Total: $count active tasks"
}

# Get active tasks (todo + backlog)
cmd_tasks() {
    local urgent_only=false
    if [ "$1" == "--urgent" ]; then
        urgent_only=true
    fi
    
    echo "🔭 Fetching active tasks from Observatory..."
    
    # Get all tasks and filter for non-done status
    local all_tasks=$(run_query select tasks --limit 100)
    
    # Filter for active statuses (todo, backlog, in_progress) and sort by priority
    local combined=$(echo "$all_tasks" | jq '[.[] | select(.status == "todo" or .status == "backlog" or .status == "in_progress")] | sort_by(
        if .priority == "critical" then 0 
        elif .priority == "high" then 1 
        elif .priority == "medium" then 2 
        elif .priority == "low" then 3 
        else 4 end
    )')
    
    if [ "$urgent_only" == true ]; then
        combined=$(echo "$combined" | jq '[.[] | select(.priority == "critical" or .priority == "high")]')
    fi
    
    format_tasks "$combined"
}

# List projects
cmd_projects() {
    echo "🔭 Fetching projects from Observatory..."
    local projects=$(run_query select projects --order name)
    local count=$(echo "$projects" | jq 'length')
    
    if [ "$count" -eq 0 ]; then
        echo "No projects found."
        return
    fi
    
    echo ""
    echo "$projects" | jq -r '.[] | 
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" +
        "\n📁 " + .name + " | Status: " + .status +
        "\n   ID: " + .id +
        (if .description then "\n   " + .description else "" end)
    '
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Total: $count projects"
}

# Check notifications
cmd_notifications() {
    echo "🔭 Checking Fred's notification inbox..."
    local notifications=$(run_query select fred_notifications --eq "read:false" --order created_at)
    local count=$(echo "$notifications" | jq 'length')
    
    if [ "$count" -eq 0 ]; then
        echo "No unread notifications."
        return
    fi
    
    echo ""
    echo "$notifications" | jq -r '.[] | 
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" +
        "\n🔔 " + .type + " | " + .created_at +
        "\n   " + .message +
        "\n   Task ID: " + .task_id
    '
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Total: $count unread notifications"
}

# Mark task complete
cmd_complete() {
    local task_id="$1"
    
    if [ -z "$task_id" ]; then
        echo "Error: Task ID required"
        echo "Usage: ./observatory.sh complete <task-id>"
        exit 1
    fi
    
    echo "✅ Marking task $task_id as done..."
    
    # Update task status
    run_query update tasks '{"status": "done", "completed_at": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' --eq "id:$task_id"
    
    echo "Task marked complete."
}

# Sync to TODO.md
cmd_sync() {
    echo "🔄 Syncing Observatory tasks to TODO.md..."
    
    # Get all non-done tasks
    local tasks=$(run_query select tasks --order priority)
    
    # Generate TODO.md format
    local output="# TODO.md — Auto-synced from Observatory\n\n"
    output+="*Last synced: $(date '+%Y-%m-%d %H:%M')*\n\n"
    
    output+="## ACTIVE\n\n"
    output+=$(echo "$tasks" | jq -r '[.[] | select(.status != "done")] | group_by(.status) | 
        .[] | 
        "### " + (if .[0].status == "todo" then "TODO" elif .[0].status == "backlog" then "BACKLOG" else .[0].status | ascii_upcase end) + "\n\n" +
        (map("- [ ] " + .title + " (" + .priority + ") | ID: " + .id) | join("\n"))
    ')
    
    output+="\n\n## DONE\n\n"
    output+=$(echo "$tasks" | jq -r '[.[] | select(.status == "done")] | 
        if length > 0 then 
            map("- [x] " + .title + " | ID: " + .id) | join("\n")
        else 
            "_(No completed tasks yet)_"
        end
    ')
    
    echo -e "$output" > "$(dirname "$BASE_DIR")/TODO.md"
    echo "✅ Synced to TODO.md"
}

# Main command dispatcher
case "${1:-}" in
    tasks)
        cmd_tasks "${2:-}"
        ;;
    projects)
        cmd_projects
        ;;
    notifications)
        cmd_notifications
        ;;
    complete)
        cmd_complete "$2"
        ;;
    sync)
        cmd_sync
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
