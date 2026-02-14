#!/bin/bash
# Query finance entries from Supabase
# Usage: bash finance-query.sh --month 2026-02 [--source "Fåvang Varetaxi"]

SUPABASE_URL="https://vhrmxtolrrcrhrxljemp.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzQwMDQsImV4cCI6MjA4NTU1MDAwNH0.EHAElJqyoSNzq7sk6HqOGiGEYJhBAKCLbQigr7ymWPw"

MONTH=""
SOURCE=""
ALL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --month) MONTH="$2"; shift 2;;
    --source) SOURCE="$2"; shift 2;;
    --all) ALL=true; shift;;
    *) shift;;
  esac
done

python3 -c "
import urllib.request, json, urllib.parse

url = '${SUPABASE_URL}/rest/v1/finance_entries?order=date.desc&select=*'
month = '${MONTH}'
source = '${SOURCE}'
show_all = ${ALL}

if month and not show_all:
    # Filter by month using gte/lt
    year, m = month.split('-')
    start = f'{year}-{m}-01'
    next_m = int(m) + 1
    next_y = int(year)
    if next_m > 12:
        next_m = 1
        next_y += 1
    end = f'{next_y}-{str(next_m).zfill(2)}-01'
    url += f'&date=gte.{start}&date=lt.{end}'

if source:
    url += f'&source=eq.{urllib.parse.quote(source)}'

req = urllib.request.Request(url, headers={
    'apikey': '${SUPABASE_KEY}',
    'Authorization': 'Bearer ${SUPABASE_KEY}',
})
resp = urllib.request.urlopen(req)
entries = json.loads(resp.read())

if not entries:
    print('No entries found.')
    exit()

total_hours = 0
total_ex_mva = 0
total_with_mva = 0
day_hours = 0
night_hours = 0
day_earnings = 0
night_earnings = 0
invoiced_count = 0
paid_count = 0

print(f'{"Date":<12} {"Source":<18} {"Hours":>6} {"Rate":>6} {"Ex-MVA":>10} {"Total":>10} {"Status":<10}')
print('-' * 80)

for e in entries:
    hours = float(e.get('hours', 0))
    sub = float(e.get('subtotal_nok', 0))
    total = float(e.get('total_nok', 0))
    rate = float(e.get('rate_nok', 0))
    status = 'Paid' if e.get('paid') else ('Invoiced' if e.get('invoiced') else 'Pending')

    total_hours += hours
    total_ex_mva += sub
    total_with_mva += total

    if rate >= 400:
        night_hours += hours
        night_earnings += sub
    else:
        day_hours += hours
        day_earnings += sub

    if e.get('invoiced'): invoiced_count += 1
    if e.get('paid'): paid_count += 1

    time_str = ''
    if e.get('start_time') and e.get('end_time'):
        time_str = f\" ({e['start_time'][:5]}-{e['end_time'][:5]})\"

    print(f\"{e['date']:<12} {e['source']:<18} {hours:>5.1f}h {rate:>5.0f}kr {sub:>9,.0f}kr {total:>9,.0f}kr {status:<10}{time_str}\")

print('-' * 80)
print(f'Total: {total_hours:.1f}h | Ex-MVA: {total_ex_mva:,.0f} kr | MVA: {total_with_mva - total_ex_mva:,.0f} kr | Total: {total_with_mva:,.0f} kr')
print(f'Day: {day_hours:.1f}h ({day_earnings:,.0f} kr) | Night: {night_hours:.1f}h ({night_earnings:,.0f} kr)')
print(f'Status: {paid_count} paid, {invoiced_count} invoiced, {len(entries) - invoiced_count - paid_count} pending')
"
