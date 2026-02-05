#!/bin/bash
# Get Fred's morning briefing
# Usage: ./briefing.sh

set -e

OBSERVATORY_URL="${OBSERVATORY_URL:-https://the-observatory-2k8lny34s-redlegendes-projects.vercel.app}"

echo "🌅 Fetching morning briefing..."
echo ""

BRIEFING=$(curl -s "$OBSERVATORY_URL/api/fred/briefing")

# Parse and display
echo "$BRIEFING" | jq -r '
"📅 DATE: \(.date)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 TASK OVERVIEW
• Total active: \(.tasks.total_active)
• Urgent: \(.tasks.urgent | length)
• High priority: \(.tasks.high | length)
• In progress: \(.tasks.in_progress | length)
• Overdue: \(.tasks.overdue | length)

🔴 URGENT TASKS
\(if .tasks.urgent | length > 0 then (.tasks.urgent | map("• " + .title) | join("\n")) else "None" end)

🟠 OVERDUE
\(if .tasks.overdue | length > 0 then (.tasks.overdue | map("• " + .title + " (due: " + .due_date + ")") | join("\n")) else "None" end)

🔵 IN PROGRESS
\(if .tasks.in_progress | length > 0 then (.tasks.in_progress | map("• " + .title) | join("\n")) else "None" end)

✅ COMPLETED YESTERDAY: \(.yesterday.completed_count)

💡 RECOMMENDATIONS
\(.recommendations | map("• " + .) | join("\n"))

🎯 FOCUS TASK: \(if .summary.focus_task then .summary.focus_task.title else "No specific focus" end)
"'
