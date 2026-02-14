---
name: garmin-sync
description: Automated Garmin Connect sync with email-based MFA handling. Fetches Body Battery, Sleep, HR, VO2 Max data daily.
metadata:
  clawdbot:
    category: health
    emoji: ⌚
---

# Garmin Sync Skill

Automated daily sync from Garmin Connect to Supabase.

## What It Does

1. Attempts sync with saved OAuth tokens
2. If tokens expired (MFA needed):
   - Checks Gmail for Garmin verification email
   - Extracts 6-digit MFA code automatically
   - Completes login and saves fresh tokens
3. Fetches fitness data (Body Battery, Sleep, HR, VO2 Max)
4. Uploads to Supabase `fitness_metrics` table

## Usage

```bash
# Manual sync
garmin-sync

# Or run directly
cd projects/the-observatory/garmin-skill
./orchestrator.sh
```

## How It Works

**Normal flow (tokens valid):**
- Runs silently, no user interaction needed
- Completes in ~30 seconds

**MFA flow (weekly, tokens expired):**
- Script detects MFA requirement
- Waits for Garmin email (up to 60 seconds)
- Extracts code automatically
- Completes sync
- Saves new tokens (valid for ~7 days)

## Automation

Runs daily via cron at 8:30 AM:
```
30 8 * * * /Users/jakobbakken/clawd-fresh/skills/garmin-sync/garmin-sync.sh
```

## Files

- `projects/the-observatory/garmin-skill/daily_sync.py` - Main sync logic
- `projects/the-observatory/garmin-skill/email_fetcher.py` - Gmail MFA extraction
- `projects/the-observatory/garmin-skill/orchestrator.sh` - Orchestrates the flow

## Requirements

- `gog` authenticated with Gmail access
- Garmin Connect credentials in `.env.local`
- Supabase service key for data upload
