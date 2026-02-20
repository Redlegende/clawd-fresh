#!/usr/bin/env bash
set -euo pipefail

# Observatory Finance Management Script
# Single source of truth for hour tracking, earnings, and invoices
# Includes duplicate prevention and edge case handling

SUPABASE_URL="${SUPABASE_URL:-https://vhrmxtolrrcrhrxljemp.supabase.co}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"

if [[ -z "$SUPABASE_SERVICE_KEY" ]]; then
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
  local shift_type="$2"

  case "$source" in
    "Fåvang Varetaxi"|"Favang Varetaxi")
      [[ "$shift_type" == "night" ]] && echo "400" || echo "300"
      ;;
    "Treffen")
      echo "400"
      ;;
    "Kvitfjellhytter")
      echo "0"
      ;;
    *)
      echo "300"
      ;;
  esac
}

# Normalize source names to prevent mismatches
function normalize_source() {
  local src="$1"
  case "$src" in
    "Favang Varetaxi"|"favang varetaxi"|"fåvang varetaxi"|"Fåvang varetaxi"|"faavang varetaxi")
      echo "Favang Varetaxi"
      ;;
    "treffen"|"Treffen"|"TREFFEN")
      echo "Treffen"
      ;;
    "kvitfjellhytter"|"Kvitfjellhytter"|"KVITFJELLHYTTER")
      echo "Kvitfjellhytter"
      ;;
    *)
      echo "$src"
      ;;
  esac
}

cmd="${1:-help}"
shift || true

function show_help() {
  cat <<EOF
Observatory Finance Management

USAGE:
  finance.sh add --date DATE --source SOURCE --hours HOURS --shift SHIFT [--start HH:MM] [--end HH:MM] [--description DESC] [--force]
  finance.sh update --date DATE --source SOURCE --shift SHIFT [--hours HOURS] [--start HH:MM] [--end HH:MM] [--description DESC]
  finance.sh delete --id ID
  finance.sh stats --month YYYY-MM [--source SOURCE]
  finance.sh invoice --month YYYY-MM [--source SOURCE]
  finance.sh list --month YYYY-MM [--source SOURCE] [--status pending|invoiced|paid]
  finance.sh summary --month YYYY-MM
  finance.sh mark-invoiced --month YYYY-MM [--source SOURCE]
  finance.sh mark-paid --month YYYY-MM [--source SOURCE]
  finance.sh check-duplicates --month YYYY-MM

COMMANDS:
  add               Add hour entry (with duplicate prevention)
  update            Update existing entry by date+source+shift
  delete            Delete entry by ID
  stats             Show monthly statistics
  invoice           Generate invoice text (for accounting software)
  list              List entries for a month
  summary           Breakdown by workplace
  mark-invoiced     Mark all entries as invoiced
  mark-paid         Mark all entries as paid
  check-duplicates  Find potential duplicate entries

OPTIONS:
  --date DATE           Date in YYYY-MM-DD format
  --source SOURCE       Favang Varetaxi | Treffen | Kvitfjellhytter | Other
  --hours HOURS         Hours worked (decimal, e.g., 8.5)
  --shift SHIFT         day | night
  --start HH:MM        Start time (e.g., 12:00)
  --end HH:MM          End time (e.g., 18:00)
  --description DESC    Optional description
  --month YYYY-MM       Month filter (e.g., 2026-02)
  --status STATUS       Filter: pending | invoiced | paid
  --force               Skip duplicate check and insert anyway
  --id ID               Entry UUID (for delete/update by ID)

DUPLICATE PREVENTION:
  By default, 'add' checks for an existing entry with the same date + source + shift.
  - Same date + source + shift (day/night) = BLOCKED (use 'update' or --force)
  - Same date + source but different shift (day vs night) = ALLOWED
  - Same date + different source = ALLOWED

EXAMPLES:
  # Add day shift (auto-checks for duplicates)
  finance.sh add --date 2026-02-14 --source "Favang Varetaxi" --hours 8.5 --shift day --start 10:00 --end 18:30

  # Add night shift same day (allowed — different shift type)
  finance.sh add --date 2026-02-14 --source "Favang Varetaxi" --hours 3.5 --shift night --start 22:00 --end 01:30

  # Update hours for existing entry
  finance.sh update --date 2026-02-14 --source "Favang Varetaxi" --shift day --hours 9.0

  # Check for duplicates in February
  finance.sh check-duplicates --month 2026-02
EOF
}

function api_get() {
  local filter="$1"
  curl -s -X GET "$SUPABASE_URL/rest/v1/finance_entries?$filter&order=date.asc" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"
}

function api_insert() {
  local json="$1"
  curl -s -X POST "$SUPABASE_URL/rest/v1/finance_entries" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$json"
}

function api_update() {
  local filter="$1"
  local json="$2"
  curl -s -X PATCH "$SUPABASE_URL/rest/v1/finance_entries?$filter" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$json"
}

function api_delete() {
  local filter="$1"
  curl -s -X DELETE "$SUPABASE_URL/rest/v1/finance_entries?$filter" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Prefer: return=representation"
}

function month_filter() {
  local month="$1"
  local year="${month%-*}"
  local month_num="${month#*-}"
  local next_year next_month
  if [[ "$month_num" == "12" ]]; then
    next_year=$((year + 1))
    next_month="01"
  else
    next_year="$year"
    next_month=$(printf "%02d" $((10#$month_num + 1)))
  fi
  echo "date=gte.$month-01&date=lt.$next_year-$next_month-01"
}

# ───────────────────── ADD ─────────────────────
function cmd_add() {
  local date="" source="" hours="" shift_type="" description="" start_time="" end_time="" force=false

  while [[ $# -gt 0 ]]; do
    case $1 in
      --date) date="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      --hours) hours="$2"; shift 2 ;;
      --shift) shift_type="$2"; shift 2 ;;
      --type) shift_type="$2"; shift 2 ;;  # alias for --shift
      --description) description="$2"; shift 2 ;;
      --start) start_time="$2"; shift 2 ;;
      --end) end_time="$2"; shift 2 ;;
      --force) force=true; shift ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [[ -z "$date" || -z "$source" || -z "$hours" || -z "$shift_type" ]]; then
    echo "Error: --date, --source, --hours, and --shift are required" >&2
    exit 1
  fi

  source=$(normalize_source "$source")

  # ── Duplicate check ──
  if [[ "$force" == false ]]; then
    local existing
    existing=$(api_get "date=eq.$date&source=eq.$source&business_type=eq.$shift_type")
    local count
    count=$(echo "$existing" | jq 'length')

    if [[ "$count" -gt 0 ]]; then
      local existing_id existing_hours
      existing_id=$(echo "$existing" | jq -r '.[0].id')
      existing_hours=$(echo "$existing" | jq '.[0].hours')
      echo "📝 Entry already exists for $date / $source / $shift_type (${existing_hours}h). Updating to ${hours}h..." >&2

      # Auto-update the existing entry
      local update_json="{}"
      update_json=$(echo "$update_json" | jq --arg h "$hours" '. + {hours: ($h | tonumber)}')
      [[ -n "$start_time" ]] && update_json=$(echo "$update_json" | jq --arg s "$start_time" '. + {start_time: $s}')
      [[ -n "$end_time" ]] && update_json=$(echo "$update_json" | jq --arg e "$end_time" '. + {end_time: $e}')
      [[ -n "$description" ]] && update_json=$(echo "$update_json" | jq --arg d "$description" '. + {description: $d}')

      local update_result
      update_result=$(api_update "id=eq.$existing_id" "$update_json")

      if echo "$update_result" | jq -e '.[0].id' >/dev/null 2>&1; then
        local rate subtotal total
        rate=$(get_rate "$source" "$shift_type")
        subtotal=$(awk "BEGIN {print $hours * $rate}")
        total=$(awk "BEGIN {print $subtotal * $MVA_RATE}")
        echo "✅ Updated: $date | $source | ${shift_type} | ${hours}h @ ${rate} kr/h = ${subtotal} kr (+ MVA = ${total} kr)"
      else
        echo "❌ Failed to update existing entry" >&2
        echo "$update_result" >&2
        exit 1
      fi
      exit 0
    fi
  fi

  local rate
  rate=$(get_rate "$source" "$shift_type")

  local json
  json=$(jq -n \
    --arg date "$date" \
    --arg source "$source" \
    --arg description "$description" \
    --arg hours "$hours" \
    --arg rate "$rate" \
    --arg mva_rate "$MVA_RATE" \
    --arg business_type "$shift_type" \
    --arg start "$start_time" \
    --arg end "$end_time" \
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
    }
    + (if $start != "" then {start_time: $start} else {} end)
    + (if $end != "" then {end_time: $end} else {} end)')

  local result
  result=$(api_insert "$json")

  if echo "$result" | jq -e '.[0].id' >/dev/null 2>&1; then
    local subtotal total
    subtotal=$(awk "BEGIN {print $hours * $rate}")
    total=$(awk "BEGIN {print $subtotal * $MVA_RATE}")
    echo "✅ Added: $date | $source | ${shift_type} | ${hours}h @ ${rate} kr/h = ${subtotal} kr (+ MVA = ${total} kr)"
  else
    echo "❌ Failed to add entry" >&2
    echo "$result" >&2
    exit 1
  fi
}

# ───────────────────── UPDATE ─────────────────────
function cmd_update() {
  local date="" source="" shift_type="" hours="" start_time="" end_time="" description="" id=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --date) date="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      --shift) shift_type="$2"; shift 2 ;;
      --type) shift_type="$2"; shift 2 ;;
      --hours) hours="$2"; shift 2 ;;
      --start) start_time="$2"; shift 2 ;;
      --end) end_time="$2"; shift 2 ;;
      --description) description="$2"; shift 2 ;;
      --id) id="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  local filter=""
  if [[ -n "$id" ]]; then
    filter="id=eq.$id"
  elif [[ -n "$date" && -n "$source" && -n "$shift_type" ]]; then
    source=$(normalize_source "$source")
    filter="date=eq.$date&source=eq.$source&business_type=eq.$shift_type"
  else
    echo "Error: Either --id, or --date + --source + --shift required" >&2
    exit 1
  fi

  # Verify entry exists
  local existing
  existing=$(api_get "$filter")
  if [[ "$(echo "$existing" | jq 'length')" -eq 0 ]]; then
    echo "❌ No entry found matching that filter" >&2
    exit 1
  fi

  # Build update payload — only include fields that were provided
  local json="{}"
  [[ -n "$hours" ]] && json=$(echo "$json" | jq --arg h "$hours" '. + {hours: ($h | tonumber)}')
  [[ -n "$start_time" ]] && json=$(echo "$json" | jq --arg s "$start_time" '. + {start_time: $s}')
  [[ -n "$end_time" ]] && json=$(echo "$json" | jq --arg e "$end_time" '. + {end_time: $e}')
  [[ -n "$description" ]] && json=$(echo "$json" | jq --arg d "$description" '. + {description: $d}')

  if [[ "$json" == "{}" ]]; then
    echo "Nothing to update — provide at least one field (--hours, --start, --end, --description)" >&2
    exit 1
  fi

  local result
  result=$(api_update "$filter" "$json")

  if echo "$result" | jq -e '.[0].id' >/dev/null 2>&1; then
    echo "✅ Updated entry:"
    echo "$result" | jq '.[0] | {id, date, source, hours, start_time, end_time, business_type}'
  else
    echo "❌ Failed to update" >&2
    echo "$result" >&2
    exit 1
  fi
}

# ───────────────────── DELETE ─────────────────────
function cmd_delete() {
  local id=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --id) id="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [[ -z "$id" ]]; then
    echo "Error: --id required" >&2
    exit 1
  fi

  local result
  result=$(api_delete "id=eq.$id")

  if echo "$result" | jq -e '.[0].id' >/dev/null 2>&1; then
    echo "✅ Deleted entry: $id"
  else
    echo "❌ Entry not found or delete failed" >&2
    echo "$result" >&2
    exit 1
  fi
}

# ───────────────────── CHECK DUPLICATES ─────────────────────
function cmd_check_duplicates() {
  local month=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --month) month="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [[ -z "$month" ]]; then
    month=$(date +%Y-%m)
  fi

  local filter
  filter=$(month_filter "$month")
  local entries
  entries=$(api_get "$filter")

  local dupes
  dupes=$(echo "$entries" | jq '
    group_by(.date, .source, .business_type) |
    map(select(length > 1)) |
    .[] |
    {
      date: .[0].date,
      source: .[0].source,
      shift: .[0].business_type,
      count: length,
      entries: [.[] | {id, hours, start_time, end_time, created_at}]
    }
  ')

  if [[ "$(echo "$dupes" | jq -s 'length')" -eq 0 ]] || [[ -z "$dupes" ]]; then
    echo "✅ No duplicates found for $month"
  else
    echo "⚠️  Duplicates found for $month:"
    echo "$dupes" | jq -s '.'
  fi
}

# ───────────────────── STATS ─────────────────────
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
    month=$(date +%Y-%m)
  fi

  local filter
  filter=$(month_filter "$month")
  [[ -n "$source" ]] && filter="$filter&source=eq.$(normalize_source "$source")"

  local entries
  entries=$(api_get "$filter")

  if [[ "$(echo "$entries" | jq length)" -eq 0 ]]; then
    echo "No entries found for $month"
    exit 0
  fi

  local total_hours total_ex_mva total_with_mva total_mva invoiced paid
  total_hours=$(echo "$entries" | jq '[.[].hours] | add')
  total_ex_mva=$(echo "$entries" | jq '[.[].subtotal_nok] | add')
  total_with_mva=$(echo "$entries" | jq '[.[].total_nok] | add')
  total_mva=$(awk "BEGIN {printf \"%.2f\", $total_with_mva - $total_ex_mva}")
  invoiced=$(echo "$entries" | jq '[.[] | select(.invoiced == true) | .total_nok] | add // 0')
  paid=$(echo "$entries" | jq '[.[] | select(.paid == true) | .total_nok] | add // 0')

  echo "📊 Finance Stats — $month"
  [[ -n "$source" ]] && echo "   Source: $source"
  echo ""
  echo "   Hours:          ${total_hours}t"
  echo "   Ex-MVA:         ${total_ex_mva} kr"
  echo "   MVA (25%):      ${total_mva} kr"
  echo "   Total:          ${total_with_mva} kr"
  echo ""
  echo "   Invoiced:       ${invoiced} kr"
  echo "   Paid:           ${paid} kr"
  echo "   Pending:        $(awk "BEGIN {printf \"%.2f\", $total_with_mva - $paid}") kr"
}

# ───────────────────── SUMMARY ─────────────────────
function cmd_summary() {
  local month=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --month) month="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [[ -z "$month" ]]; then
    month=$(date +%Y-%m)
  fi

  local filter
  filter=$(month_filter "$month")
  local entries
  entries=$(api_get "$filter")

  if [[ "$(echo "$entries" | jq length)" -eq 0 ]]; then
    echo "No entries found for $month"
    exit 0
  fi

  echo "📊 Summary — $month"
  echo ""
  echo "$entries" | jq -r '
    group_by(.source) |
    .[] |
    {
      source: .[0].source,
      hours: ([.[].hours] | add),
      ex_mva: ([.[].subtotal_nok] | add),
      with_mva: ([.[].total_nok] | add),
      count: length
    } |
    "  \(.source):\n    Entries: \(.count) | Hours: \(.hours)t\n    Ex-MVA: \(.ex_mva) kr | Total: \(.with_mva) kr\n"
  '
}

# ───────────────────── LIST ─────────────────────
function cmd_list() {
  local month="" source="" status=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --month) month="$2"; shift 2 ;;
      --source) source="$2"; shift 2 ;;
      --status) status="$2"; shift 2 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  if [[ -z "$month" ]]; then
    month=$(date +%Y-%m)
  fi

  local filter
  filter=$(month_filter "$month")
  [[ -n "$source" ]] && filter="$filter&source=eq.$(normalize_source "$source")"
  case "$status" in
    pending) filter="$filter&invoiced=eq.false&paid=eq.false" ;;
    invoiced) filter="$filter&invoiced=eq.true&paid=eq.false" ;;
    paid) filter="$filter&paid=eq.true" ;;
  esac

  local entries
  entries=$(api_get "$filter")

  echo "$entries" | jq -r '.[] |
    "\(.date) | \(.source) | \(.business_type // "day") | \(.hours)h @ \(.rate_nok) kr | \(.total_nok) kr | \(if .paid then "PAID" elif .invoiced then "INVOICED" else "PENDING" end) | \(.description // "—")"'
}

# ───────────────────── INVOICE ─────────────────────
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

  local filter
  filter=$(month_filter "$month")
  [[ -n "$source" ]] && filter="$filter&source=eq.$(normalize_source "$source")"

  local entries
  entries=$(api_get "$filter")

  if [[ "$(echo "$entries" | jq length)" -eq 0 ]]; then
    echo "No entries found for $month"
    exit 0
  fi

  # Norwegian month label
  local year="${month%-*}" month_num="${month#*-}" month_label
  case "$month_num" in
    01) month_label="januar $year" ;; 02) month_label="februar $year" ;;
    03) month_label="mars $year" ;; 04) month_label="april $year" ;;
    05) month_label="mai $year" ;; 06) month_label="juni $year" ;;
    07) month_label="juli $year" ;; 08) month_label="august $year" ;;
    09) month_label="september $year" ;; 10) month_label="oktober $year" ;;
    11) month_label="november $year" ;; 12) month_label="desember $year" ;;
  esac

  echo "Faktura — ${source:-Alle arbeidsplasser}"
  echo "Periode: $month_label"
  echo ""
  echo "---"
  echo ""

  # Individual entries with times
  echo "$entries" | jq -r '.[] |
    "\(.date) \(if .start_time and .end_time then "(\(.start_time[0:5])–\(.end_time[0:5])) " else "" end)— \(.hours)t × \(.rate_nok) kr/t = \((.hours * .rate_nok) | floor) kr"'

  echo ""
  echo "---"
  echo ""

  # Group by rate
  local day_entries night_entries
  day_entries=$(echo "$entries" | jq '[.[] | select(.business_type == "day" or .business_type == null)]')
  night_entries=$(echo "$entries" | jq '[.[] | select(.business_type == "night")]')

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
  local total_hours total_ex_mva total_with_mva total_mva
  total_hours=$(echo "$entries" | jq '[.[].hours] | add')
  total_ex_mva=$(echo "$entries" | jq '[.[].subtotal_nok] | add')
  total_with_mva=$(echo "$entries" | jq '[.[].total_nok] | add')
  total_mva=$(awk "BEGIN {printf \"%.2f\", $total_with_mva - $total_ex_mva}")

  echo "Timer totalt: ${total_hours}t"
  echo "Sum eks. MVA: ${total_ex_mva} kr"
  echo "MVA (25%): ${total_mva} kr"
  echo "Totalbeløp: ${total_with_mva} kr"
}

# ───────────────────── MARK INVOICED ─────────────────────
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
    echo "Error: --month required" >&2; exit 1
  fi

  local filter
  filter="$(month_filter "$month")&invoiced=eq.false"
  [[ -n "$source" ]] && filter="$filter&source=eq.$(normalize_source "$source")"

  local now
  now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  local result
  result=$(api_update "$filter" "{\"invoiced\": true, \"invoiced_at\": \"$now\"}")
  local count
  count=$(echo "$result" | jq 'length')
  echo "✅ Marked $count entries as invoiced for $month"
}

# ───────────────────── MARK PAID ─────────────────────
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
    echo "Error: --month required" >&2; exit 1
  fi

  local filter
  filter="$(month_filter "$month")&paid=eq.false"
  [[ -n "$source" ]] && filter="$filter&source=eq.$(normalize_source "$source")"

  local now
  now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  local result
  result=$(api_update "$filter" "{\"paid\": true, \"paid_at\": \"$now\"}")
  local count
  count=$(echo "$result" | jq 'length')
  echo "✅ Marked $count entries as paid for $month"
}

# ───────────────────── DISPATCH ─────────────────────
case "$cmd" in
  add) cmd_add "$@" ;;
  update) cmd_update "$@" ;;
  delete) cmd_delete "$@" ;;
  stats) cmd_stats "$@" ;;
  summary) cmd_summary "$@" ;;
  invoice) cmd_invoice "$@" ;;
  list) cmd_list "$@" ;;
  mark-invoiced) cmd_mark_invoiced "$@" ;;
  mark-paid) cmd_mark_paid "$@" ;;
  check-duplicates) cmd_check_duplicates "$@" ;;
  help|--help|-h) show_help ;;
  *) echo "Unknown command: $cmd" >&2; show_help; exit 1 ;;
esac
