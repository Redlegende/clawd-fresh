#!/bin/bash
# Add a finance entry to Supabase
# Usage: bash finance-add.sh --date 2026-02-14 --source "Fåvang Varetaxi" --hours 8.5 --rate 300 --type day --start "10:00" --end "18:30" --description "Dagkjøring"

SUPABASE_URL="https://vhrmxtolrrcrhrxljemp.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzQwMDQsImV4cCI6MjA4NTU1MDAwNH0.EHAElJqyoSNzq7sk6HqOGiGEYJhBAKCLbQigr7ymWPw"

DATE=""
SOURCE=""
HOURS=""
RATE=""
TYPE="day"
START=""
END=""
DESC=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --date) DATE="$2"; shift 2;;
    --source) SOURCE="$2"; shift 2;;
    --hours) HOURS="$2"; shift 2;;
    --rate) RATE="$2"; shift 2;;
    --type) TYPE="$2"; shift 2;;
    --start) START="$2"; shift 2;;
    --end) END="$2"; shift 2;;
    --description) DESC="$2"; shift 2;;
    *) shift;;
  esac
done

if [ -z "$DATE" ] || [ -z "$SOURCE" ] || [ -z "$HOURS" ] || [ -z "$RATE" ]; then
  echo "ERROR: --date, --source, --hours, and --rate are required"
  exit 1
fi

SUBTOTAL=$(python3 -c "print(${HOURS} * ${RATE})")
TOTAL=$(python3 -c "print(${HOURS} * ${RATE} * 1.25)")

# Build JSON
JSON=$(python3 -c "
import json
entry = {
    'date': '${DATE}',
    'source': '${SOURCE}',
    'hours': ${HOURS},
    'rate_nok': ${RATE},
    'mva_rate': 1.25,
    'subtotal_nok': ${SUBTOTAL},
    'total_nok': ${TOTAL},
    'business_type': '${TYPE}',
}
if '${START}': entry['start_time'] = '${START}'
if '${END}': entry['end_time'] = '${END}'
if '${DESC}': entry['description'] = '${DESC}'
print(json.dumps(entry))
")

RESPONSE=$(python3 -c "
import urllib.request, json
url = '${SUPABASE_URL}/rest/v1/finance_entries'
data = json.dumps(${JSON}).encode()
req = urllib.request.Request(url, data=data, method='POST', headers={
    'apikey': '${SUPABASE_KEY}',
    'Authorization': 'Bearer ${SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
})
try:
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read())
    print(json.dumps(result, indent=2))
except urllib.error.HTTPError as e:
    print(f'ERROR: {e.code} - {e.read().decode()}')
")

echo "$RESPONSE"
echo ""
echo "Added: ${DATE} | ${SOURCE} | ${HOURS}h @ ${RATE} kr/h | Subtotal: ${SUBTOTAL} kr | Total (med MVA): ${TOTAL} kr"
