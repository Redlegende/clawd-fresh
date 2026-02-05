-- Task Comments Migration
-- Adds comment functionality to the Observatory task system

-- =====================================================
-- TASK COMMENTS TABLE
-- For context, updates, and notes on tasks
-- =====================================================
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author VARCHAR(20) NOT NULL CHECK (author IN ('jakob', 'fred')),
    content TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created ON task_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_comments_author ON task_comments(author);

-- =====================================================
-- VIEW: Tasks with Comment Count
-- =====================================================
CREATE OR REPLACE VIEW tasks_with_comments AS
SELECT 
    t.*,
    p.name as project_name,
    COUNT(tc.id) as comment_count
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN task_comments tc ON t.id = tc.task_id
GROUP BY t.id, p.name;

-- =====================================================
-- FUNCTION: Get Task with Comments
-- =====================================================
CREATE OR REPLACE FUNCTION get_task_with_comments(p_task_id UUID)
RETURNS TABLE (
    task_id UUID,
    title VARCHAR,
    description TEXT,
    status VARCHAR,
    priority VARCHAR,
    project_name VARCHAR,
    due_date DATE,
    comment_count BIGINT,
    comments JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as task_id,
        t.title,
        t.description,
        t.status,
        t.priority,
        p.name as project_name,
        t.due_date,
        COUNT(tc.id) as comment_count,
        COALESCE(
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'id', tc.id,
                    'author', tc.author,
                    'content', tc.content,
                    'created_at', tc.created_at
                ) ORDER BY tc.created_at DESC
            ) FILTER (WHERE tc.id IS NOT NULL),
            '[]'::JSONB
        ) as comments
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN task_comments tc ON t.id = tc.task_id
    WHERE t.id = p_task_id
    GROUP BY t.id, p.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Update task updated_at when comment added
-- =====================================================
CREATE OR REPLACE FUNCTION update_task_on_comment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tasks SET updated_at = NOW() WHERE id = NEW.task_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_task_on_comment ON task_comments;
CREATE TRIGGER trigger_update_task_on_comment
    AFTER INSERT ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_task_on_comment();

-- =====================================================
-- UPDATE FRED NOTIFICATIONS TABLE
-- Add comment support
-- =====================================================
ALTER TABLE fred_notifications 
ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES task_comments(id) ON DELETE SET NULL;

-- =====================================================
-- VIEW: Active Tasks with Context for Fred
-- Shows tasks with their latest comment for context
-- =====================================================
CREATE OR REPLACE VIEW active_tasks_with_context AS
SELECT 
    t.*,
    p.name as project_name,
    COUNT(tc.id) as comment_count,
    (
        SELECT tc.content 
        FROM task_comments tc 
        WHERE tc.task_id = t.id 
        ORDER BY tc.created_at DESC 
        LIMIT 1
    ) as latest_comment,
    (
        SELECT tc.author
        FROM task_comments tc 
        WHERE tc.task_id = t.id 
        ORDER BY tc.created_at DESC 
        LIMIT 1
    ) as latest_comment_author
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN task_comments tc ON t.id = tc.task_id
WHERE t.status NOT IN ('done', 'archived')
GROUP BY t.id, p.name
ORDER BY t.priority DESC, t.due_date ASC;
