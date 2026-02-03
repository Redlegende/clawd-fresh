# Observatory Task Sync Skill

Skill for Fred to interact with The Observatory Kanban system via API.

## Purpose

Two-way sync between The Observatory Kanban and Fred:
1. **Inbound:** Get notified when Jakob marks tasks done
2. **Outbound:** Fred can mark tasks done via API

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/fred/notifications` | GET | Check unread notifications |
| `/api/fred/notifications?action=mark_read` | POST | Mark notification as read |
| `/api/fred/tasks` | GET | Get tasks list |
| `/api/fred/tasks/[id]/complete` | POST | Mark task as done |

## Environment

```bash
OBSERVATORY_URL=https://the-observatory-2k8lny34s-redlegendes-projects.vercel.app
# No auth needed (temporarily) - add API key later
```

## Usage Examples

### Check my notifications
```bash
observatory-notifications
```

### Mark a task done
```bash
observatory-complete-task <task-id> [notes]
```

### Get urgent tasks
```bash
observatory-tasks --priority urgent
```

## Integration

Add to daily cron:
- Check notifications every morning
- Report completed tasks from yesterday
- Alert on urgent new tasks
