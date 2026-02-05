# Observatory Sync Skill

Two-way sync between Fred and The Observatory task system.

## What This Does

- **Fred → Supabase**: I can read, update, and comment on tasks directly
- **You → Kanban**: You can add comments on tasks via the Kanban board
- **Two-way comments**: Both of us can see all comments for context

## CLI Tools

### List Tasks
```bash
observatory-tasks.sh                    # All active tasks
observatory-tasks.sh -u                 # Urgent only
observatory-tasks.sh -s todo            # Filter by status
observatory-tasks.sh -p high            # Filter by priority
observatory-tasks.sh -o                 # Overdue tasks
```

### Complete a Task
```bash
observatory-complete-task.sh abc123
observatory-complete-task.sh abc123 -c "Deployed to prod"
```

### Add Comment
```bash
observatory-comment.sh abc123 "Waiting for Henrik's reply"
observatory-comment.sh abc123 "Internal note" -i
```

### Check Notifications
```bash
observatory-notifications.sh            # Show unread
observatory-notifications.sh -r         # Show and mark read
observatory-notifications.sh -a         # Show all
observatory-notifications.sh -c         # Clear all
```

## Database Schema

### task_comments
- `id` - UUID
- `task_id` - Reference to tasks
- `author` - 'jakob' or 'fred'
- `content` - Comment text
- `is_internal_note` - For Fred's private notes
- `created_at` / `updated_at` - Timestamps

## API Routes

- `GET /api/tasks/[id]/comments` - List comments
- `POST /api/tasks/[id]/comments` - Add comment
- `DELETE /api/tasks/[id]/comments?comment_id=x` - Delete comment

## Kanban UI

- Click any task card to open detail view
- See all comments in the modal
- Add new comments at the bottom
- Comment count shown on task cards
