-- Task Sync System Schema (Public Schema)
-- Adds tables for webhook-based task synchronization with Fred

-- =====================================================
-- FRED NOTIFICATIONS QUEUE
-- Messages from Kanban → Fred
-- =====================================================
CREATE TABLE IF NOT EXISTS fred_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    task_id UUID,
    task_title VARCHAR(500),
    task_data JSONB,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fred_notifications_unread ON fred_notifications(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_fred_notifications_created ON fred_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fred_notifications_task ON fred_notifications(task_id);

-- =====================================================
-- TASK SYNC LOG
-- Audit trail of all task sync events
-- =====================================================
CREATE TABLE IF NOT EXISTS task_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    task_id UUID,
    task_title VARCHAR(500),
    project_id UUID,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    completed_by VARCHAR(100),
    completed_at TIMESTAMP WITH TIME ZONE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    webhook_status VARCHAR(20) DEFAULT 'pending',
    webhook_response JSONB,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_task_sync_log_task ON task_sync_log(task_id);
CREATE INDEX IF NOT EXISTS idx_task_sync_log_synced ON task_sync_log(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_sync_log_event ON task_sync_log(event_type);

-- =====================================================
-- OUTBOUND TASK ACTIONS
-- Actions Fred wants to take on tasks
-- =====================================================
CREATE TABLE IF NOT EXISTS outbound_task_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID,
    action VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbound_actions_status ON outbound_task_actions(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_outbound_actions_task ON outbound_task_actions(task_id);

-- =====================================================
-- VIEW: Fred's Unread Notifications
-- =====================================================
CREATE OR REPLACE VIEW fred_unread_notifications AS
SELECT 
    fn.*,
    t.status as current_task_status,
    t.priority as current_task_priority
FROM fred_notifications fn
LEFT JOIN tasks t ON fn.task_id = t.id
WHERE fn.read = FALSE
ORDER BY fn.created_at DESC;

-- =====================================================
-- VIEW: Recently Completed Tasks
-- =====================================================
CREATE OR REPLACE VIEW recently_completed AS
SELECT 
    t.*,
    p.name as project_name,
    tsl.completed_by,
    tsl.synced_at as completed_synced_at
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN task_sync_log tsl ON t.id = tsl.task_id AND tsl.event_type = 'completed'
WHERE t.status = 'done'
    AND t.completed_at > NOW() - INTERVAL '24 hours'
ORDER BY t.completed_at DESC;

-- =====================================================
-- Add columns to tasks table if they don't exist
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'completed_by') THEN
        ALTER TABLE tasks ADD COLUMN completed_by VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'completed_at') THEN
        ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- =====================================================
-- FUNCTION: Mark Notification Read
-- =====================================================
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE fred_notifications 
    SET read = TRUE,
        read_at = NOW(),
        acknowledged = TRUE,
        acknowledged_at = NOW()
    WHERE id = p_notification_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
