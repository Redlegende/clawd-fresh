# 🔔 Reminder System Setup

## Overview

The reminder system sends you notifications at key times:

1. **End of shift reminder** — 30 min after expected shift end
2. **Daily summary** — Confirm hours at end of day
3. **Weekly check** — Remind to invoice if hours are ready

---

## Cron Job Schedule

### Automatic Email Checking

Add these to your crontab (`crontab -e`):

```bash
# Friday 16:00 - Primary check
0 16 * * 5 /Users/jakobbakken/clawd/hours/automation/check-taxi-email.sh >> /Users/jakobbakken/clawd/hours/automation/cron.log 2>&1

# Saturday 10:00 - Retry if Friday empty
0 10 * * 6 /Users/jakobbakken/clawd/hours/automation/check-taxi-email.sh --retry >> /Users/jakobbakken/clawd/hours/automation/cron.log 2>&1

# Sunday 10:00 - Final retry
0 10 * * 0 /Users/jakobbakken/clawd/hours/automation/check-taxi-email.sh --retry >> /Users/jakobbakken/clawd/hours/automation/cron.log 2>&1
```

---

## Clawdbot Cron Alternative

Since you want reminders via Telegram, we can use Clawdbot's cron system:

### Example: Daily Hour Reminder

Schedule a message for end of each driving day:

```json
{
  "name": "driving-hours-reminder",
  "schedule": { "kind": "cron", "expr": "30 19 * * *" },
  "sessionTarget": { "channel": "telegram", "userId": "6946509790" },
  "payload": {
    "kind": "systemEvent",
    "text": "🚕 If you drove today, send me your hours! Format: 'Started 10, finished 19:30'"
  }
}
```

---

## Manual Testing

Test the email check manually:

```bash
cd /Users/jakobbakken/clawd/hours/automation
./check-taxi-email.sh
```

Test PDF parsing:

```bash
./parse-pdf.py /path/to/taxi-hours.pdf
```

---

## Flow Diagram

```
Friday 16:00
    │
    ▼
┌─────────────┐
│ Check Email │──── PDF found? ──── Yes ───▶ Process
└─────────────┘           │
                         No
                          │
                          ▼
              Saturday 10:00 (retry)
                          │
                   PDF found? ──── Yes ───▶ Process
                          │
                         No
                          │
                          ▼
              Sunday 10:00 (final retry)
                          │
                   PDF found? ──── Yes ───▶ Process
                          │
                         No ───────▶ Alert user
```
