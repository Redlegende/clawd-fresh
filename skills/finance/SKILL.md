# Finance Skill

Manage Jakob's hour tracking and earnings via chat. Adds entries to Supabase `finance_entries` table in the Observatory project.

## When to Use

- Jakob says "add hours", "log hours", "I worked X hours", "drove today", etc.
- Jakob asks "how much did I earn", "what's my total", "how many hours this month", etc.
- Jakob says "mark invoiced", "mark paid", etc.

## Supabase Credentials

```
URL: https://vhrmxtolrrcrhrxljemp.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzQwMDQsImV4cCI6MjA4NTU1MDAwNH0.EHAElJqyoSNzq7sk6HqOGiGEYJhBAKCLbQigr7ymWPw
```

## Rates

| Workplace | Day Rate (before 22:00) | Night Rate (after 22:00) | MVA |
|-----------|------------------------|--------------------------|-----|
| Fåvang Varetaxi | 300 kr/h | 400 kr/h | 25% |
| Treffen | 400 kr/h | 400 kr/h | 25% |
| Other | 300 kr/h | 300 kr/h | 25% |

## Adding Hours

Use the `finance-add.sh` script:

```bash
bash skills/finance/finance-add.sh \
  --date "2026-02-14" \
  --source "Fåvang Varetaxi" \
  --hours 8.5 \
  --rate 300 \
  --type day \
  --start "10:00" \
  --end "18:30" \
  --description "Dagkjøring"
```

## Querying Earnings

Use the `finance-query.sh` script:

```bash
# Summary for a month
bash skills/finance/finance-query.sh --month "2026-02"

# Summary for a specific workplace
bash skills/finance/finance-query.sh --month "2026-02" --source "Fåvang Varetaxi"

# All entries
bash skills/finance/finance-query.sh --all
```

## Parsing Natural Language

When Jakob says things like:
- "I drove today 10-18:30" → Day shift, Fåvang Varetaxi, 8.5h, 300 kr/h
- "I drove today 10-18:30, kveldskjøring 20-23" → Two entries: day (8.5h @ 300) + night (3h @ 400)
- "Worked at Treffen 12-21" → Treffen, 9h, 400 kr/h
- "Log 8 hours varetaxi yesterday" → Day shift, yesterday's date, 8h, 300 kr/h

Always confirm the entry before inserting. Show: date, workplace, hours, rate, start-end time, subtotal, MVA, total.

## Table Schema

```sql
finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  source text NOT NULL,         -- 'Fåvang Varetaxi', 'Treffen', 'Kvitfjellhytter', 'Other'
  description text,
  hours numeric NOT NULL,
  rate_nok numeric NOT NULL,
  mva_rate numeric DEFAULT 1.25,
  subtotal_nok numeric,         -- hours * rate_nok (auto-calculated by trigger)
  total_nok numeric,            -- subtotal * mva_rate (auto-calculated by trigger)
  invoiced boolean DEFAULT false,
  invoiced_at timestamptz,
  paid boolean DEFAULT false,
  paid_at timestamptz,
  business_type text,           -- 'day' or 'night'
  start_time time,
  end_time time,
  created_at timestamptz DEFAULT now()
)
```
