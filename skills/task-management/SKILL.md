# Task Management Skill

Manage tasks in The Observatory via Supabase API. Create, read, update, and complete tasks.

## Setup

```bash
export OBSERVATORY_URL="https://the-observatory-2k8lny34s-redlegendes-projects.vercel.app"
```

## Quick Commands

### List Active Tasks
```bash
curl "$OBSERVATORY_URL/api/fred/tasks"
```

### List Urgent Tasks
```bash
curl "$OBSERVATORY_URL/api/fred/tasks?priority=urgent"
```

### Create a Task
```bash
curl -X POST "$OBSERVATORY_URL/api/fred/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Task title here",
    "description": "Optional description",
    "priority": "high",
    "status": "todo"
  }'
```

### Create Task + Add to Calendar
```bash
curl -X POST "$OBSERVATORY_URL/api/fred/tasks/calendar" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Task with deadline",
    "due_date": "2026-02-10",
    "priority": "high",
    "add_to_calendar": true,
    "calendar_duration_hours": 2
  }'
```

### Complete a Task
```bash
curl -X POST "$OBSERVATORY_URL/api/fred/tasks/{TASK_ID}/complete" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Completed during session"}'
```

## API Reference

### GET /api/fred/tasks

Get tasks with optional filters.

**Query Parameters:**
| Param | Values | Description |
|-------|--------|-------------|
| `status` | backlog, todo, in_progress, review, done | Filter by status |
| `priority` | low, medium, high, urgent | Filter by priority |
| `project_id` | UUID | Filter by project |
| `limit` | number | Max results (default 50) |

**Response:**
```json
{
  "tasks": [...],
  "summary": {
    "total": 12,
    "by_status": { "todo": 5, "in_progress": 3 },
    "by_priority": { "high": 2, "medium": 8 },
    "urgent": 2
  },
  "timestamp": "2026-02-05T10:00:00Z"
}
```

### POST /api/fred/tasks

Create a new task.

**Request Body:**
```json
{
  "title": "Required task title",
  "description": "Optional description",
  "priority": "medium",       // low, medium, high, urgent
  "status": "todo",           // backlog, todo, in_progress, review
  "project_id": "uuid",       // Optional project UUID
  "due_date": "2026-02-10",   // Optional ISO date
  "tags": ["tag1", "tag2"]    // Optional array
}
```

**Response (201):**
```json
{
  "ok": true,
  "message": "Task created successfully",
  "task": { ... }
}
```

### POST /api/fred/tasks/{id}/complete

Mark a task as done.

**Request Body:**
```json
{
  "notes": "Optional completion notes",
  "completed_by": "fred"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Task marked as done",
  "task": { ... }
}
```

### GET /api/fred/notifications

Check for notifications (task completed by Jakob, etc).

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "task_completed",
      "message": "Task completed: Fix the bug",
      "task_id": "uuid",
      "read": false
    }
  ]
}
```

## When to Use

### Read Tasks
- At session start to understand current work
- When user asks "what's on my plate?"
- Before planning new work

### Create Tasks
- When user says "add a task for..."
- When research discovers action items
- When breaking down a project into steps

### Complete Tasks
- After finishing implementation work
- When user confirms something is done
- After successfully deploying code

## Priority Guidelines

| Priority | When to Use |
|----------|-------------|
| `urgent` | Blocking other work, deadline today |
| `high` | Important, needed this week |
| `medium` | Normal priority (default) |
| `low` | Nice to have, backlog |

## Workflow Integration

After completing any task-related work:

1. **Find the related task** in Supabase
2. **Mark it complete** via API
3. **Check for next task** in same project
4. **Update PROJECTS.md** if needed

Example session end:
```bash
# Mark task done
curl -X POST "$OBSERVATORY_URL/api/fred/tasks/abc-123/complete" \
  -d '{"notes": "Implemented in PR #42"}'

# Check what's next
curl "$OBSERVATORY_URL/api/fred/tasks?status=todo&priority=high"
```
