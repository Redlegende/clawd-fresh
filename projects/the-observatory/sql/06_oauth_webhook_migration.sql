-- Migration: Add Google OAuth and webhook support to calendars table
-- Run this in Supabase SQL Editor

-- Add columns needed for Google Calendar OAuth and webhooks
ALTER TABLE orchestrator.calendars 
ADD COLUMN IF NOT EXISTS provider_account_id TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scopes TEXT[],
ADD COLUMN IF NOT EXISTS webhook_channel_id TEXT,
ADD COLUMN IF NOT EXISTS webhook_resource_id TEXT,
ADD COLUMN IF NOT EXISTS webhook_expiration TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS calendars JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true;

-- Add columns for events that match our API code
ALTER TABLE orchestrator.events
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES orchestrator.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS calendar_id_text TEXT, -- for external calendar ID
ADD COLUMN IF NOT EXISTS external_event_id TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS html_link TEXT,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error'));

-- Add scheduled task columns
ALTER TABLE orchestrator.tasks
ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS energy_level TEXT CHECK (energy_level IN ('high', 'medium', 'low'));

-- Update existing calendar to have email if name looks like email
UPDATE orchestrator.calendars 
SET email = name 
WHERE email IS NULL AND name LIKE '%@%';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendars_user_provider ON orchestrator.calendars(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_calendars_webhook ON orchestrator.calendars(webhook_channel_id) WHERE webhook_channel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_external_id ON orchestrator.events(external_event_id) WHERE external_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_user_time ON orchestrator.events(user_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON orchestrator.tasks(scheduled_start) WHERE scheduled_start IS NOT NULL;

-- Add comments
COMMENT ON COLUMN orchestrator.calendars.provider_account_id IS 'Google account ID from OAuth';
COMMENT ON COLUMN orchestrator.calendars.access_token IS 'OAuth access token (encrypted in production)';
COMMENT ON COLUMN orchestrator.calendars.refresh_token IS 'OAuth refresh token for long-term access';
COMMENT ON COLUMN orchestrator.calendars.webhook_channel_id IS 'Google Calendar API webhook channel ID';
COMMENT ON COLUMN orchestrator.calendars.webhook_resource_id IS 'Google Calendar API webhook resource ID';
COMMENT ON COLUMN orchestrator.calendars.calendars IS 'JSON array of accessible calendars from provider';

COMMENT ON COLUMN orchestrator.events.external_event_id IS 'Original event ID from provider (e.g., Google)';
COMMENT ON COLUMN orchestrator.events.calendar_id_text IS 'External calendar ID string (for multi-calendar sync)';
COMMENT ON COLUMN orchestrator.events.sync_status IS 'Sync state: pending, synced, error';

COMMENT ON COLUMN orchestrator.tasks.scheduled_start IS 'When this task is scheduled to start';
COMMENT ON COLUMN orchestrator.tasks.scheduled_end IS 'When this task is scheduled to end';
COMMENT ON COLUMN orchestrator.tasks.energy_level IS 'High/medium/low - for optimal time slot matching';
