---
name: observatory
description: Quick access to The Observatory dashboard data — tasks, projects, and notifications without credential hunting.
metadata:
  clawdbot:
    category: productivity
---

# Observatory Skill

Fast CLI access to your personal command center data.

## Usage

```bash
# Get active tasks (todo + backlog, sorted by priority)
observatory tasks

# Get only urgent/critical tasks
observatory tasks --urgent

# List all projects
observatory projects

# Check Fred's notification inbox
observatory notifications

# Mark a task done (updates Observatory + notifies you)
observatory complete <task-id>

# Sync TODO.md with Observatory (one-way: Observatory → TODO.md)
observatory sync
```

## What It Does

- Pre-configured with Observatory Supabase credentials
- No env file hunting required
- Human-readable output (not raw JSON)
- Fast — single command, instant results

## Implementation

See `skills/observatory/` for the CLI scripts.
