#!/bin/bash
# Evening Wrap-Up Generator for Jakob
# Runs daily at 21:00 Europe/Oslo via OpenClaw cron
# Pulls: Google Calendar, Supabase finance entries, TODO.md, cabin ops

set -euo pipefail

WORKSPACE="/Users/jakobbakken/clawd-fresh"
DATE=$(date +%Y-%m-%d)
DAY_NAME=$(date +%A)
TOMORROW=$(date -v+1d +%Y-%m-%d)
TOMORROW_DAY=$(date -v+1d +%A)

cd "$WORKSPACE"

# Load Supabase credentials
ENV_FILE="projects/the-observatory/.env.local"
SUPABASE_URL=""
SUPABASE_KEY=""

if [[ -f "$ENV_FILE" ]]; then
  SUPABASE_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
  SUPABASE_KEY=$(grep '^SUPABASE_SERVICE_KEY=' "$ENV_FILE" | cut -d= -f2-)
fi

BRIEF=""
BRIEF+="🌙 Evening Wrap-Up — ${DAY_NAME}, ${DATE}"$'\n'
BRIEF+=""$'\n'

# ── 1. TOMORROW'S SCHEDULE ──
BRIEF+="📅 TOMORROW (${TOMORROW_DAY}, $(date -v+1d '+%b %d'))"$'\n'
BRIEF+="---"$'\n'

CALENDAR_TOMORROW=""
if command -v gog &>/dev/null; then
  CALENDAR_TOMORROW=$(gog calendar events primary --from "${TOMORROW}T00:00:00" --to "${TOMORROW}T23:59:59" 2>/dev/null || true)
fi

TOMORROW_EVENT_COUNT=0
if [[ -n "$CALENDAR_TOMORROW" ]]; then
  TOMORROW_EVENT_COUNT=$(echo "$CALENDAR_TOMORROW" | tail -n +2 | grep -c . || true)
fi

if [[ "$TOMORROW_EVENT_COUNT" -gt 0 ]]; then
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    start_raw=$(echo "$line" | awk '{print $2}')
    start_time=$(echo "$start_raw" | cut -dT -f2 | cut -d+ -f1 | cut -c1-5)
    summary=$(echo "$line" | awk '{for(i=4;i<=NF;i++) printf "%s ", $i; print ""}' | xargs)
    BRIEF+="• ${start_time} — ${summary}"$'\n'
  done <<< "$(echo "$CALENDAR_TOMORROW" | tail -n +2)"
else
  BRIEF+="• No calendar events tomorrow"$'\n'
fi

# ── 2. TOMORROW'S WORK (Supabase) ──
WORK_COUNT=0
TOMORROW_WORK="[]"
if [[ -n "$SUPABASE_KEY" ]]; then
  TOMORROW_WORK=$(curl -s -X GET \
    "$SUPABASE_URL/rest/v1/finance_entries?date=eq.$TOMORROW&order=start_time.asc" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" 2>/dev/null || echo "[]")

  WORK_COUNT=$(echo "$TOMORROW_WORK" | jq 'length' 2>/dev/null || echo "0")

  if [[ "$WORK_COUNT" -gt 0 ]]; then
    WORK_LINES=$(echo "$TOMORROW_WORK" | jq -r '.[] | "• \(.source) — \(.start_time[0:5] // "?")–\(.end_time[0:5] // "?") (\(.hours)h @ \(.rate_nok) kr/h)"' 2>/dev/null || echo "")
    if [[ -n "$WORK_LINES" ]]; then
      BRIEF+="${WORK_LINES}"$'\n'
    fi
  fi
fi
BRIEF+=""$'\n'

# ── 3. CABIN OPERATIONS CHECK ──
BRIEF+="🏠 CABIN OPERATIONS"$'\n'
BRIEF+="---"$'\n'

HAS_CABIN_OPS=false
CAN_DRIVE=true

if [[ -n "$CALENDAR_TOMORROW" ]] && echo "$CALENDAR_TOMORROW" | grep -qi "clean\|checkout\|check.out\|🧹\|🏃"; then
  HAS_CABIN_OPS=true
  BRIEF+="• 🧹 Cabin operations tomorrow"$'\n'
  BRIEF+="• ⏰ Window: 11:00–15:00"$'\n'
  if echo "$CALENDAR_TOMORROW" | grep -qi "check.in\|CHECK-IN"; then
    CAN_DRIVE=false
    BRIEF+="• ⚠️ CHECK-IN + CLEANING = NO DRIVING TOMORROW"$'\n'
  fi
fi

if [[ "$HAS_CABIN_OPS" == false ]]; then
  BRIEF+="• ✅ No cabin operations tomorrow"$'\n'
fi

if [[ "$CAN_DRIVE" == true ]]; then
  BRIEF+="• ✅ Free to drive"$'\n'
fi
BRIEF+=""$'\n'

# ── 4. URGENT TASKS ──
BRIEF+="🔴 URGENT TASKS"$'\n'
BRIEF+="---"$'\n'

if [[ -f "TODO.md" ]]; then
  TASKS=$(grep -E "^- \[ \].*\(high\)" TODO.md 2>/dev/null | head -5 | sed 's/^- \[ \] /• /' | sed 's/ | ID:.*//' || true)
  if [[ -n "$TASKS" ]]; then
    BRIEF+="${TASKS}"$'\n'
  else
    BRIEF+="• No urgent tasks"$'\n'
  fi
else
  BRIEF+="• No TODO.md found"$'\n'
fi
BRIEF+=""$'\n'

# ── 5. TOMORROW'S CONTEXT ──
BRIEF+="💡 TOMORROW'S CONTEXT"$'\n'
BRIEF+="---"$'\n'

CONTEXT_PARTS=()

if [[ "$WORK_COUNT" -gt 0 ]]; then
  FIRST_SOURCE=$(echo "$TOMORROW_WORK" | jq -r '.[0].source' 2>/dev/null || echo "work")
  FIRST_START=$(echo "$TOMORROW_WORK" | jq -r '.[0].start_time[0:5]' 2>/dev/null || echo "?")
  FIRST_END=$(echo "$TOMORROW_WORK" | jq -r '.[0].end_time[0:5]' 2>/dev/null || echo "?")
  CONTEXT_PARTS+=("${FIRST_SOURCE} day (${FIRST_START}–${FIRST_END}).")
fi

if [[ "$HAS_CABIN_OPS" == true ]]; then
  CONTEXT_PARTS+=("Cabin operations scheduled — plan around 11:00–15:00.")
fi

if [[ "$CAN_DRIVE" == false ]]; then
  CONTEXT_PARTS+=("Cannot drive tomorrow (cleaning + check-in).")
else
  CONTEXT_PARTS+=("Free to drive if needed.")
fi

if [[ ${#CONTEXT_PARTS[@]} -gt 0 ]]; then
  BRIEF+="• $(printf '%s ' "${CONTEXT_PARTS[@]}")"$'\n'
else
  BRIEF+="• Open day — no specific commitments."$'\n'
fi
BRIEF+=""$'\n'

BRIEF+="---"$'\n'
BRIEF+="Dashboard: https://the-observatory-beta.vercel.app"$'\n'

echo "$BRIEF"

mkdir -p memory
echo "$BRIEF" > "memory/${DATE}-evening-wrap-up.md"
