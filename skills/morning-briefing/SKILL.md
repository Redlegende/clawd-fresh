# Morning Briefing Skill

Fred's daily startup routine. Run this at the beginning of each session to understand context, priorities, and what Jakob needs.

## When to Use

- **Every session start** (mandatory)
- When user asks "what's on my plate?"
- When planning the day
- After being idle for 4+ hours

## The Morning Briefing

### Step 1: Fetch Calendar Events

```bash
curl -s "$OBSERVATORY_URL/api/fred/calendar/today" | jq .
```

Check for:
- Meetings that affect available work time
- Deadlines marked on calendar
- Blocked time slots

### Step 2: Fetch Tasks from Supabase

```bash
# Get all active tasks
curl -s "$OBSERVATORY_URL/api/fred/tasks" | jq .

# Focus on urgent/high priority
curl -s "$OBSERVATORY_URL/api/fred/tasks?priority=urgent" | jq .
curl -s "$OBSERVATORY_URL/api/fred/tasks?priority=high" | jq .

# Check what's in progress
curl -s "$OBSERVATORY_URL/api/fred/tasks?status=in_progress" | jq .
```

### Step 3: Check Notifications

```bash
curl -s "$OBSERVATORY_URL/api/fred/notifications" | jq .
```

Look for:
- Tasks Jakob completed yesterday
- Overdue task alerts
- Tasks reopened

### Step 4: Generate Daily Brief

Create a summary like this:

```
🌅 MORNING BRIEF - [DATE]

📅 TODAY'S CALENDAR
• 10:00 - Meeting with Henrik (1h)
• 14:00 - Treffen shift starts
Available work time: ~3 hours

🔴 URGENT (do first)
• [Task 1] - due today
• [Task 2] - overdue

🟠 HIGH PRIORITY
• [Task 3] - due this week
• [Task 4] - blocking other work

📊 IN PROGRESS
• [Task 5] - 60% done, continue here
• [Task 6] - waiting on response

✅ COMPLETED YESTERDAY
• [Task 7]
• [Task 8]

💡 RECOMMENDATIONS
1. Focus on [urgent task] first
2. [Task in progress] is close to done
3. Consider delegating [task] 
```

## API Endpoints

### GET /api/fred/calendar/today
Returns today's calendar events.

### GET /api/fred/briefing
Returns a pre-formatted briefing with all data combined.

**Response:**
```json
{
  "date": "2026-02-05",
  "calendar": {
    "events": [...],
    "available_hours": 5.5
  },
  "tasks": {
    "urgent": [...],
    "high": [...],
    "in_progress": [...],
    "due_today": [...]
  },
  "yesterday": {
    "completed": [...],
    "started": [...]
  },
  "recommendations": [...]
}
```

## Priority Decision Matrix

| Condition | Action |
|-----------|--------|
| Overdue + urgent | Drop everything, do this |
| Due today | High focus |
| In progress > 50% | Finish before starting new |
| Blocked by external | Note and move on |
| Low priority + old | Consider archiving |

## Updating Tasks During Work

When doing work related to a task:

```bash
# Mark as in progress when starting
curl -X PATCH "$OBSERVATORY_URL/api/fred/tasks/{id}" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'

# Add progress notes
curl -X PATCH "$OBSERVATORY_URL/api/fred/tasks/{id}" \
  -H "Content-Type: application/json" \
  -d '{"description": "Original description\n\n---\nProgress: Completed step 1, working on step 2"}'

# Mark complete when done
curl -X POST "$OBSERVATORY_URL/api/fred/tasks/{id}/complete" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Completed during session"}'
```

## Session End Ritual

Before ending a session:

1. Update any in-progress tasks with notes
2. Mark completed tasks as done
3. Create new tasks for discovered work
4. Check if anything became urgent

```bash
# Quick status update
curl -X PATCH "$OBSERVATORY_URL/api/fred/tasks/{id}" \
  -d '{"description": "Progress: 80% done. Next: finish the API integration"}'
```

## Integration with WORKFLOW.md

This skill complements the existing workflow rules:
- Tasks in Supabase are the **single source of truth**
- Still update PROJECTS.md for project-level status
- Daily notes in memory/ capture session details
- This skill provides the **task-level** granularity
