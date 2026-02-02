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
    
    -- IDEMPOTENCY KEY - Prevents duplicates (set by application)
    idempotency_key TEXT UNIQUE,
    
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
CREATE INDEX idx_reminders_pending ON orchestrator.reminders(remind_at, status) 
    WHERE status = 'pending';
CREATE INDEX idx_reminders_user ON orchestrator.reminders(user_id, status);
CREATE INDEX idx_reminders_entity ON orchestrator.reminders(entity_type, entity_id);

CREATE INDEX idx_jobs_pending ON orchestrator.scheduled_jobs(scheduled_for, status) 
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
