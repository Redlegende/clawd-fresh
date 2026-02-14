---
name: finance-track
description: Manage finance entries for The Observatory - add hours, view earnings by month, generate reports. Use when user asks to add hours, check monthly earnings, or get financial summaries.
---

# Finance Track Skill

Interact with The Observatory finance system for hour tracking and earnings.

## Setup

Requires Observatory Supabase credentials in project .env.local:

```bash
export SUPABASE_URL="https://vhrmxtolrrcrhrxljemp.supabase.co"
export SUPABASE_SERVICE_KEY="..."
```

## Commands

### Add Hours

```bash
{baseDir}/scripts/finance.sh add \
  --date "2026-02-14" \
  --source "Fåvang Varetaxi" \
  --description "Dagkjøring" \
  --hours 8.5 \
  --type day

# For night shifts (kveldskjøring)
{baseDir}/scripts/finance.sh add \
  --date "2026-02-14" \
  --source "Fåvang Varetaxi" \
  --description "Kveldskjøring" \
  --hours 4.5 \
  --type night
```

**Sources:**
- `Fåvang Varetaxi` - Day: 300 kr/h, Night: 400 kr/h
- `Treffen` - All: 400 kr/h
- `Kvitfjellhytter` - Custom rates
- `Other` - 300 kr/h

**Types:**
- `day` - Daytime rate
- `night` - Evening/night rate (22:00+)

### View Earnings

```bash
# Current month total
{baseDir}/scripts/finance.sh total

# Specific month
{baseDir}/scripts/finance.sh total --month 2026-01

# By workplace
{baseDir}/scripts/finance.sh total --month 2026-01 --source "Fåvang Varetaxi"

# Show breakdown
{baseDir}/scripts/finance.sh summary --month 2026-02
```

### List Entries

```bash
# Current month
{baseDir}/scripts/finance.sh list

# Specific month
{baseDir}/scripts/finance.sh list --month 2026-01

# By workplace
{baseDir}/scripts/finance.sh list --source "Treffen"

# Pending invoices
{baseDir}/scripts/finance.sh list --status pending
```

### Mark Invoiced/Paid

```bash
# Mark entry as invoiced
{baseDir}/scripts/finance.sh invoice --id abc123

# Mark entry as paid
{baseDir}/scripts/finance.sh pay --id abc123

# Mark all entries in a month as invoiced
{baseDir}/scripts/finance.sh invoice --month 2026-01 --source "Fåvang Varetaxi"
```

## Examples

**User:** "Add 8.5 hours for Fåvang Varetaxi today"
```bash
{baseDir}/scripts/finance.sh add \
  --date "$(date +%Y-%m-%d)" \
  --source "Fåvang Varetaxi" \
  --description "Dagkjøring" \
  --hours 8.5 \
  --type day
```

**User:** "How much have I made in January?"
```bash
{baseDir}/scripts/finance.sh total --month 2026-01
```

**User:** "Show me all pending invoices"
```bash
{baseDir}/scripts/finance.sh list --status pending
```

**User:** "I worked 4 hours kveldskjøring yesterday"
```bash
{baseDir}/scripts/finance.sh add \
  --date "$(date -v-1d +%Y-%m-%d)" \
  --source "Fåvang Varetaxi" \
  --description "Kveldskjøring" \
  --hours 4 \
  --type night
```

## Notes

- All amounts automatically calculate MVA (25%)
- Database trigger handles subtotal/total calculations
- Times stored in 24h format (HH:MM:SS)
- Dates in ISO format (YYYY-MM-DD)
