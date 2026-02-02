-- Observatory Database Schema
-- Creates tables for Mission Control, Kanban, Research Reader, and future modules

-- Enable RLS (Row Level Security) on all tables

-- Tasks table (for Kanban)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    project TEXT,
    tags TEXT[] DEFAULT '{}',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research notes table
CREATE TABLE IF NOT EXISTS research_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    topic TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    start_date DATE,
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily focus table (for Mission Control)
CREATE TABLE IF NOT EXISTS daily_focus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    focus_text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fitness metrics table (for Fitness Lab)
CREATE TABLE IF NOT EXISTS fitness_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    body_battery INTEGER,
    vo2_max INTEGER,
    resting_heart_rate INTEGER,
    stress_score INTEGER,
    sleep_score INTEGER,
    steps INTEGER,
    calories INTEGER,
    active_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Finance entries table (for Finance module)
CREATE TABLE IF NOT EXISTS finance_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'NOK',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hours tracking table
CREATE TABLE IF NOT EXISTS hours_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    employer TEXT NOT NULL, -- 'Fåvang Varetaxi' or 'Treffen'
    hours DECIMAL(4, 2) NOT NULL,
    rate_type TEXT NOT NULL CHECK (rate_type IN ('day', 'night', 'treffen')),
    amount DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_notes_updated_at BEFORE UPDATE ON research_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_focus_updated_at BEFORE UPDATE ON daily_focus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fitness_metrics_updated_at BEFORE UPDATE ON fitness_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_entries_updated_at BEFORE UPDATE ON finance_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hours_tracking_updated_at BEFORE UPDATE ON hours_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing

-- Sample tasks
INSERT INTO tasks (title, description, status, priority, project, tags) VALUES
('Complete Observatory MVP', 'Build Mission Control, Kanban, and Research Reader modules', 'in_progress', 'high', 'Observatory', ARRAY['dev', 'mvp']),
('Apply for Kartverket Matrikkel agreement', 'Submit application for property owner lookup access', 'todo', 'high', '3dje Boligsektor', ARRAY['legal', 'api']),
('Connect iGMS OAuth', 'Test the iGMS integration for Kvitfjellhytter dashboard', 'todo', 'medium', 'Kvitfjellhytter', ARRAY['integration']),
('Set up Garmin sync', 'Connect Fitness Lab to Garmin Connect API', 'todo', 'medium', 'Observatory', ARRAY['fitness', 'api']),
('Research kommune analysis', 'Find top municipalities for social housing development', 'done', 'high', '3dje Boligsektor', ARRAY['research', 'analysis']);

-- Sample research notes
INSERT INTO research_notes (title, content, topic, tags, source_url) VALUES
(
    'SIBO Protocol - Dr. William Davis',
    'L. reuteri yogurt (36-hour fermented) helps restore gut microbiome. Key points:
    - Use specific strains: DSM 17938 and ATCC PTA 6475
    - Ferment at 100°F for 36 hours
    - Consume 1/2 cup daily
    - Combine with prebiotic fibers (green banana flour, inulin)
    - Track symptoms: bloating, energy, mood',
    'Health',
    ARRAY['sibo', 'gut-health', 'probiotics'],
    'https://drdavisinfinitehealth.com/'
),
(
    'Kartverket Matrikkel API Overview',
    'Matrikkelen API provides property boundary and owner data:
    - Requires agreement for production access
    - Free tier available for testing
    - RESTful API with JSON responses
    - Key endpoints: /eiendom, /eiendomsrettigheter, /person
    - Rate limits: 1000 req/day for testing',
    'Tech',
    ARRAY['api', 'kartverket', 'real-estate'],
    'https://www.geonorge.no/aktuelt/om-geonorge/slik-bruker-du-apiene/'
),
(
    '3dje Boligsektor - Business Model',
    'Revenue model for tomte-sourcing system:
    - Setup fee: 5,000 NOK per municipality
    - Monthly retainer tiers:
      * Basic (5-10 lots): 15,000 NOK/month
      * Standard (11-25 lots): 25,000 NOK/month
      * Premium (25+ lots): 40,000 NOK/month
    - Success fee: 2% of land value upon sale
    - Target: 3 municipalities by end of Q1',
    'Business',
    ARRAY['boligsektor', 'pricing', 'strategy'],
    NULL
);

-- Sample projects
INSERT INTO projects (name, description, status, priority, start_date, target_date) VALUES
('Observatory Dashboard', 'Personal command center for life and business management', 'active', 'high', '2026-02-01', '2026-02-15'),
('3dje Boligsektor MVP', 'Tomte-sourcing system with differanse algorithm', 'active', 'high', '2026-02-01', '2026-02-07'),
('Kvitfjellhytter Website', 'Complete owner dashboard and guest-facing website', 'active', 'medium', '2026-01-15', '2026-02-28'),
('Fitness Transformation Content', 'Document gut health and fitness journey for YouTube', 'paused', 'low', '2026-01-01', '2026-06-01');

-- Sample daily focus
INSERT INTO daily_focus (date, focus_text, completed) VALUES
(CURRENT_DATE, 'Complete Observatory database setup and test all modules', FALSE);

-- Enable Row Level Security (but allow all operations for now since it's personal use)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_focus ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hours_tracking ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (since this is single-user)
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON research_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON daily_focus FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON fitness_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON finance_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON hours_tracking FOR ALL USING (true) WITH CHECK (true);
