---
name: weekly-planning
description: Weekly planning summary with next 7 days overview, cabin operations, work schedule, and priorities. Runs Sunday evenings.
version: 1.0.0
---

# Weekly Planning Skill

Generates comprehensive weekly planning summaries combining:
- 📅 Full week calendar (Mon-Sun)
- 🏠 Cabin operations schedule (cleaning, check-ins, no-drive days)
- 💼 Work shifts (Treffen, driving)
- 🔴 Weekly priorities from TODO.md
- 📊 Last week summary (hours worked, earnings)

## Schedule

**Weekly on Sundays at 20:00 (8 PM) Europe/Oslo**

## Output Format

```
📅 Weekly Planning — Week of Feb 16-22, 2026

LAST WEEK RECAP
---
• Hours worked: 42h
• Earnings: 18,750 kr (incl MVA)
• Invoiced: 0 kr
• Outstanding: 18,750 kr

THIS WEEK OVERVIEW
---
Monday, Feb 16:
  • Treffen 12:00–18:00 (6h)
  • ✅ Free to drive

Tuesday, Feb 17:
  • Treffen 12:00–18:00 (6h)
  • ✅ Free to drive

Wednesday, Feb 18:
  • Treffen 12:00–18:00 (6h)
  • ✅ Free to drive

Thursday, Feb 19:
  • 11:00 — 🧹 CHECKOUT cabin 13 & 23 + CHECK-IN cabin 22
  • ⚠️ NO DRIVING (cleaning + check-in)

Friday, Feb 20:
  • Treffen 12:00–18:00 (6h)
  • ✅ Free to drive

Saturday, Feb 21:
  • Treffen 12:00–18:00 (6h)
  • 11:00 — 🏃 CHECKOUT cabin 22
  • ⚠️ Busy day (work + checkout)

Sunday, Feb 22:
  • 11:00 — 🏃 CHECKOUT cabin 13, 23, 12 + CHECK-IN cabin 13
  • ⚠️ BUSY CABIN DAY (multiple ops)

PRIORITIES THIS WEEK
---
1. Connect iGMS OAuth (high)
2. Define MVP scope for Restaurant Staffing (high)
3. Validate Restaurant Staffing with restaurant owners (high)

REMINDERS
---
• Thursday = NO DRIVING (cleaning + check-in)
• Saturday = Work + checkout (tight schedule)
• Sunday = Heavy cabin day (plan to stay local)

---
Dashboard: https://the-observatory-beta.vercel.app
```

## Data Sources

1. **Google Calendar** — 7-day event forecast
2. **Supabase finance_entries** — This week's work schedule + last week's totals
3. **TODO.md** — Weekly priorities
4. **iGMS API** — Cabin operations schedule

## Usage

### Manual Trigger
```bash
./skills/weekly-planning/scripts/generate-weekly.sh
```

### View Latest Planning
```bash
cat memory/$(date +%Y-%m-%d)-weekly-plan.md
```

## Files

- `scripts/generate-weekly.sh` — Weekly planning generator
- Cron job — Scheduled Sundays at 8 PM

## Integration

The weekly plan automatically:
1. Summarizes last week's work (hours + earnings)
2. Maps out the full week day-by-day
3. Flags no-drive days (cleaning + check-in conflicts)
4. Warns about busy days
5. Lists top priorities for the week

*Created: 2026-02-17*
