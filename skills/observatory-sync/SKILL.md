# Observatory Sync Skill

Two-way task synchronization between The Observatory Kanban and Fred.

## Overview

This skill enables real-time sync:
- **Inbound:** When Jakob marks a task done in Kanban → Fred gets notified
- **Outbound:** Fred can mark tasks done via API

## Quick Start

```bash
# Check my notifications
./skills/observatory-sync/observatory-notifications.sh

# List urgent tasks
./skills/observatory-sync/observatory-tasks.sh --urgent

# Mark a task done
./skills/observatory-sync/observatory-complete-task.sh <task-id> "Notes"
```

## Commands

| Command | Purpose |
|---------|---------|
| `observatory-notifications.sh` | Check unread notifications |
| `observatory-notifications.sh --mark-read` | Mark all as read |
| `observatory-tasks.sh` | List all active tasks |
| `observatory-tasks.sh --urgent` | List urgent tasks |
| `observatory-tasks.sh --done` | List completed tasks |
| `observatory-complete-task.sh <id>` | Mark task as done |

## API Reference

### GET /api/fred/notifications
Returns unread notifications for Fred.

**Response:**
```json
{
  "notifications": [...],
  "recent_completed": [...],
  "unread_count": 5
}
```

### GET /api/fred/tasks
Returns tasks list.

**Query params:**
- `status` - Filter by status
- `priority` - Filter by priority
- `limit` - Max results

### POST /api/fred/tasks/:id/complete
Mark a task as done.

**Body:**
```json
{
  "notes": "Completed via API",
  "completed_by": "fred"
}
```

## Webhook Flow

```
Jakob clicks "Done" in Kanban
         ↓
Kanban UI sends webhook to /api/webhooks/tasks
         ↓
Server creates notification in fred_notifications table
         ↓
Fred checks notifications via /api/fred/notifications
         ↓
Fred marks notification read + updates TODO.md
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `fred_notifications` | Queue of notifications for Fred |
| `task_sync_log` | Audit trail of all sync events |
| `outbound_task_actions` | Actions Fred wants to take |

## Configuration

Environment variable (optional):
```bash
export OBSERVATORY_URL=https://the-observatory-2k8lny34s-redlegendes-projects.vercel.app
```

## Future Enhancements

- [ ] HMAC signature verification for webhooks
- [ ] API key authentication
- [ ] WebSocket for real-time updates
- [ ] Batch operations
- [ ] Task creation from Fred's side
