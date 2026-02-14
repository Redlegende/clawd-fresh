#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# Load Supabase credentials
if [ -f /Users/jakobbakken/clawd-fresh/projects/the-observatory/.env.local ]; then
  source /Users/jakobbakken/clawd-fresh/projects/the-observatory/.env.local
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-${SUPABASE_URL:-}}"
SUPABASE_KEY="${SUPABASE_SERVICE_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_SERVICE_KEY required" >&2
  exit 1
fi

# Rates configuration
declare -A DAY_RATES=( ["Fåvang Varetaxi"]=300 ["Treffen"]=400 ["Kvitfjellhytter"]=0 ["Other"]=300 )
declare -A NIGHT_RATES=( ["Fåvang Varetaxi"]=400 ["Treffen"]=400 ["Kvitfjellhytter"]=0 ["Other"]=300 )
MVA_RATE=1.25

# Helper: API call to Supabase
supabase_api() {
  local method="$1"
  local path="$2"
  shift 2
  curl -s -X "$method" "$SUPABASE_URL/rest/v1/$path" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    "$@"
}

# Add entry
cmd_add() {
  local date="" source="Fåvang Varetaxi" description="" hours="" type="day" start_time="" end_time=""
  
  while [[ $# -gt 0 ]]; do
    case $1 in
      --date) date="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      --description) description="$2"; shift 2 ;;
      --hours) hours="$2"; shift 2 ;;
      --type) type="$2"; shift 2 ;;
      --start) start_time="$2"; shift 2 ;;
      --end) end_time="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [ -z "$date" ] || [ -z "$hours" ]; then
    echo "Error: --date and --hours required" >&2
    exit 1
  fi

  # Get rate
  local rate
  if [ "$type" = "night" ]; then
    rate="${NIGHT_RATES[$source]}"
  else
    rate="${DAY_RATES[$source]}"
  fi

  local payload=$(cat <<JSON
{
  "date": "$date",
  "source": "$source",
  "description": "$description",
  "hours": $hours,
  "rate_nok": $rate,
  "mva_rate": $MVA_RATE,
  "business_type": "$type",
  "start_time": $([ -n "$start_time" ] && echo "\"$start_time\"" || echo "null"),
  "end_time": $([ -n "$end_time" ] && echo "\"$end_time\"" || echo "null")
}
JSON
)

  echo "Adding entry..." >&2
  local response=$(supabase_api POST "finance_entries" -d "$payload")
  
  if echo "$response" | jq -e '.[0].id' >/dev/null 2>&1; then
    echo "✅ Entry added successfully" >&2
    echo "$response" | jq '.[0]'
  else
    echo "❌ Failed to add entry" >&2
    echo "$response" | jq . >&2
    exit 1
  fi
}

# Get total earnings
cmd_total() {
  local month="" source=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --month) month="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  # Default to current month
  if [ -z "$month" ]; then
    month=$(date +%Y-%m)
  fi

  # Get all entries and filter in jq
  local response=$(supabase_api GET "finance_entries?order=date.asc&select=date,source,subtotal_nok,total_nok,hours")

  local filtered_data=$(echo "$response" | jq --arg month "$month" --arg src "$source" '
    [.[] | select(.date | startswith($month))] |
    if $src != "" then [.[] | select(.source == $src)] else . end
  ')

  local total_ex_mva=$(echo "$filtered_data" | jq '[.[].subtotal_nok] | add // 0')
  local total_with_mva=$(echo "$filtered_data" | jq '[.[].total_nok] | add // 0')
  local total_hours=$(echo "$filtered_data" | jq '[.[].hours] | add // 0')
  local mva=$(echo "$total_with_mva - $total_ex_mva" | bc)

  echo "📊 Earnings for $month${source:+ ($source)}"
  echo ""
  echo "  Hours:        $(printf '%.1f' "$total_hours")t"
  echo "  Ex MVA:       $(printf '%.0f' "$total_ex_mva") kr"
  echo "  MVA (25%):    $(printf '%.0f' "$mva") kr"
  echo "  Total:        $(printf '%.0f' "$total_with_mva") kr"
}

# List entries
cmd_list() {
  local month="" source="" status=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --month) month="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      --status) status="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  # Default to current month
  if [ -z "$month" ]; then
    month=$(date +%Y-%m)
  fi

  # Get all entries and filter in jq
  local response=$(supabase_api GET "finance_entries?order=date.asc")

  echo "$response" | jq -r --arg month "$month" --arg src "$source" --arg st "$status" '
    [.[] | select(.date | startswith($month))] |
    if $src != "" then [.[] | select(.source == $src)] else . end |
    if $st == "pending" then [.[] | select(.invoiced == false and .paid == false)]
    elif $st == "invoiced" then [.[] | select(.invoiced == true and .paid == false)]
    elif $st == "paid" then [.[] | select(.paid == true)]
    else . end |
    ["DATE", "SOURCE", "DESCRIPTION", "HOURS", "RATE", "TOTAL", "STATUS"],
    (.[] | [
      .date,
      .source,
      .description // "",
      (.hours | tostring + "h"),
      (.rate_nok | tostring + " kr"),
      (.total_nok | tostring + " kr"),
      (if .paid then "PAID" elif .invoiced then "INVOICED" else "PENDING" end)
    ])
    | @tsv
  ' | column -t -s $'\t'
}

# Summary (breakdown by workplace)
cmd_summary() {
  local month=""
  
  while [[ $# -gt 0 ]]; do
    case $1 in
      --month) month="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [ -z "$month" ]; then
    month=$(date +%Y-%m)
  fi

  local query="date=gte.${month}-01&date=lt.${month}-32"
  local response=$(supabase_api GET "finance_entries?$query")
  
  echo "📊 Summary for $month"
  echo ""
  echo "$response" | jq -r '
    group_by(.source) | 
    .[] | 
    {
      source: .[0].source,
      hours: ([.[].hours] | add),
      ex_mva: ([.[].subtotal_nok] | add),
      with_mva: ([.[].total_nok] | add),
      count: length
    } |
    "\(.source):\n  Entries: \(.count)\n  Hours: \(.hours)h\n  Total: \(.with_mva) kr (ex MVA: \(.ex_mva) kr)\n"
  '
}

# Mark invoiced
cmd_invoice() {
  local id="" month="" source=""
  
  while [[ $# -gt 0 ]]; do
    case $1 in
      --id) id="$2"; shift 2 ;;
      --month) month="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [ -n "$id" ]; then
    # Mark single entry
    local payload='{"invoiced": true, "invoiced_at": "'$(date -u +%Y-%m-%dT%H:%M:%S)'"}'
    supabase_api PATCH "finance_entries?id=eq.$id" -d "$payload" | jq .
  elif [ -n "$month" ]; then
    # Mark all in month
    local query="date=gte.${month}-01&date=lt.${month}-32"
    if [ -n "$source" ]; then
      query="$query&source=eq.$source"
    fi
    local payload='{"invoiced": true, "invoiced_at": "'$(date -u +%Y-%m-%dT%H:%M:%S)'"}'
    supabase_api PATCH "finance_entries?$query" -d "$payload" | jq 'length as $count | "Marked \($count) entries as invoiced"'
  else
    echo "Error: --id or --month required" >&2
    exit 1
  fi
}

# Mark paid
cmd_pay() {
  local id="" month="" source=""
  
  while [[ $# -gt 0 ]]; do
    case $1 in
      --id) id="$2"; shift 2 ;;
      --month) month="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [ -n "$id" ]; then
    local payload='{"paid": true, "paid_at": "'$(date -u +%Y-%m-%dT%H:%M:%S)'"}'
    supabase_api PATCH "finance_entries?id=eq.$id" -d "$payload" | jq .
  elif [ -n "$month" ]; then
    local query="date=gte.${month}-01&date=lt.${month}-32"
    if [ -n "$source" ]; then
      query="$query&source=eq.$source"
    fi
    local payload='{"paid": true, "paid_at": "'$(date -u +%Y-%m-%dT%H:%M:%S)'"}'
    supabase_api PATCH "finance_entries?$query" -d "$payload" | jq 'length as $count | "Marked \($count) entries as paid"'
  else
    echo "Error: --id or --month required" >&2
    exit 1
  fi
}

# Main
COMMAND="${1:-help}"
shift || true

case "$COMMAND" in
  add) cmd_add "$@" ;;
  total) cmd_total "$@" ;;
  list) cmd_list "$@" ;;
  summary) cmd_summary "$@" ;;
  invoice) cmd_invoice "$@" ;;
  pay) cmd_pay "$@" ;;
  help|--help|-h)
    echo "Usage: finance.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  add      Add new entry"
    echo "  total    Show total earnings"
    echo "  list     List entries"
    echo "  summary  Show breakdown by workplace"
    echo "  invoice  Mark entries as invoiced"
    echo "  pay      Mark entries as paid"
    echo ""
    echo "Run 'finance.sh <command> --help' for command-specific help"
    ;;
  *)
    echo "Unknown command: $COMMAND" >&2
    echo "Run 'finance.sh help' for usage" >&2
    exit 1
    ;;
esac
