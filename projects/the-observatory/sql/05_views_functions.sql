-- View: Active Tasks for Dashboard
CREATE OR REPLACE VIEW orchestrator.active_tasks AS
SELECT 
    t.*,
    p.name as project_name,
    p.color as project_color
FROM orchestrator.tasks t
LEFT JOIN orchestrator.projects p ON t.project_id = p.id
WHERE t.status NOT IN ('done', 'cancelled')
    AND t.deleted_at IS NULL
ORDER BY 
    CASE t.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
    END,
    t.due_date ASC NULLS LAST,
    t.created_at ASC;

-- View: Today's Schedule
CREATE OR REPLACE VIEW orchestrator.todays_schedule AS
SELECT 
    e.*,
    c.name as calendar_name,
    c.color as calendar_color
FROM orchestrator.events e
JOIN orchestrator.calendars c ON e.calendar_id = c.id
WHERE e.starts_at::date = CURRENT_DATE
    AND e.deleted_at IS NULL
ORDER BY e.starts_at ASC;

-- View: Pending Reminders
CREATE OR REPLACE VIEW orchestrator.pending_reminders AS
SELECT 
    r.*,
    u.telegram_id,
    u.timezone
FROM orchestrator.reminders r
JOIN orchestrator.users u ON r.user_id = u.id
WHERE r.status = 'pending'
    AND r.remind_at <= now() + interval '1 hour'
ORDER BY r.remind_at ASC;

-- View: System Health Status
CREATE OR REPLACE VIEW orchestrator.health_status AS
SELECT 
    'overdue_reminders' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'ok'
        WHEN COUNT(*) < 5 THEN 'warning'
        ELSE 'critical'
    END as status
FROM orchestrator.reminders
WHERE status = 'pending' AND remind_at < now() - interval '1 hour'

UNION ALL

SELECT 
    'overdue_tasks' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'ok'
        WHEN COUNT(*) < 10 THEN 'warning'
        ELSE 'critical'
    END as status
FROM orchestrator.tasks
WHERE status NOT IN ('done', 'cancelled')
    AND due_date < CURRENT_DATE
    AND deleted_at IS NULL

UNION ALL

SELECT 
    'failed_jobs' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'ok'
        WHEN COUNT(*) < 5 THEN 'warning'
        ELSE 'critical'
    END as status
FROM orchestrator.scheduled_jobs
WHERE status = 'failed'

UNION ALL

SELECT 
    'pending_jobs' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) < 10 THEN 'ok'
        WHEN COUNT(*) < 50 THEN 'warning'
        ELSE 'critical'
    END as status
FROM orchestrator.scheduled_jobs
WHERE status = 'pending' AND scheduled_for < now();

-- Function: Create Task with History
CREATE OR REPLACE FUNCTION orchestrator.create_task(
    p_user_id UUID,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'backlog',
    p_priority TEXT DEFAULT 'medium',
    p_due_date DATE DEFAULT NULL,
    p_project_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_task_id UUID;
BEGIN
    INSERT INTO orchestrator.tasks (
        user_id, title, description, status, priority, due_date, project_id
    ) VALUES (
        p_user_id, p_title, p_description, p_status, p_priority, p_due_date, p_project_id
    ) RETURNING id INTO v_task_id;
    
    INSERT INTO orchestrator.task_history (task_id, changed_by, new_values, reason)
    VALUES (v_task_id, 'user', jsonb_build_object(
        'title', p_title,
        'status', p_status,
        'priority', p_priority
    ), 'created');
    
    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Complete Task
CREATE OR REPLACE FUNCTION orchestrator.complete_task(
    p_task_id UUID,
    p_completed_by TEXT DEFAULT 'user'
) RETURNS BOOLEAN AS $$
DECLARE
    v_task orchestrator.tasks%ROWTYPE;
BEGIN
    SELECT * INTO v_task FROM orchestrator.tasks WHERE id = p_task_id;
    
    IF v_task.status = 'done' THEN
        RETURN false; -- Already completed
    END IF;
    
    UPDATE orchestrator.tasks 
    SET status = 'done',
        completed_at = now(),
        completed_by = p_completed_by,
        updated_at = now()
    WHERE id = p_task_id;
    
    INSERT INTO orchestrator.task_history (task_id, changed_by, old_values, new_values, reason)
    VALUES (p_task_id, p_completed_by, 
        jsonb_build_object('status', v_task.status),
        jsonb_build_object('status', 'done'),
        'completed');
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function: Reschedule Task with Limit
CREATE OR REPLACE FUNCTION orchestrator.reschedule_task(
    p_task_id UUID,
    p_new_scheduled_start TIMESTAMPTZ,
    p_new_scheduled_end TIMESTAMPTZ,
    p_reason TEXT DEFAULT 'manual'
) RETURNS BOOLEAN AS $$
DECLARE
    v_task orchestrator.tasks%ROWTYPE;
BEGIN
    SELECT * INTO v_task FROM orchestrator.tasks WHERE id = p_task_id;
    
    IF v_task.reschedule_count >= 3 THEN
        -- Escalate to urgent instead of rescheduling
        UPDATE orchestrator.tasks 
        SET priority = 'urgent',
            context = jsonb_set(
                COALESCE(context, '{}'::jsonb),
                '{reschedule_limit_reached}',
                'true'::jsonb
            ),
            updated_at = now()
        WHERE id = p_task_id;
        
        RETURN false;
    END IF;
    
    UPDATE orchestrator.tasks 
    SET scheduled_start = p_new_scheduled_start,
        scheduled_end = p_new_scheduled_end,
        reschedule_count = reschedule_count + 1,
        context = jsonb_set(
            COALESCE(context, '{}'::jsonb),
            '{rescheduled_from}',
            to_jsonb(v_task.scheduled_start)
        ),
        updated_at = now()
    WHERE id = p_task_id;
    
    INSERT INTO orchestrator.task_history (task_id, changed_by, old_values, new_values, reason)
    VALUES (p_task_id, 'system', 
        jsonb_build_object('scheduled_start', v_task.scheduled_start),
        jsonb_build_object('scheduled_start', p_new_scheduled_start),
        p_reason);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function: Create One-Time Reminder
CREATE OR REPLACE FUNCTION orchestrator.create_reminder(
    p_user_id UUID,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_remind_at TIMESTAMPTZ,
    p_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_reminder_id UUID;
BEGIN
    INSERT INTO orchestrator.reminders (
        user_id, entity_type, entity_id, remind_at, message
    ) VALUES (
        p_user_id, p_entity_type, p_entity_id, p_remind_at, p_message
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id INTO v_reminder_id;
    
    RETURN v_reminder_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark Reminder Sent (Idempotent)
CREATE OR REPLACE FUNCTION orchestrator.mark_reminder_sent(
    p_reminder_id UUID,
    p_method TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_reminder orchestrator.reminders%ROWTYPE;
BEGIN
    SELECT * INTO v_reminder FROM orchestrator.reminders WHERE id = p_reminder_id;
    
    -- Already sent, prevent duplicate
    IF v_reminder.status = 'sent' THEN
        RETURN false;
    END IF;
    
    -- Check delivery log for this method
    IF EXISTS (
        SELECT 1 FROM orchestrator.delivery_log 
        WHERE reminder_id = p_reminder_id AND method = p_method AND status = 'success'
    ) THEN
        RETURN false;
    END IF;
    
    UPDATE orchestrator.reminders 
    SET status = 'sent', sent_at = now(), updated_at = now()
    WHERE id = p_reminder_id;
    
    INSERT INTO orchestrator.delivery_log (reminder_id, method, status)
    VALUES (p_reminder_id, p_method, 'success');
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Daily Briefing Data
CREATE OR REPLACE FUNCTION orchestrator.get_daily_briefing(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'date', CURRENT_DATE,
        'schedule', (
            SELECT jsonb_agg(jsonb_build_object(
                'id', e.id,
                'title', e.title,
                'starts_at', e.starts_at,
                'ends_at', e.ends_at,
                'location', e.location
            ) ORDER BY e.starts_at)
            FROM orchestrator.events e
            JOIN orchestrator.calendars c ON e.calendar_id = c.id
            WHERE c.user_id = p_user_id
                AND e.starts_at::date = CURRENT_DATE
                AND e.deleted_at IS NULL
        ),
        'urgent_tasks', (
            SELECT jsonb_agg(jsonb_build_object(
                'id', t.id,
                'title', t.title,
                'priority', t.priority,
                'due_date', t.due_date
            ) ORDER BY t.due_date)
            FROM orchestrator.tasks t
            WHERE t.user_id = p_user_id
                AND t.priority = 'urgent'
                AND t.status NOT IN ('done', 'cancelled')
                AND t.deleted_at IS NULL
        ),
        'overdue_tasks', (
            SELECT jsonb_agg(jsonb_build_object(
                'id', t.id,
                'title', t.title,
                'due_date', t.due_date,
                'reschedule_count', t.reschedule_count
            ) ORDER BY t.due_date)
            FROM orchestrator.tasks t
            WHERE t.user_id = p_user_id
                AND t.status NOT IN ('done', 'cancelled')
                AND t.due_date < CURRENT_DATE
                AND t.deleted_at IS NULL
        ),
        'upcoming_bookings', (
            SELECT jsonb_agg(jsonb_build_object(
                'id', b.id,
                'cabin_name', c.name,
                'guest_name', b.guest_name,
                'checkin_date', b.checkin_date,
                'checkout_date', b.checkout_date
            ) ORDER BY b.checkin_date)
            FROM orchestrator.bookings b
            JOIN orchestrator.cabins c ON b.cabin_id = c.id
            WHERE c.user_id = p_user_id
                AND b.checkin_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '7 days'
                AND b.status = 'confirmed'
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function: Cleanup Old Data (Run monthly)
CREATE OR REPLACE FUNCTION orchestrator.archive_old_data()
RETURNS void AS $$
BEGIN
    -- Archive completed tasks older than 1 year
    UPDATE orchestrator.tasks 
    SET deleted_at = now()
    WHERE status = 'done' 
        AND completed_at < now() - interval '1 year'
        AND deleted_at IS NULL;
    
    -- Delete old delivery logs (keep 3 months)
    DELETE FROM orchestrator.delivery_log
    WHERE created_at < now() - interval '3 months';
    
    -- Delete old system health checks (keep 1 month)
    DELETE FROM orchestrator.system_health
    WHERE checked_at < now() - interval '1 month';
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamps
CREATE OR REPLACE FUNCTION orchestrator.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON orchestrator.users
    FOR EACH ROW EXECUTE FUNCTION orchestrator.update_updated_at();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON orchestrator.tasks
    FOR EACH ROW EXECUTE FUNCTION orchestrator.update_updated_at();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON orchestrator.projects
    FOR EACH ROW EXECUTE FUNCTION orchestrator.update_updated_at();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON orchestrator.reminders
    FOR EACH ROW EXECUTE FUNCTION orchestrator.update_updated_at();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON orchestrator.events
    FOR EACH ROW EXECUTE FUNCTION orchestrator.update_updated_at();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON orchestrator.bookings
    FOR EACH ROW EXECUTE FUNCTION orchestrator.update_updated_at();
