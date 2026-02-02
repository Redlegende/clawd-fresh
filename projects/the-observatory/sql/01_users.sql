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
