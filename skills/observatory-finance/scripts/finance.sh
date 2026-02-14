#!/usr/bin/env bash
set -euo pipefail

# Observatory Finance Management Script
# Manage hour tracking, earnings, and invoices

SUPABASE_URL="${SUPABASE_URL:-https://vhrmxtolrrcrhrxljemp.supabase.co}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"

if [[ -z "$SUPABASE_SERVICE_KEY" ]]; then
  # Try loading from Observatory .env
  if [[ -f "/Users/jakobbakken/clawd-fresh/projects/the-observatory/.env.local" ]]; then
    source "/Users/jakobbakken/clawd-fresh/projects/the-observatory/.env.local"
  fi
fi

if [[ -z "$SUPABASE_SERVICE_KEY" ]]; then
  echo "Error: SUPABASE_SERVICE_KEY not set" >&2
  exit 1
fi

# Rates with MVA
MVA_RATE=1.25

function get_rate() {
  local source="$1"
  local shift="$2"

  case "$source" in
    "Fåvang Varetaxi")
      [[ "$shift" == "night" ]] && echo "400" || echo "300"
      ;;
    "Treffen")
      echo "400"
      ;;
    "Kvitfjellhytter")
      echo "0"
      ;;
    "Other")
      echo "300"
      ;;
    *)
      echo "300"
      ;;
  esac
}

cmd="${1:-help}"
shift || true

function show_help() {
  cat <<EOF
Observatory Finance Management

USAGE:
  finance.sh add --date DATE --source SOURCE --hours HOURS --shift SHIFT [--description DESC]
  finance.sh stats --month YYYY-MM [--source SOURCE]
  finance.sh invoice --month YYYY-MM [--source SOURCE]
  finance.sh list --month YYYY-MM [--source SOURCE]
  finance.sh mark-invoiced --month YYYY-MM [--source SOURCE]
  finance.sh mark-paid --month YYYY-MM [--source SOURCE]

COMMANDS:
  add             Add hour entry
  stats           Show monthly statistics
  invoice         Generate invoice text (for accounting software)
  list            List entries for a month
  mark-invoiced   Mark all entries as invoiced
  mark-paid       Mark all entries as paid

OPTIONS:
  --date DATE           Date in YYYY-MM-DD format
  --source SOURCE       Fåvang Varetaxi | Treffen | Kvitfjellhytter | Other
  --hours HOURS         Hours worked (decimal, e.g., 8.5)
  --shift SHIFT         day | night
  --description DESC    Optional description
  --month YYYY-MM       Month filter (e.g., 2026-02)

EXAMPLES:
  # Add day shift
  finance.sh add --date 2026-02-14 --source "Fåvang Varetaxi" --hours 8.5 --shift day

  # Check February earnings
  finance.sh stats --month 2026-02

  # Generate invoice for Fåvang (February)
  finance.sh invoice --month 2026-02 --source "Fåvang Varetaxi"
EOF
}

function query_supabase() {
  local sql="$1"
  curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(printf '%s' "$sql" | jq -Rs .)}"
}

function insert_entry() {
  local json="$1"
  curl -s -X POST "$SUPABASE_URL/rest/v1/finance_entries" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$json"
}

function update_entries() {
  local filter="$1"
  local json="$2"
  curl -s -X PATCH "$SUPABASE_URL/rest/v1/finance_entries?$filter" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "$json"
}

function get_entries() {
  local filter="$1"
  curl -s -X GET "$SUPABASE_URL/rest/v1/finance_entries?$filter&order=date.desc" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"
}

function cmd_add() {
  local date="" source="" hours="" shift="" description=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --date) date="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      --hours) hours="$2"; shift 2 ;;
      --shift) shift="$2"; shift 2 ;;
      --description) description="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [[ -z "$date" || -z "$source" || -z "$hours" || -z "$shift" ]]; then
    echo "Error: Missing required arguments" >&2
    show_help
    exit 1
  fi

  local rate
  rate=$(get_rate "$source" "$shift")

  local subtotal=$(awk "BEGIN {print $hours * $rate}")
  local total=$(awk "BEGIN {print $subtotal * $MVA_RATE}")

  local json
  json=$(jq -n \
    --arg date "$date" \
    --arg source "$source" \
    --arg description "$description" \
    --arg hours "$hours" \
    --arg rate "$rate" \
    --arg mva_rate "$MVA_RATE" \
    --arg business_type "$shift" \
    '{
      date: $date,
      source: $source,
      description: $description,
      hours: ($hours | tonumber),
      rate_nok: ($rate | tonumber),
      mva_rate: ($mva_rate | tonumber),
      business_type: $business_type,
      invoiced: false,
      paid: false
    }')

  local result
  result=$(insert_entry "$json")

  if echo "$result" | jq -e '.[0].id' >/dev/null 2>&1; then
    echo "✅ Added entry: $hours hours @ $rate kr/h = $subtotal kr (+ MVA = $total kr)"
    echo "$result" | jq '.[0] | {id, date, source, hours, rate_nok, total_nok}'
  else
    echo "❌ Failed to add entry" >&2
    echo "$result" >&2
    exit 1
  fi
}

function cmd_stats() {
  local month="" source=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --month) month="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [[ -z "$month" ]]; then
    echo "Error: --month required (format: YYYY-MM)" >&2
    exit 1
  fi

  # Calculate next month
  local year month_num next_year next_month
  year="${month%-*}"
  month_num="${month#*-}"
  if [[ "$month_num" == "12" ]]; then
    next_year=$((year + 1))
    next_month="01"
  else
    next_year="$year"
    next_month=$(printf "%02d" $((10#$month_num + 1)))
  fi
  local filter="date=gte.$month-01&date=lt.$next_year-$next_month-01"
  if [[ -n "$source" ]]; then
    filter="$filter&source=eq.$source"
  fi

  local entries
  entries=$(get_entries "$filter")

  if [[ "$(echo "$entries" | jq length)" -eq 0 ]]; then
    echo "No entries found for $month"
    exit 0
  fi

  local total_hours total_ex_mva total_mva total_with_mva invoiced paid
  total_hours=$(echo "$entries" | jq '[.[].hours] | add')
  total_ex_mva=$(echo "$entries" | jq '[.[].subtotal_nok] | add')
  total_with_mva=$(echo "$entries" | jq '[.[].total_nok] | add')
  total_mva=$(awk "BEGIN {print $total_with_mva - $total_ex_mva}")
  invoiced=$(echo "$entries" | jq '[.[] | select(.invoiced == true) | .total_nok] | add // 0')
  paid=$(echo "$entries" | jq '[.[] | select(.paid == true) | .total_nok] | add // 0')

  echo "📊 Finance Stats - $month"
  [[ -n "$source" ]] && echo "   Source: $source"
  echo ""
  echo "   Hours:          ${total_hours}t"
  echo "   Ex-MVA:         ${total_ex_mva} kr"
  echo "   MVA (25%):      ${total_mva} kr"
  echo "   Total:          ${total_with_mva} kr"
  echo ""
  echo "   Invoiced:       ${invoiced} kr"
  echo "   Paid:           ${paid} kr"
  echo "   Pending:        $(awk "BEGIN {print $total_with_mva - $paid}") kr"
}

function cmd_invoice() {
  local month="" source=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --month) month="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [[ -z "$month" ]]; then
    echo "Error: --month required (format: YYYY-MM)" >&2
    exit 1
  fi

  # Calculate next month
  local year month_num next_year next_month
  year="${month%-*}"
  month_num="${month#*-}"
  if [[ "$month_num" == "12" ]]; then
    next_year=$((year + 1))
    next_month="01"
  else
    next_year="$year"
    next_month=$(printf "%02d" $((10#$month_num + 1)))
  fi
  local filter="date=gte.$month-01&date=lt.$next_year-$next_month-01"
  if [[ -n "$source" ]]; then
    filter="$filter&source=eq.$source"
  fi

  local entries
  entries=$(get_entries "$filter")

  if [[ "$(echo "$entries" | jq length)" -eq 0 ]]; then
    echo "No entries found for $month"
    exit 0
  fi

  # Group by day/night
  local day_entries night_entries
  day_entries=$(echo "$entries" | jq '[.[] | select(.business_type == "day")]')
  night_entries=$(echo "$entries" | jq '[.[] | select(.business_type == "night")]')

  # Format month label (e.g., "February 2026")
  local year month_num month_label
  year="${month%-*}"
  month_num="${month#*-}"
  case "$month_num" in
    01) month_label="januar $year" ;;
    02) month_label="februar $year" ;;
    03) month_label="mars $year" ;;
    04) month_label="april $year" ;;
    05) month_label="mai $year" ;;
    06) month_label="juni $year" ;;
    07) month_label="juli $year" ;;
    08) month_label="august $year" ;;
    09) month_label="september $year" ;;
    10) month_label="oktober $year" ;;
    11) month_label="november $year" ;;
    12) month_label="desember $year" ;;
  esac

  echo "Faktura — ${source:-All Workplaces}"
  echo "Periode: $month_label"
  echo ""
  echo "---"
  echo ""

  # Individual entries
  echo "$entries" | jq -r '.[] | "\(.date) — \(.hours)t × \(.rate_nok) kr/t = \((.hours * .rate_nok) | floor) kr"'

  echo ""
  echo "---"
  echo ""

  # Summary by rate
  if [[ "$(echo "$day_entries" | jq length)" -gt 0 ]]; then
    local day_hours day_rate day_total
    day_hours=$(echo "$day_entries" | jq '[.[].hours] | add')
    day_rate=$(echo "$day_entries" | jq '.[0].rate_nok')
    day_total=$(awk "BEGIN {print $day_hours * $day_rate}")
    echo "Dagtimer: ${day_hours}t × ${day_rate} kr/t = ${day_total} kr"
  fi

  if [[ "$(echo "$night_entries" | jq length)" -gt 0 ]]; then
    local night_hours night_rate night_total
    night_hours=$(echo "$night_entries" | jq '[.[].hours] | add')
    night_rate=$(echo "$night_entries" | jq '.[0].rate_nok')
    night_total=$(awk "BEGIN {print $night_hours * $night_rate}")
    echo "Nattimer: ${night_hours}t × ${night_rate} kr/t = ${night_total} kr"
  fi

  echo ""
  local total_hours total_ex_mva total_mva total_with_mva
  total_hours=$(echo "$entries" | jq '[.[].hours] | add')
  total_ex_mva=$(echo "$entries" | jq '[.[].subtotal_nok] | add')
  total_with_mva=$(echo "$entries" | jq '[.[].total_nok] | add')
  total_mva=$(awk "BEGIN {print $total_with_mva - $total_ex_mva}")

  echo "Timer totalt: ${total_hours}t"
  echo "Sum eks. MVA: ${total_ex_mva} kr"
  echo "MVA (25%): ${total_mva} kr"
  echo "Totalbeløp: ${total_with_mva} kr"
}

function cmd_list() {
  local month="" source=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --month) month="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [[ -z "$month" ]]; then
    echo "Error: --month required (format: YYYY-MM)" >&2
    exit 1
  fi

  # Calculate next month
  local year month_num next_year next_month
  year="${month%-*}"
  month_num="${month#*-}"
  if [[ "$month_num" == "12" ]]; then
    next_year=$((year + 1))
    next_month="01"
  else
    next_year="$year"
    next_month=$(printf "%02d" $((10#$month_num + 1)))
  fi
  local filter="date=gte.$month-01&date=lt.$next_year-$next_month-01"
  if [[ -n "$source" ]]; then
    filter="$filter&source=eq.$source"
  fi

  local entries
  entries=$(get_entries "$filter")

  echo "$entries" | jq -r '.[] | "\(.date) | \(.source) | \(.hours)t @ \(.rate_nok) kr/t | \(if .paid then "Paid" elif .invoiced then "Invoiced" else "Pending" end) | \(.description // "—")"'
}

function cmd_mark_invoiced() {
  local month="" source=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --month) month="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [[ -z "$month" ]]; then
    echo "Error: --month required (format: YYYY-MM)" >&2
    exit 1
  fi

  # Calculate next month
  local year month_num next_year next_month
  year="${month%-*}"
  month_num="${month#*-}"
  if [[ "$month_num" == "12" ]]; then
    next_year=$((year + 1))
    next_month="01"
  else
    next_year="$year"
    next_month=$(printf "%02d" $((10#$month_num + 1)))
  fi
  local filter="date=gte.$month-01&date=lt.$next_year-$next_month-01&invoiced=eq.false"
  if [[ -n "$source" ]]; then
    filter="$filter&source=eq.$source"
  fi

  local now
  now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  update_entries "$filter" "{\"invoiced\": true, \"invoiced_at\": \"$now\"}"
  echo "✅ Marked all entries as invoiced for $month"
}

function cmd_mark_paid() {
  local month="" source=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --month) month="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [[ -z "$month" ]]; then
    echo "Error: --month required (format: YYYY-MM)" >&2
    exit 1
  fi

  # Calculate next month
  local year month_num next_year next_month
  year="${month%-*}"
  month_num="${month#*-}"
  if [[ "$month_num" == "12" ]]; then
    next_year=$((year + 1))
    next_month="01"
  else
    next_year="$year"
    next_month=$(printf "%02d" $((10#$month_num + 1)))
  fi
  local filter="date=gte.$month-01&date=lt.$next_year-$next_month-01&paid=eq.false"
  if [[ -n "$source" ]]; then
    filter="$filter&source=eq.$source"
  fi

  local now
  now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  update_entries "$filter" "{\"paid\": true, \"paid_at\": \"$now\"}"
  echo "✅ Marked all entries as paid for $month"
}

case "$cmd" in
  add) cmd_add "$@" ;;
  stats) cmd_stats "$@" ;;
  invoice) cmd_invoice "$@" ;;
  list) cmd_list "$@" ;;
  mark-invoiced) cmd_mark_invoiced "$@" ;;
  mark-paid) cmd_mark_paid "$@" ;;
  help|--help|-h) show_help ;;
  *) echo "Unknown command: $cmd" >&2; show_help; exit 1 ;;
esac
