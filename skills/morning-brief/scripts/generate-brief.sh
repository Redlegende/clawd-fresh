#!/bin/bash
# Morning Brief Generator for Jakob
# Runs daily at 8:00 AM Europe/Oslo via OpenClaw cron
# Pulls: Google Calendar, Supabase finance entries, TODO.md, cabin operations

set -euo pipefail

WORKSPACE="/Users/jakobbakken/clawd-fresh"
DATE=$(date +%Y-%m-%d)
DAY_NAME=$(date +%A)
MONTH=$(date +%Y-%m)
TOMORROW=$(date -v+1d +%Y-%m-%d)

cd "$WORKSPACE"

# Load Supabase credentials
ENV_FILE="projects/the-observatory/.env.local"
SUPABASE_URL=""
SUPABASE_KEY=""

if [[ -f "$ENV_FILE" ]]; then
  SUPABASE_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
  SUPABASE_KEY=$(grep '^SUPABASE_SERVICE_KEY=' "$ENV_FILE" | cut -d= -f2-)
fi

# Build output as a single string
BRIEF=""

BRIEF+="🌅 Morning Brief — ${DAY_NAME}, ${DATE}"$'\n'
BRIEF+=""$'\n'

# ── 1. TODAY'S CALENDAR ──
BRIEF+="📅 TODAY'S SCHEDULE"$'\n'
BRIEF+="---"$'\n'

CALENDAR_TODAY=""
CALENDAR_TOMORROW=""
CALENDAR_WEEK=""

if command -v gog &>/dev/null; then
  CALENDAR_TODAY=$(gog calendar events primary --from "${DATE}T00:00:00" --to "${DATE}T23:59:59" 2>/dev/null || true)
  CALENDAR_TOMORROW=$(gog calendar events primary --from "${TOMORROW}T00:00:00" --to "${TOMORROW}T23:59:59" 2>/dev/null || true)
  WEEK_END=$(date -v+7d +%Y-%m-%d)
  CALENDAR_WEEK=$(gog calendar events primary --from "${TOMORROW}T00:00:00" --to "${WEEK_END}T23:59:59" 2>/dev/null || true)
fi

# Parse today's events (skip header line from gog output)
TODAY_EVENT_COUNT=0
if [[ -n "$CALENDAR_TODAY" ]]; then
  TODAY_EVENT_COUNT=$(echo "$CALENDAR_TODAY" | tail -n +2 | grep -c . || true)
fi

if [[ "$TODAY_EVENT_COUNT" -gt 0 ]]; then
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    # gog format: ID  START  END  SUMMARY
    start_raw=$(echo "$line" | awk '{print $2}')
    start_time=$(echo "$start_raw" | cut -dT -f2 | cut -d+ -f1 | cut -c1-5)
    summary=$(echo "$line" | awk '{for(i=4;i<=NF;i++) printf "%s ", $i; print ""}' | xargs)
    BRIEF+="• ${start_time} — ${summary}"$'\n'
  done <<< "$(echo "$CALENDAR_TODAY" | tail -n +2)"
else
  BRIEF+="• No calendar events today"$'\n'
fi
BRIEF+=""$'\n'

# ── 2. CABIN OPERATIONS ──
BRIEF+="🏠 CABIN OPERATIONS"$'\n'
BRIEF+="---"$'\n'

HAS_CABIN_OPS=false

if [[ -n "$CALENDAR_TODAY" ]] && echo "$CALENDAR_TODAY" | grep -qi "clean\|checkout\|check.out\|🧹\|🏃"; then
  HAS_CABIN_OPS=true
  BRIEF+="• 🧹 CLEANING/CHECKOUT DAY today"$'\n'
  BRIEF+="• ⏰ Window: 11:00–15:00"$'\n'
  if echo "$CALENDAR_TODAY" | grep -qi "check.in\|CHECK-IN"; then
    BRIEF+="• ⚠️ CHECK-IN + CLEANING = NO DRIVING TODAY"$'\n'
  fi
fi

if [[ -n "$CALENDAR_TOMORROW" ]] && echo "$CALENDAR_TOMORROW" | grep -qi "clean\|checkout\|check.out\|🧹\|🏃"; then
  HAS_CABIN_OPS=true
  TOMORROW_SUMMARY=$(echo "$CALENDAR_TOMORROW" | tail -n +2 | awk '{for(i=4;i<=NF;i++) printf "%s ", $i; print ""}' | head -1 | xargs)
  BRIEF+="• 📋 TOMORROW: ${TOMORROW_SUMMARY}"$'\n'
fi

if [[ "$HAS_CABIN_OPS" == false ]]; then
  BRIEF+="• ✅ No cabin operations today or tomorrow"$'\n'
fi
BRIEF+=""$'\n'

# ── 3. WORK SCHEDULE (from Supabase finance_entries) ──
BRIEF+="💼 TODAY'S WORK"$'\n'
BRIEF+="---"$'\n'

if [[ -n "$SUPABASE_KEY" ]]; then
  TODAY_WORK=$(curl -s -X GET \
    "$SUPABASE_URL/rest/v1/finance_entries?date=eq.$DATE&order=start_time.asc" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" 2>/dev/null || echo "[]")

  WORK_COUNT=$(echo "$TODAY_WORK" | jq 'length' 2>/dev/null || echo "0")

  if [[ "$WORK_COUNT" -gt 0 ]]; then
    WORK_LINES=$(echo "$TODAY_WORK" | jq -r '.[] | "• \(.source) — \(.start_time[0:5] // "?")–\(.end_time[0:5] // "?") (\(.hours)h @ \(.rate_nok) kr/h)"' 2>/dev/null || echo "")
    BRIEF+="${WORK_LINES}"$'\n'
  else
    BRIEF+="• No work scheduled today"$'\n'
  fi
else
  BRIEF+="• ⚠️ Supabase not configured"$'\n'
fi
BRIEF+=""$'\n'

# ── 4. MONTH-TO-DATE EARNINGS ──
MONTH_LABEL=$(date +%B)
BRIEF+="💰 MONTH-TO-DATE (${MONTH_LABEL})"$'\n'
BRIEF+="---"$'\n'

if [[ -n "$SUPABASE_KEY" ]]; then
  YEAR=$(date +%Y)
  MONTH_NUM=$(date +%m)
  if [[ "$MONTH_NUM" == "12" ]]; then
    NEXT_MONTH="01"; NEXT_YEAR=$((YEAR + 1))
  else
    NEXT_MONTH=$(printf "%02d" $((10#$MONTH_NUM + 1))); NEXT_YEAR=$YEAR
  fi

  MONTH_ENTRIES=$(curl -s -X GET \
    "$SUPABASE_URL/rest/v1/finance_entries?date=gte.$MONTH-01&date=lt.$NEXT_YEAR-$NEXT_MONTH-01" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" 2>/dev/null || echo "[]")

  M_COUNT=$(echo "$MONTH_ENTRIES" | jq 'length' 2>/dev/null || echo "0")
  if [[ "$M_COUNT" -gt 0 ]]; then
    TOTAL_HOURS=$(echo "$MONTH_ENTRIES" | jq '[.[].hours] | add' 2>/dev/null || echo "0")
    TOTAL_EX_MVA=$(echo "$MONTH_ENTRIES" | jq '[.[].subtotal_nok] | add' 2>/dev/null || echo "0")
    TOTAL_WITH_MVA=$(echo "$MONTH_ENTRIES" | jq '[.[].total_nok] | add' 2>/dev/null || echo "0")
    UNINVOICED=$(echo "$MONTH_ENTRIES" | jq '[.[] | select(.invoiced == false) | .total_nok] | add // 0' 2>/dev/null || echo "0")
    BRIEF+="• Hours: ${TOTAL_HOURS}t"$'\n'
    BRIEF+="• Ex-MVA: ${TOTAL_EX_MVA} kr"$'\n'
    BRIEF+="• Total (incl MVA): ${TOTAL_WITH_MVA} kr"$'\n'
    BRIEF+="• Uninvoiced: ${UNINVOICED} kr"$'\n'
  else
    BRIEF+="• No entries yet this month"$'\n'
  fi
fi
BRIEF+=""$'\n'

# ── 5. ACTIVE TASKS ──
BRIEF+="🔴 ACTIVE TASKS"$'\n'
BRIEF+="---"$'\n'

if [[ -f "TODO.md" ]]; then
  # Extract unchecked high-priority and TODO tasks
  TASKS=$(grep -E "^- \[ \].*\(high\)" TODO.md 2>/dev/null | head -5 | sed 's/^- \[ \] /• /' | sed 's/ | ID:.*//' || true)
  if [[ -n "$TASKS" ]]; then
    BRIEF+="${TASKS}"$'\n'
  else
    # Fallback: any unchecked task
    TASKS=$(grep -E "^- \[ \]" TODO.md 2>/dev/null | head -3 | sed 's/^- \[ \] /• /' | sed 's/ | ID:.*//' || true)
    if [[ -n "$TASKS" ]]; then
      BRIEF+="${TASKS}"$'\n'
    else
      BRIEF+="• No active tasks"$'\n'
    fi
  fi
fi
BRIEF+=""$'\n'

# ── 6. UPCOMING THIS WEEK ──
BRIEF+="📋 UPCOMING THIS WEEK"$'\n'
BRIEF+="---"$'\n'

WEEK_COUNT=0
if [[ -n "$CALENDAR_WEEK" ]]; then
  WEEK_COUNT=$(echo "$CALENDAR_WEEK" | tail -n +2 | grep -c . || true)
fi

if [[ "$WEEK_COUNT" -gt 0 ]]; then
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    event_date=$(echo "$line" | awk '{print $2}' | cut -dT -f1)
    event_time=$(echo "$line" | awk '{print $2}' | cut -dT -f2 | cut -d+ -f1 | cut -c1-5)
    summary=$(echo "$line" | awk '{for(i=4;i<=NF;i++) printf "%s ", $i; print ""}' | xargs)
    day_label=$(date -jf "%Y-%m-%d" "$event_date" "+%a %d" 2>/dev/null || echo "$event_date")
    BRIEF+="• ${day_label} ${event_time} — ${summary}"$'\n'
  done <<< "$(echo "$CALENDAR_WEEK" | tail -n +2)"
else
  BRIEF+="• No events scheduled this week"$'\n'
fi
BRIEF+=""$'\n'

BRIEF+="---"$'\n'
BRIEF+="Dashboard: https://the-observatory-beta.vercel.app"$'\n'

# Output for OpenClaw to capture and send
echo "$BRIEF"

# Save to daily note
mkdir -p memory
echo "$BRIEF" > "memory/${DATE}-morning-brief.md"
