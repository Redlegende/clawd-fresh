# Task Sync Skill

How Fred keeps Supabase tasks in sync with actual work progress. **Supabase is the single source of truth.**

## Core Principle

Every time Fred does work, the corresponding task in Supabase should reflect:
- Current status (backlog → todo → in_progress → review → done)
- Progress notes in description
- Updated timestamps

## When to Update Tasks

### Starting Work on a Task
```bash
curl -X PATCH "$OBSERVATORY_URL/api/fred/tasks/{id}" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

### Making Progress (Partial Work)
Add progress notes to the description:
```bash
curl -X PATCH "$OBSERVATORY_URL/api/fred/tasks/{id}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Original task description\n\n---\n📝 PROGRESS LOG:\n- [Feb 5] Started API implementation\n- [Feb 5] Completed GET endpoint, working on POST"
  }'
```

### Completing a Task
```bash
curl -X POST "$OBSERVATORY_URL/api/fred/tasks/{id}/complete" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Implemented and tested. PR #42 merged."}'
```

### Creating New Tasks (Discovered Work)
```bash
curl -X POST "$OBSERVATORY_URL/api/fred/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix bug discovered during API work",
    "description": "Found while working on task X",
    "priority": "high",
    "status": "todo",
    "tags": ["bug", "api"]
  }'
```

## Task Status Flow

```
backlog → todo → in_progress → review → done
                      ↓
                 (can revert)
                      ↓
                    todo
```

### Status Meanings
| Status | When to Use |
|--------|-------------|
| `backlog` | Idea captured, not prioritized |
| `todo` | Ready to work on, prioritized |
| `in_progress` | Currently being worked on |
| `review` | Done but needs verification |
| `done` | Completed and verified |

## Priority Levels

| Priority | Meaning | Fred's Action |
|----------|---------|---------------|
| `urgent` | Do immediately | Start this first |
| `high` | Important this week | Schedule soon |
| `medium` | Normal priority | Work when time allows |
| `low` | Nice to have | Backlog material |

## Tags for Filtering

Use consistent tags:
- **Categories:** `business`, `finance`, `health`, `tech`, `personal`
- **Projects:** `kvitfjellhytter`, `3dje-bolig`, `observatory`
- **Types:** `bug`, `feature`, `research`, `meeting`, `admin`

## Session Workflow

### At Session Start
1. Run morning briefing: `./skills/morning-briefing/scripts/briefing.sh`
2. Identify focus task from recommendations
3. Mark focus task as `in_progress`

### During Session
1. When starting new work → update task to `in_progress`
2. After significant progress → add progress notes
3. When blocked → note the blocker in description
4. When task splits → create sub-tasks, link in description

### At Session End
1. Update all in-progress tasks with current state
2. Mark completed tasks as `done`
3. Create tasks for any new work discovered
4. Ensure no task is left without accurate status

## Progress Note Format

```
[Original description]

---
📝 PROGRESS LOG:
- [YYYY-MM-DD HH:MM] What was done
- [YYYY-MM-DD HH:MM] Next step needed

🚧 BLOCKERS:
- Waiting on X

📎 RELATED:
- PR: #42
- Task: [linked-task-id]
```

## API Reference

### PATCH /api/fred/tasks/:id
Update any task field.

**Allowed fields:**
- `title` - Task title
- `description` - Full description with progress
- `status` - Current status
- `priority` - low/medium/high/urgent
- `due_date` - ISO date string
- `tags` - Array of strings
- `project_id` - UUID of related project

### POST /api/fred/tasks/:id/complete
Mark task as done with optional notes.

### POST /api/fred/tasks
Create a new task.

### GET /api/fred/tasks
List tasks with filters.

### GET /api/fred/briefing
Get full morning briefing.

## Integration with Calendar

When a task has a deadline, Fred should:
1. Check if deadline conflicts with calendar
2. Suggest calendar block for focused work
3. Alert if deadline is at risk

```bash
# When creating task with deadline
curl -X POST "$OBSERVATORY_URL/api/fred/tasks" \
  -d '{
    "title": "Submit tax documents",
    "due_date": "2026-02-15",
    "priority": "high",
    "add_to_calendar": true
  }'
```

## Example: Full Work Session

```bash
# 1. Get briefing
./skills/morning-briefing/scripts/briefing.sh

# 2. Start working on focus task
curl -X PATCH "$OBSERVATORY_URL/api/fred/tasks/abc-123" \
  -d '{"status": "in_progress"}'

# 3. After 1 hour of work, add progress
curl -X PATCH "$OBSERVATORY_URL/api/fred/tasks/abc-123" \
  -d '{"description": "Build API endpoint\n\n---\n📝 PROGRESS:\n- [10:30] Created GET endpoint\n- [11:15] Working on POST validation"}'

# 4. Discover related bug
curl -X POST "$OBSERVATORY_URL/api/fred/tasks" \
  -d '{"title": "Fix validation edge case", "priority": "medium", "tags": ["bug"]}'

# 5. Complete the task
curl -X POST "$OBSERVATORY_URL/api/fred/tasks/abc-123/complete" \
  -d '{"notes": "API complete. Created follow-up task for bug fix."}'

# 6. Check what's next
curl "$OBSERVATORY_URL/api/fred/tasks?status=todo&priority=high" | jq '.tasks[0]'
```
