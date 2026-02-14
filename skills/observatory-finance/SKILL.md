---
name: observatory-finance
description: Manage Observatory finance tracking - add hour entries, check earnings, generate invoice text for accounting software. Use when Jakob asks to add hours worked, check monthly totals, or prepare invoices.
metadata: {"clawdbot":{"requires":{"env":["SUPABASE_URL","SUPABASE_SERVICE_KEY"]}}}
---

# Observatory Finance Management

Track hours worked, calculate earnings with MVA, and generate invoice text for Jakob's accounting software.

## Quick Commands

```bash
# Add hours worked
{baseDir}/scripts/finance.sh add \
  --date "2026-02-14" \
  --source "Fåvang Varetaxi" \
  --hours 8.5 \
  --shift day \
  --description "Hospital route"

# Check monthly earnings
{baseDir}/scripts/finance.sh stats --month "2026-02"

# Generate invoice text (ready for accounting software)
{baseDir}/scripts/finance.sh invoice --month "2026-02" --source "Fåvang Varetaxi"

# List entries for a month
{baseDir}/scripts/finance.sh list --month "2026-02"

# Mark entries as invoiced
{baseDir}/scripts/finance.sh mark-invoiced --month "2026-02" --source "Fåvang Varetaxi"

# Mark entries as paid
{baseDir}/scripts/finance.sh mark-paid --month "2026-02" --source "Fåvang Varetaxi"
```

## Parameters

### --source (workplace)
- `Fåvang Varetaxi` - Taxi driving (day: 300 kr/h, night: 400 kr/h)
- `Treffen` - Restaurant (400 kr/h all shifts)
- `Kvitfjellhytter` - Cabin management
- `Other` - Other work

### --shift (time of day)
- `day` - Before 22:00 (uses day rate)
- `night` - After 22:00 (uses night rate)

### Rates (auto-applied with 25% MVA)
- Fåvang day: 300 kr/h → 375 kr/h with MVA
- Fåvang night: 400 kr/h → 500 kr/h with MVA
- Treffen: 400 kr/h → 500 kr/h with MVA

## Examples

**Add day shift:**
```bash
{baseDir}/scripts/finance.sh add \
  --date "2026-02-14" \
  --source "Fåvang Varetaxi" \
  --hours 8.5 \
  --shift day \
  --description "Dagkjøring"
```

**Add night shift:**
```bash
{baseDir}/scripts/finance.sh add \
  --date "2026-02-14" \
  --source "Fåvang Varetaxi" \
  --hours 3.5 \
  --shift night \
  --description "Kveldskjøring"
```

**Check January 2026 total:**
```bash
{baseDir}/scripts/finance.sh stats --month "2026-01"
# Shows: hours, ex-MVA, MVA owed, total, invoiced, paid
```

**Generate invoice for Fåvang (February):**
```bash
{baseDir}/scripts/finance.sh invoice --month "2026-02" --source "Fåvang Varetaxi"
# Returns formatted text ready for accounting software
```

## Invoice Format

The generated invoice text includes:
- Individual entries with date, time range, hours × rate
- Summary by day/night rates
- Total hours, ex-MVA, MVA (25%), and total with MVA
- Ready to paste into accounting software

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| SUPABASE_URL | Yes | Observatory project URL |
| SUPABASE_SERVICE_KEY | Yes | Service role key (full access) |

## Database Table

**finance_entries:**
- id (uuid)
- date (date)
- source (text) - workplace name
- description (text)
- hours (numeric)
- rate_nok (numeric)
- mva_rate (numeric) - 1.25 for 25% MVA
- subtotal_nok (numeric) - hours × rate
- total_nok (numeric) - subtotal × mva_rate
- business_type (text) - 'day' or 'night'
- start_time, end_time (time)
- invoiced (boolean), invoiced_at (timestamptz)
- paid (boolean), paid_at (timestamptz)

## Notes

- All calculations include 25% MVA automatically
- Use `--month` format: `YYYY-MM` (e.g., "2026-02")
- Dates in format: `YYYY-MM-DD` (e.g., "2026-02-14")
- Invoice text is formatted for Norwegian accounting software
- Dashboard URL: https://the-observatory-beta.vercel.app/finance
