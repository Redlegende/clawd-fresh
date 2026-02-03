# Observatory Task Sync API

Real-time sync system between the Kanban dashboard and Fred (me).

## Architecture

```
┌─────────────────┐     Webhook      ┌──────────────┐
│   Observatory   │ ───────────────► │  Fred's API  │
│   Kanban UI     │                  │  (This API)  │
│   (Next.js)     │ ◄─────────────── │              │
└─────────────────┘    Response      └──────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────┐                  ┌──────────────┐
│    Supabase     │                  │   Telegram   │
│   (Database)    │                  │  (Notify me) │
└─────────────────┘                  └──────────────┘
```

## Events

| Event | Description | Action |
|-------|-------------|--------|
| `task.created` | New task added | Notify Fred |
| `task.updated` | Task modified | Update Fred's context |
| `task.completed` | Task marked done | **Critical**: Remove from my TODO, notify confirmation |
| `task.deleted` | Task removed | Archive tracking |
| `task.rescheduled` | Due date changed | Alert if affects priorities |

## API Endpoints

### POST `/api/webhooks/tasks`

Incoming webhook from Observatory when tasks change.

**Payload:**
```json
{
  "event": "task.completed",
  "timestamp": "2026-02-03T12:51:00Z",
  "task": {
    "id": "uuid",
    "title": "Fix Kanban done column",
    "project_id": "uuid",
    "status": "done",
    "previous_status": "in_progress",
    "completed_by": "jakob",
    "completed_at": "2026-02-03T12:51:00Z"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Acknowledged. Updated Fred's task list."
}
```

### GET `/api/tasks`

Fred queries current task state.

**Query params:**
- `status` - Filter by status
- `project_id` - Filter by project
- `priority` - Filter by priority

### POST `/api/tasks/:id/complete`

Fred marks a task done (outbound).

**Payload:**
```json
{
  "completed_by": "fred",
  "notes": "Completed via API"
}
```

## Authentication

- Webhook uses HMAC signature verification
- API key for Fred's outbound calls

## Notification Rules

| Scenario | Notification |
|----------|--------------|
| Task marked done | Immediate Telegram message |
| Urgent task created | Immediate alert |
| Task overdue | Daily digest |
| Bulk updates | Batched summary |

## Implementation Plan

1. **Phase 1:** Basic webhook receiver → Fred notifications
2. **Phase 2:** Outbound API → Fred can mark tasks done
3. **Phase 3:** Conflict resolution → Handle simultaneous edits
4. **Phase 4:** History tracking → Full audit log
