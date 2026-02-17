#!/bin/bash
# Weekly Planning Generator for Jakob
# Runs Sundays at 20:00 Europe/Oslo via OpenClaw cron
# Pulls: Google Calendar, Supabase finance entries, TODO.md

set -euo pipefail

WORKSPACE="/Users/jakobbakken/clawd-fresh"
DATE=$(date +%Y-%m-%d)

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

# Calculate week boundaries - next Monday
DOW=$(date +%u) # 1=Mon, 7=Sun
if [[ "$DOW" == "7" ]]; then
  DAYS_AHEAD=1
else
  DAYS_AHEAD=$((8 - DOW))
fi
NEXT_MON=$(date -v+${DAYS_AHEAD}d +%Y-%m-%d)
# Get epoch for next Monday, then add 6 days for Sunday
MON_EPOCH=$(date -jf "%Y-%m-%d" "$NEXT_MON" +%s)
SUN_EPOCH=$((MON_EPOCH + 6 * 86400))
NEXT_SUN=$(date -r $SUN_EPOCH +%Y-%m-%d)

MON_LABEL=$(date -r $MON_EPOCH "+%b %d")
SUN_LABEL=$(date -r $SUN_EPOCH "+%b %d")
BRIEF+="📅 Weekly Planning — Week of ${MON_LABEL}–${SUN_LABEL}, $(date +%Y)"$'\n'
BRIEF+=""$'\n'

# ── 1. LAST WEEK RECAP ──
BRIEF+="LAST WEEK RECAP"$'\n'
BRIEF+="---"$'\n'

if [[ -n "$SUPABASE_KEY" ]]; then
  # Last Monday to last Sunday (two weeks before next Monday, to one week before)
  LAST_MON_EPOCH=$((MON_EPOCH - 14 * 86400))
  LAST_SUN_EPOCH=$((MON_EPOCH - 8 * 86400))
  LAST_MON=$(date -r $LAST_MON_EPOCH +%Y-%m-%d)
  LAST_SUN=$(date -r $LAST_SUN_EPOCH +%Y-%m-%d)

  LAST_WEEK=$(curl -s -X GET \
    "$SUPABASE_URL/rest/v1/finance_entries?date=gte.$LAST_MON&date=lte.$LAST_SUN&order=date.asc" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" 2>/dev/null || echo "[]")

  LW_COUNT=$(echo "$LAST_WEEK" | jq 'length' 2>/dev/null || echo "0")
  if [[ "$LW_COUNT" -gt 0 ]]; then
    LW_HOURS=$(echo "$LAST_WEEK" | jq '[.[].hours] | add' 2>/dev/null || echo "0")
    LW_TOTAL=$(echo "$LAST_WEEK" | jq '[.[].total_nok] | add' 2>/dev/null || echo "0")
    LW_INVOICED=$(echo "$LAST_WEEK" | jq '[.[] | select(.invoiced == true) | .total_nok] | add // 0' 2>/dev/null || echo "0")
    LW_OUTSTANDING=$(echo "$LAST_WEEK" | jq '[.[] | select(.invoiced == false) | .total_nok] | add // 0' 2>/dev/null || echo "0")
    BRIEF+="• Hours worked: ${LW_HOURS}t"$'\n'
    BRIEF+="• Earnings: ${LW_TOTAL} kr (incl MVA)"$'\n'
    BRIEF+="• Invoiced: ${LW_INVOICED} kr"$'\n'
    BRIEF+="• Outstanding: ${LW_OUTSTANDING} kr"$'\n'
  else
    BRIEF+="• No entries recorded last week"$'\n'
  fi
else
  BRIEF+="• ⚠️ Supabase not configured"$'\n'
fi
BRIEF+=""$'\n'

# ── 2. THIS WEEK OVERVIEW ──
BRIEF+="THIS WEEK OVERVIEW"$'\n'
BRIEF+="---"$'\n'

CALENDAR_WEEK=""
if command -v gog &>/dev/null; then
  WEEK_END_EPOCH=$((SUN_EPOCH + 86400))
  WEEK_END_QUERY=$(date -r $WEEK_END_EPOCH +%Y-%m-%d)
  CALENDAR_WEEK=$(gog calendar events primary --from "${NEXT_MON}T00:00:00" --to "${WEEK_END_QUERY}T23:59:59" 2>/dev/null || true)
fi

WEEK_FINANCE="[]"
if [[ -n "$SUPABASE_KEY" ]]; then
  WEEK_FINANCE=$(curl -s -X GET \
    "$SUPABASE_URL/rest/v1/finance_entries?date=gte.$NEXT_MON&date=lte.$NEXT_SUN&order=date.asc,start_time.asc" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" 2>/dev/null || echo "[]")
fi

for i in $(seq 0 6); do
  DAY_EPOCH=$((MON_EPOCH + i * 86400))
  DAY_DATE=$(date -r $DAY_EPOCH +%Y-%m-%d)
  DAY_LABEL=$(date -r $DAY_EPOCH "+%A, %b %d")

  BRIEF+="${DAY_LABEL}:"$'\n'

  DAY_HAS_ITEMS=false

  # Calendar events
  if [[ -n "$CALENDAR_WEEK" ]]; then
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      event_date=$(echo "$line" | awk '{print $2}' | cut -dT -f1)
      if [[ "$event_date" == "$DAY_DATE" ]]; then
        event_time=$(echo "$line" | awk '{print $2}' | cut -dT -f2 | cut -d+ -f1 | cut -c1-5)
        summary=$(echo "$line" | awk '{for(i=4;i<=NF;i++) printf "%s ", $i; print ""}' | xargs)
        BRIEF+="  • ${event_time} — ${summary}"$'\n'
        DAY_HAS_ITEMS=true
      fi
    done <<< "$(echo "$CALENDAR_WEEK" | tail -n +2)"
  fi

  # Finance entries
  DAY_WORK=$(echo "$WEEK_FINANCE" | jq -r --arg d "$DAY_DATE" '.[] | select(.date == $d) | "  • \(.source) — \(.start_time[0:5] // "?")–\(.end_time[0:5] // "?") (\(.hours)h)"' 2>/dev/null || true)
  if [[ -n "$DAY_WORK" ]]; then
    BRIEF+="${DAY_WORK}"$'\n'
    DAY_HAS_ITEMS=true
  fi

  # Cabin ops warnings
  if [[ -n "$CALENDAR_WEEK" ]]; then
    DAY_EVENTS=$(echo "$CALENDAR_WEEK" | tail -n +2 | awk -v d="$DAY_DATE" '$2 ~ d')
    if echo "$DAY_EVENTS" | grep -qi "clean\|checkout\|check.out\|🧹\|🏃"; then
      if echo "$DAY_EVENTS" | grep -qi "check.in\|CHECK-IN"; then
        BRIEF+="  ⚠️ NO DRIVING (cleaning + check-in)"$'\n'
      else
        BRIEF+="  ⚠️ Cabin operations (checkout/cleaning)"$'\n'
      fi
    fi
  fi

  if [[ "$DAY_HAS_ITEMS" == false ]]; then
    BRIEF+="  • Open day"$'\n'
  fi
  BRIEF+=""$'\n'
done

# ── 3. PRIORITIES ──
BRIEF+="PRIORITIES THIS WEEK"$'\n'
BRIEF+="---"$'\n'

if [[ -f "TODO.md" ]]; then
  PRIORITIES=$(grep -E "^- \[ \].*\(high\)" TODO.md 2>/dev/null | head -5 | sed 's/^- \[ \] /• /' | sed 's/ | ID:.*//' || true)
  if [[ -n "$PRIORITIES" ]]; then
    BRIEF+="${PRIORITIES}"$'\n'
  else
    PRIORITIES=$(grep -E "^- \[ \]" TODO.md 2>/dev/null | head -5 | sed 's/^- \[ \] /• /' | sed 's/ | ID:.*//' || true)
    if [[ -n "$PRIORITIES" ]]; then
      BRIEF+="${PRIORITIES}"$'\n'
    else
      BRIEF+="• No pending tasks"$'\n'
    fi
  fi
fi
BRIEF+=""$'\n'

# ── 4. REMINDERS ──
BRIEF+="REMINDERS"$'\n'
BRIEF+="---"$'\n'

REMINDERS=""
for i in $(seq 0 6); do
  DAY_EPOCH=$((MON_EPOCH + i * 86400))
  DAY_DATE=$(date -r $DAY_EPOCH +%Y-%m-%d)
  DAY_SHORT=$(date -r $DAY_EPOCH "+%A")

  if [[ -n "$CALENDAR_WEEK" ]]; then
    DAY_EVENTS=$(echo "$CALENDAR_WEEK" | tail -n +2 | awk -v d="$DAY_DATE" '$2 ~ d')
    if echo "$DAY_EVENTS" | grep -qi "check.in\|CHECK-IN" && echo "$DAY_EVENTS" | grep -qi "clean\|checkout\|check.out"; then
      REMINDERS+="• ${DAY_SHORT} = NO DRIVING (cleaning + check-in)"$'\n'
    fi
  fi
done

if [[ -n "$REMINDERS" ]]; then
  BRIEF+="${REMINDERS}"
else
  BRIEF+="• No special warnings this week"$'\n'
fi
BRIEF+=""$'\n'

BRIEF+="---"$'\n'
BRIEF+="Dashboard: https://the-observatory-beta.vercel.app"$'\n'

echo "$BRIEF"

mkdir -p memory
echo "$BRIEF" > "memory/${DATE}-weekly-plan.md"
