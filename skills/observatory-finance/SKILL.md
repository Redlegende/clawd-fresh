---
name: observatory-finance
description: Manage Observatory finance tracking - add hour entries, check earnings, generate invoice text for accounting software. Use when Jakob asks to add hours worked, check monthly totals, or prepare invoices.
metadata: {"clawdbot":{"requires":{"env":["SUPABASE_URL","SUPABASE_SERVICE_KEY"]}}}
---

# Observatory Finance Management

Track hours worked, calculate earnings with MVA, and generate invoice text for Jakob's accounting software.

**This is the ONLY finance skill. Do not use `finance-track` — it's deprecated.**

## Smart Upsert

The `add` command automatically checks for existing entries with the same **date + source + shift type**.

- Same date + same source + same shift (day/night) = **AUTO-UPDATES** the existing entry
- Same date + same source + different shift (day vs night) = **ALLOWED** (dagkjoring + kveldskjoring)
- Same date + different source = **ALLOWED**

Use `--force` to always insert a new entry regardless. Use `update` for explicit updates.

## Quick Commands

```bash
# Add hours (with duplicate check)
{baseDir}/scripts/finance.sh add \
  --date "2026-02-14" \
  --source "Favang Varetaxi" \
  --hours 8.5 \
  --shift day \
  --start 10:00 --end 18:30 \
  --description "Dagkjoring"

# Update existing entry
{baseDir}/scripts/finance.sh update \
  --date "2026-02-14" \
  --source "Favang Varetaxi" \
  --shift day \
  --hours 9.0 --start 09:00 --end 18:00

# Delete by ID
{baseDir}/scripts/finance.sh delete --id "abc123-..."

# Check monthly earnings
{baseDir}/scripts/finance.sh stats --month "2026-02"

# Breakdown by workplace
{baseDir}/scripts/finance.sh summary --month "2026-02"

# Generate invoice text (ready for accounting software)
{baseDir}/scripts/finance.sh invoice --month "2026-02" --source "Favang Varetaxi"

# List entries
{baseDir}/scripts/finance.sh list --month "2026-02"
{baseDir}/scripts/finance.sh list --month "2026-02" --status pending

# Mark as invoiced/paid
{baseDir}/scripts/finance.sh mark-invoiced --month "2026-02" --source "Favang Varetaxi"
{baseDir}/scripts/finance.sh mark-paid --month "2026-02" --source "Favang Varetaxi"

# Find duplicates
{baseDir}/scripts/finance.sh check-duplicates --month "2026-02"
```

## Parameters

### --source (workplace)
- `Favang Varetaxi` - Taxi driving (day: 300 kr/h, night: 400 kr/h)
- `Treffen` - Restaurant (400 kr/h all shifts)
- `Kvitfjellhytter` - Cabin management
- `Other` - Other work

Source names are normalized automatically (case-insensitive, handles ø/aa variants).

### --shift (time of day)
- `day` - Before 22:00 (uses day rate)
- `night` - After 22:00 (uses night rate)

Note: `--type` works as an alias for `--shift`.

### Rates (auto-applied with 25% MVA)
- Favang day: 300 kr/h → 375 kr/h with MVA
- Favang night: 400 kr/h → 500 kr/h with MVA
- Treffen: 400 kr/h → 500 kr/h with MVA

## Examples

**"I worked from 12 to 18 today at the restaurant"**
```bash
{baseDir}/scripts/finance.sh add \
  --date "$(date +%Y-%m-%d)" \
  --source "Treffen" \
  --hours 6 \
  --shift day \
  --start 12:00 --end 18:00 \
  --description "Restaurant shift"
```

**"Add 8.5 hours dagkjoring yesterday"**
```bash
{baseDir}/scripts/finance.sh add \
  --date "$(date -v-1d +%Y-%m-%d)" \
  --source "Favang Varetaxi" \
  --hours 8.5 \
  --shift day \
  --description "Dagkjoring"
```

**"I actually worked 9 hours, not 8.5"**
```bash
{baseDir}/scripts/finance.sh update \
  --date "2026-02-14" \
  --source "Favang Varetaxi" \
  --shift day \
  --hours 9.0
```

**"How much have I made in February?"**
```bash
{baseDir}/scripts/finance.sh stats --month "2026-02"
```

**"Show me all unpaid hours"**
```bash
{baseDir}/scripts/finance.sh list --month "2026-02" --status pending
```

**"Generate the invoice for Treffen this month"**
```bash
{baseDir}/scripts/finance.sh invoice --month "2026-02" --source "Treffen"
```

## Invoice Format

The generated invoice text includes:
- Individual entries with date, time range (if available), hours × rate
- Summary by day/night rates
- Total hours, ex-MVA, MVA (25%), and total with MVA
- Norwegian month names, ready to paste into accounting software

## Edge Cases Handled

1. **Duplicate entries** — Blocked by default, use `--force` or `update`
2. **Source name variants** — `Fåvang`, `Favang`, `fåvang` all normalize to `Favang Varetaxi`
3. **Day + night same date** — Allowed (dagkjoring + kveldskjoring)
4. **Missing start/end times** — Optional, won't block entry
5. **Wrong hours** — Use `update` to fix without creating duplicates

## Database Table

**finance_entries:**
- id (uuid), date (date), source (text), description (text)
- hours (numeric), rate_nok (numeric), mva_rate (numeric)
- subtotal_nok (numeric, auto-calc), total_nok (numeric, auto-calc)
- business_type (text: 'day'|'night')
- start_time (time), end_time (time)
- invoiced (boolean), invoiced_at (timestamptz)
- paid (boolean), paid_at (timestamptz)

Dashboard: https://the-observatory-beta.vercel.app/finance
