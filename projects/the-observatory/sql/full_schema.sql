-- Core Users Table
CREATE TABLE orchestrator.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id TEXT UNIQUE,
    email TEXT UNIQUE,
    timezone TEXT NOT NULL DEFAULT 'Europe/Oslo',
    notification_prefs JSONB DEFAULT '{"morning_briefing": true, "reminders": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE orchestrator.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read users" ON orchestrator.users FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update users" ON orchestrator.users FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon insert users" ON orchestrator.users FOR INSERT TO anon WITH CHECK (true);
-- Task Status and Priority Enums
CREATE TYPE orchestrator.task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled');
CREATE TYPE orchestrator.priority AS ENUM ('lowest', 'low', 'medium', 'high', 'urgent');

-- Projects Table
CREATE TABLE orchestrator.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366F1',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    parent_id UUID REFERENCES orchestrator.projects(id),
    sort_order INTEGER DEFAULT 0,
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Tasks Table (Core)
CREATE TABLE orchestrator.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES orchestrator.projects(id) ON DELETE SET NULL,
    
    -- Core fields
    title TEXT NOT NULL,
    description TEXT,
    status orchestrator.task_status DEFAULT 'backlog',
    priority orchestrator.priority DEFAULT 'medium',
    
    -- Scheduling
    due_date DATE,
    due_time TIME,
    due_datetime TIMESTAMPTZ GENERATED ALWAYS AS (
        CASE 
            WHEN due_date IS NULL THEN NULL
            WHEN due_time IS NULL THEN due_date::timestamptz
            ELSE (due_date::text || ' ' || due_time::text)::timestamptz
        END
    ) STORED,
    duration_minutes INTEGER DEFAULT 60,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    
    -- Source tracking
    source TEXT CHECK (source IN ('manual', 'telegram', 'airbnb', 'calendar', 'agent')),
    external_id TEXT,
    
    -- Recurrence and dependencies
    recurrence_rule TEXT,
    parent_id UUID REFERENCES orchestrator.tasks(id) ON DELETE CASCADE,
    reschedule_count INTEGER DEFAULT 0,
    
    -- Energy and context
    energy_required TEXT CHECK (energy_required IN ('low', 'medium', 'high')),
    context JSONB DEFAULT '{}'::jsonb,
    
    -- Completion
    completed_at TIMESTAMPTZ,
    completed_by TEXT,
    
    -- Concurrency control
    version INTEGER DEFAULT 1,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, external_id)
);

-- Task Dependencies
CREATE TABLE orchestrator.task_dependencies (
    task_id UUID REFERENCES orchestrator.tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES orchestrator.tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (task_id, depends_on_task_id)
);

-- Task History (Audit Trail)
CREATE TABLE orchestrator.task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES orchestrator.tasks(id) ON DELETE CASCADE,
    changed_by TEXT,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX idx_tasks_user_status ON orchestrator.tasks(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due ON orchestrator.tasks(due_date) WHERE status NOT IN ('done', 'cancelled') AND deleted_at IS NULL;
CREATE INDEX idx_tasks_scheduled ON orchestrator.tasks(scheduled_start) WHERE scheduled_start IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_tasks_project ON orchestrator.tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_user ON orchestrator.projects(user_id) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE orchestrator.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.task_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow anon read projects" ON orchestrator.projects FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert projects" ON orchestrator.projects FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update projects" ON orchestrator.projects FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon read tasks" ON orchestrator.tasks FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert tasks" ON orchestrator.tasks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update tasks" ON orchestrator.tasks FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete tasks" ON orchestrator.tasks FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read dependencies" ON orchestrator.task_dependencies FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert dependencies" ON orchestrator.task_dependencies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon delete dependencies" ON orchestrator.task_dependencies FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read history" ON orchestrator.task_history FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert history" ON orchestrator.task_history FOR INSERT TO anon WITH CHECK (true);
-- Reminders Table (One-Time Only)
CREATE TABLE orchestrator.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    
    -- What we're reminding about
    entity_type TEXT NOT NULL CHECK (entity_type IN ('event', 'task', 'standalone')),
    entity_id UUID,
    
    -- Reminder configuration
    remind_at TIMESTAMPTZ NOT NULL,
    message TEXT,
    method TEXT[] DEFAULT ARRAY['telegram'],
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed', 'snoozed')),
    sent_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    snoozed_until TIMESTAMPTZ,
    
    -- Snooze tracking
    snooze_count INTEGER DEFAULT 0,
    
    -- IDEMPOTENCY KEY - Prevents duplicates
    idempotency_key TEXT GENERATED ALWAYS AS (
        COALESCE(user_id::text, '') || ':' || 
        COALESCE(entity_type, '') || ':' || 
        COALESCE(entity_id::text, 'standalone') || ':' || 
        COALESCE(remind_at::text, '')
    ) STORED UNIQUE,
    
    -- Version for optimistic locking
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Delivery Log (For audit and deduplication)
CREATE TABLE orchestrator.delivery_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_id UUID REFERENCES orchestrator.reminders(id) ON DELETE CASCADE,
    method TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'retrying')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled Jobs (One-time cron jobs)
CREATE TABLE orchestrator.scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    
    job_type TEXT NOT NULL CHECK (job_type IN (
        'reminder', 'sync_calendar', 'sync_airbnb', 'morning_briefing', 
        'end_of_day_review', 'auto_reschedule', 'health_check'
    )),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Processing tracking
    processed_at TIMESTAMPTZ,
    processed_by TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Deduplication
    dedup_key TEXT UNIQUE,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- System Health Log
CREATE TABLE orchestrator.system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ok', 'warning', 'critical')),
    details JSONB DEFAULT '{}'::jsonb,
    checked_at TIMESTAMPTZ DEFAULT now()
);

-- User Context (For AI state preservation)
CREATE TABLE orchestrator.user_context (
    user_id UUID PRIMARY KEY REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    last_conversation_at TIMESTAMPTZ,
    last_viewed_page TEXT,
    pending_confirmation JSONB DEFAULT '{}'::jsonb,
    context_data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX idx_reminders_pending ON orchestrator.reminders(remind_at) 
    WHERE status = 'pending' AND remind_at <= now() + interval '1 hour';
CREATE INDEX idx_reminders_user ON orchestrator.reminders(user_id, status);
CREATE INDEX idx_reminders_entity ON orchestrator.reminders(entity_type, entity_id);

CREATE INDEX idx_jobs_pending ON orchestrator.scheduled_jobs(scheduled_for) 
    WHERE status = 'pending';
CREATE INDEX idx_jobs_user ON orchestrator.scheduled_jobs(user_id, status);

CREATE INDEX idx_health_checked ON orchestrator.system_health(checked_at DESC);

-- Enable RLS
ALTER TABLE orchestrator.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.user_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow anon read reminders" ON orchestrator.reminders FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert reminders" ON orchestrator.reminders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update reminders" ON orchestrator.reminders FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete reminders" ON orchestrator.reminders FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read delivery_log" ON orchestrator.delivery_log FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert delivery_log" ON orchestrator.delivery_log FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon read scheduled_jobs" ON orchestrator.scheduled_jobs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert scheduled_jobs" ON orchestrator.scheduled_jobs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update scheduled_jobs" ON orchestrator.scheduled_jobs FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon read system_health" ON orchestrator.system_health FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert system_health" ON orchestrator.system_health FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon read user_context" ON orchestrator.user_context FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update user_context" ON orchestrator.user_context FOR UPDATE TO anon USING (true);
-- Calendar Table
CREATE TABLE orchestrator.calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'outlook', 'internal')),
    external_id TEXT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4285F4',
    sync_token TEXT,
    last_synced_at TIMESTAMPTZ,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider, external_id)
);

-- Calendar Events
CREATE TABLE orchestrator.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL REFERENCES orchestrator.calendars(id) ON DELETE CASCADE,
    external_id TEXT,
    
    -- Event details
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    
    -- Timing (stored in UTC)
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Europe/Oslo',
    is_all_day BOOLEAN DEFAULT false,
    
    -- Recurrence
    recurrence_rule TEXT,
    recurrence_parent_id UUID REFERENCES orchestrator.events(id),
    is_exception BOOLEAN DEFAULT false,
    
    -- Sync & deduplication
    etag TEXT,
    ical_uid TEXT UNIQUE,
    fingerprint TEXT GENERATED ALWAYS AS (
        md5(COALESCE(external_id, '') || '|' || COALESCE(etag, ''))
    ) STORED,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(calendar_id, external_id)
);

-- Cabins (Airbnb)
CREATE TABLE orchestrator.cabins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    airbnb_listing_id TEXT UNIQUE,
    checkin_time TIME DEFAULT '15:00',
    checkout_time TIME DEFAULT '11:00',
    cleaning_duration_minutes INTEGER DEFAULT 240,
    buffer_minutes INTEGER DEFAULT 30,
    auto_cleaning_schedule BOOLEAN DEFAULT true,
    auto_guest_messages BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings
CREATE TABLE orchestrator.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabin_id UUID NOT NULL REFERENCES orchestrator.cabins(id) ON DELETE CASCADE,
    
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    guest_phone TEXT,
    guest_count INTEGER,
    
    airbnb_confirmation_code TEXT,
    booking_source TEXT DEFAULT 'airbnb' CHECK (booking_source IN ('airbnb', 'direct', 'bookingcom')),
    
    checkin_date DATE NOT NULL,
    checkout_date DATE NOT NULL,
    
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('inquiry', 'pending', 'confirmed', 'cancelled', 'completed')),
    
    total_amount DECIMAL(10,2),
    currency TEXT DEFAULT 'NOK',
    
    last_synced_at TIMESTAMPTZ,
    sync_fingerprint TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(cabin_id, airbnb_confirmation_code)
);

-- Cleaning Schedules
CREATE TABLE orchestrator.cleaning_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabin_id UUID NOT NULL REFERENCES orchestrator.cabins(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES orchestrator.bookings(id) ON DELETE CASCADE,
    
    scheduled_date DATE NOT NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    
    type TEXT NOT NULL CHECK (type IN ('checkout', 'mid_stay', 'maintenance')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'skipped')),
    
    assigned_to TEXT,
    notes TEXT,
    
    task_id UUID REFERENCES orchestrator.tasks(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hour Tracking / Finance
CREATE TABLE orchestrator.hour_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    client TEXT NOT NULL CHECK (client IN ('stephan_trond', 'by_taxi', 'treffen', 'other')),
    description TEXT,
    
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_hours DECIMAL(4,2),
    
    rate_nok INTEGER NOT NULL,
    mva_rate DECIMAL(3,2) DEFAULT 1.25,
    total_nok DECIMAL(10,2) GENERATED ALWAYS AS (
        (duration_hours * rate_nok * mva_rate)
    ) STORED,
    
    invoiced BOOLEAN DEFAULT false,
    invoiced_at TIMESTAMPTZ,
    invoice_number TEXT,
    
    source TEXT CHECK (source IN ('manual', 'calendar', 'agent')),
    event_id UUID REFERENCES orchestrator.events(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX idx_events_calendar ON orchestrator.events(calendar_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_time_range ON orchestrator.events(starts_at, ends_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_cabin ON orchestrator.bookings(cabin_id);
CREATE INDEX idx_bookings_dates ON orchestrator.bookings(checkin_date, checkout_date);
CREATE INDEX idx_cleaning_cabin ON orchestrator.cleaning_schedules(cabin_id, scheduled_date);
CREATE INDEX idx_hours_user_date ON orchestrator.hour_entries(user_id, date);

-- Enable RLS
ALTER TABLE orchestrator.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.cabins ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.cleaning_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.hour_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow anon read calendars" ON orchestrator.calendars FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert calendars" ON orchestrator.calendars FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update calendars" ON orchestrator.calendars FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon read events" ON orchestrator.events FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert events" ON orchestrator.events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update events" ON orchestrator.events FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete events" ON orchestrator.events FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read cabins" ON orchestrator.cabins FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert cabins" ON orchestrator.cabins FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update cabins" ON orchestrator.cabins FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon read bookings" ON orchestrator.bookings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert bookings" ON orchestrator.bookings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update bookings" ON orchestrator.bookings FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon read cleaning" ON orchestrator.cleaning_schedules FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert cleaning" ON orchestrator.cleaning_schedules FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update cleaning" ON orchestrator.cleaning_schedules FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon read hours" ON orchestrator.hour_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert hours" ON orchestrator.hour_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update hours" ON orchestrator.hour_entries FOR UPDATE TO anon USING (true);
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
