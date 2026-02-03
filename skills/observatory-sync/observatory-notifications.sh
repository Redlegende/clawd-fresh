#!/bin/bash
# observatory-notifications
# Check Fred's notifications from The Observatory

OBSERVATORY_URL="${OBSERVATORY_URL:-https://the-observatory-2k8lny34s-redlegendes-projects.vercel.app}"

echo "🔔 Checking Observatory notifications..."
echo "URL: $OBSERVATORY_URL"
echo ""

# Fetch notifications
response=$(curl -s "$OBSERVATORY_URL/api/fred/notifications")

# Check if response is valid JSON
if ! echo "$response" | jq -e . >/dev/null 2>&1; then
    echo "❌ Error: Invalid response from Observatory"
    echo "$response"
    exit 1
fi

# Parse and display
unread_count=$(echo "$response" | jq '.unread_count')
notifications=$(echo "$response" | jq '.notifications')
recent_completed=$(echo "$response" | jq '.recent_completed')

echo "📊 Summary:"
echo "  Unread notifications: $unread_count"
echo "  Recently completed (24h): $(echo "$recent_completed" | jq 'length')"
echo ""

# Show unread notifications
if [ "$unread_count" -gt 0 ]; then
    echo "📬 Unread Notifications:"
    echo "$notifications" | jq -r '.[] | "  [\(.type)] \(.message) (\(.created_at | split("T")[0]))"'
    echo ""
fi

# Show recently completed
recent_count=$(echo "$recent_completed" | jq 'length')
if [ "$recent_count" -gt 0 ]; then
    echo "✅ Recently Completed Tasks:"
    echo "$recent_completed" | jq -r '.[] | "  • \(.title)\n    Project: \(.project_name // "None") | Completed: \(.completed_at // "Unknown")"'
    echo ""
fi

# Mark all as read if requested
if [ "$1" == "--mark-read" ]; then
    echo "📝 Marking all as read..."
    curl -s -X POST "$OBSERVATORY_URL/api/fred/notifications?action=mark_all_read" | jq .
    echo ""
    echo "✓ Done"
fi
