# Observatory Database Schema Documentation

## Overview
The Observatory uses a **single-table design for tasks** with status as a column. This is the industry-standard approach for Kanban systems.

## Why Single Table for Tasks?

**❌ WRONG: Separate tables per status**
```
backlog_tasks
todo_tasks  
in_progress_tasks
review_tasks
done_tasks
```
Problems:
- Moving tasks requires DELETE + INSERT (loses history)
- Comments table would need 5 foreign keys
- Can't easily query "all my tasks"
- No atomic transactions for status changes

**✅ CORRECT: Single tasks table with status column**
```
tasks (id, title, status, due_date, ...)
```
Benefits:
- Status change = single UPDATE (atomic)
- Foreign keys work properly
- Views filter by status when needed
- Full history preserved

## Core Tables

### tasks
Main Kanban task storage.
```sql
- id: UUID PRIMARY KEY
- title: VARCHAR(500) - Task name
- description: TEXT - Details
- status: ENUM('backlog', 'todo', 'in_progress', 'review', 'done')
- priority: ENUM('low', 'medium', 'high', 'urgent')
- project_id: UUID -> projects (optional)
- due_date: DATE (optional, NULL if not set)
- tags: TEXT[] - Array of category tags
- source: VARCHAR(100) - Where task came from
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- completed_at: TIMESTAMP (set when status='done')
```

### task_comments
Comments on tasks (2-way sync between Fred and Jakob).
```sql
- id: UUID PRIMARY KEY
- task_id: UUID -> tasks (CASCADE DELETE)
- author: ENUM('jakob', 'fred')
- content: TEXT
- is_internal_note: BOOLEAN (Fred's private notes)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### projects
Project definitions for grouping tasks.
```sql
- id: UUID PRIMARY KEY
- name: VARCHAR(255)
- description: TEXT
- status: ENUM('active', 'paused', 'completed', 'archived')
- priority: INTEGER (1-10)
- folder_path: VARCHAR(500)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### fred_notifications
Queue for notifications to Fred.
```sql
- id: UUID PRIMARY KEY
- type: VARCHAR(50) - 'task_completed', 'task_comment', etc.
- message: TEXT
- task_id: UUID -> tasks
- task_title: VARCHAR(500) (denormalized for display)
- comment_id: UUID -> task_comments
- read: BOOLEAN
- created_at: TIMESTAMP
```

### task_sync_log
Audit trail of all task changes.
```sql
- id: UUID PRIMARY KEY
- event_type: VARCHAR(50) - 'completed', 'created', 'updated'
- task_id: UUID
- task_title: VARCHAR(500)
- previous_status: VARCHAR(50)
- new_status: VARCHAR(50)
- completed_by: VARCHAR(100)
- synced_at: TIMESTAMP
```

## Views (Virtual Tables)

Views are queries that act like tables but don't store data:

### active_tasks
Tasks that aren't done (for Kanban default view).
```sql
SELECT * FROM tasks WHERE status != 'done'
```

### tasks_with_comments
Tasks with comment count included.
```sql
SELECT t.*, COUNT(tc.id) as comment_count
FROM tasks t
LEFT JOIN task_comments tc ON t.id = tc.task_id
GROUP BY t.id
```

### active_tasks_with_context
Active tasks with latest comment for Fred's dashboard.
```sql
SELECT t.*, 
       latest_comment.content as latest_comment,
       latest_comment.author as latest_comment_author
FROM tasks t
LEFT JOIN LATERAL (
  SELECT * FROM task_comments 
  WHERE task_id = t.id 
  ORDER BY created_at DESC 
  LIMIT 1
) latest_comment ON true
WHERE t.status NOT IN ('done', 'archived')
```

### recently_completed
Tasks completed in last 24 hours.
```sql
SELECT * FROM tasks 
WHERE status = 'done' 
  AND completed_at > NOW() - INTERVAL '24 hours'
```

## Indexes (Performance)

```sql
-- Task lookups by status (Kanban columns)
CREATE INDEX idx_tasks_status ON tasks(status);

-- Task lookups by project
CREATE INDEX idx_tasks_project ON tasks(project_id);

-- Sorting by priority
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Sorting/filtering by due date
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Comment lookups by task
CREATE INDEX idx_task_comments_task ON task_comments(task_id);

-- Notification lookups (unread)
CREATE INDEX idx_fred_notifications_unread ON fred_notifications(read) WHERE read = false;
```

## Data Integrity

### Foreign Keys
- `task_comments.task_id` -> `tasks.id` (ON DELETE CASCADE)
- `tasks.project_id` -> `projects.id` (ON DELETE SET NULL)
- `fred_notifications.task_id` -> `tasks.id`
- `fred_notifications.comment_id` -> `task_comments.id` (ON DELETE SET NULL)

### Constraints
- Task status must be: backlog, todo, in_progress, review, done
- Task priority must be: low, medium, high, urgent
- Comment author must be: jakob, fred
- Due date is optional (can be NULL)

## Edge Cases Handled

1. **Task deleted** → Comments deleted (CASCADE)
2. **Project deleted** → Tasks keep working (project_id set to NULL)
3. **Status changes** → completed_at auto-set/unset via triggers
4. **Comment added** → Task updated_at refreshed via trigger
5. **Duplicate titles** → Allowed (different tasks can have same title)

## Best Practices

1. **Always use views for filtered data** (active_tasks, not manual WHERE)
2. **Never delete done tasks** - filter them out in views instead
3. **Use NULL for optional dates** - don't use placeholder dates
4. **Let triggers handle timestamps** - don't manually set updated_at
5. **Use UUIDs for all IDs** - enables safe merging/replication

## Cleanup Commands

```sql
-- Find duplicate tasks
SELECT title, COUNT(*) 
FROM tasks 
GROUP BY title 
HAVING COUNT(*) > 1;

-- Find orphaned comments
SELECT tc.id 
FROM task_comments tc 
LEFT JOIN tasks t ON tc.task_id = t.id 
WHERE t.id IS NULL;

-- Delete old done tasks (if needed)
DELETE FROM tasks 
WHERE status = 'done' 
  AND completed_at < NOW() - INTERVAL '1 year';
```
