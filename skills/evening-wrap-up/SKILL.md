---
name: evening-wrap-up
description: Daily evening wrap-up with tomorrow's schedule, task reminders, and conflict warnings. Runs at 9 PM daily.
version: 1.0.0
---

# Evening Wrap-Up Skill

Generates comprehensive evening wrap-ups combining:
- 📅 Tomorrow's schedule (calendar events + work shifts)
- 🏠 Cabin operations warnings (cleaning + check-in = no driving)
- 🔴 Urgent task reminders
- ⚠️ Schedule conflicts

## Schedule

**Daily at 21:00 (9 PM) Europe/Oslo**

## Output Format

```
🌙 Evening Wrap-Up — Monday, February 16th

📅 TOMORROW (Tuesday, Feb 17)
• 12:00–18:00 — Treffen shift (6h @ 400 kr/h)
• No cabin operations
• ✅ FREE TO DRIVE

🔴 URGENT TASKS
• Connect iGMS OAuth (high)
• Define MVP scope for Restaurant Staffing (high)

⚠️ CONFLICTS / WARNINGS
• None

💡 TOMORROW'S CONTEXT
Tomorrow is a Treffen day. No cabin work, so you're free to drive if needed. Focus time available before 12:00 and after 18:00.

---
Dashboard: https://the-observatory-beta.vercel.app
```

## Data Sources

1. **Google Calendar** — Tomorrow's events
2. **Supabase finance_entries** — Tomorrow's work shifts
3. **TODO.md** — Urgent/high-priority tasks
4. **iGMS API** — Tomorrow's cleaning/check-in schedule

## Usage

### Manual Trigger
```bash
./skills/evening-wrap-up/scripts/generate-wrap-up.sh
```

### View Today's Wrap-Up
```bash
cat memory/$(date +%Y-%m-%d)-evening-wrap-up.md
```

## Files

- `scripts/generate-wrap-up.sh` — Daily wrap-up generator
- Cron job — Scheduled daily at 9 PM

## Integration

The wrap-up automatically:
1. Checks tomorrow's calendar + work schedule
2. Flags cabin operation days (🧹 CLEAN or 🏠 CHECK-IN)
3. Warns if cleaning + check-in same day = NO DRIVING
4. Lists urgent/high-priority tasks
5. Provides context for tomorrow

*Created: 2026-02-17*
