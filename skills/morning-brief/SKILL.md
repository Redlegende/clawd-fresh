---
name: morning-brief
description: Generate daily morning briefs with calendar events, cabin operations, active tasks, and priorities. Runs at 8 AM daily.
version: 1.0.0
---

# Morning Brief Skill

Generates comprehensive daily morning briefs combining:
- 🏠 Cabin operations (cleaning, check-ins, driving restrictions)
- 📅 Calendar events
- 🔴 Active tasks from TODO.md
- 📊 Project statuses

## Schedule

**Daily at 8:00 AM Europe/Oslo**

## Output Format

```
🌅 Morning Brief — Thursday, February 5th

🏠 CABIN OPERATIONS
• 🧹 CLEANING DAY — Cabins 11:00-15:00
• ⚠️ NO DRIVING TODAY

📅 TODAY'S SCHEDULE
• 11:00 — Start cleaning
• 15:00 — Cleaning deadline
• 16:00 — Available for project work

🔴 ACTIVE TASKS
1. Clean all 5 cabins — NON-NEGOTIABLE
2. 3dje Boligsektor Day 1 — Read MVP plan
3. iGMS OAuth — Click "Connect iGMS"

💡 TODAY'S CONTEXT
[Relevant context for the day's priorities]
```

## Cabin Rules (from MEMORY.md)

### Cleaning Schedule
- **Window:** 11:00–15:00 (4 hours max)
- **Cabins:** 12, 13, 22, 23, Ringebuhuset
- **Rule:** If cleaning + check-in same day → NO DRIVING

### Check-In Days
- **Rule:** If check-in overlaps with cleaning → NO DRIVING
- **Preparation:** Clean must complete before guest arrival

## Data Sources

1. **Google Calendar** — Scheduled events, cleaning reminders
2. **TODO.md** — Active tasks from 🔴 NOW section
3. **PROJECTS.md** — Project statuses and next actions
4. **MEMORY.md** — Cabin rules, context

## Usage

### Manual Trigger
```bash
./skills/morning-brief/scripts/generate-brief.sh
```

### View Today's Brief
```bash
cat memory/$(date +%Y-%m-%d)-morning-brief.md
```

## Files

- `scripts/generate-brief.sh` — Daily brief generator
- `templates/brief-template.md` — Template for briefs
- Cron job — Scheduled daily at 8 AM

## Integration

The brief automatically:
1. Checks for 🧹 CLEAN or 🏠 CHECK-IN calendar events
2. Flags NO DRIVING days
3. Lists top 3 active tasks
4. Provides relevant context

*Created: 2026-02-05*
