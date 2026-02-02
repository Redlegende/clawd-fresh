-- The Observatory Database Schema
-- For Supabase PostgreSQL
-- Created: 2026-02-01

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROJECTS TABLE
-- Track all active projects and their health
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    folder_path VARCHAR(500),
    github_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_completion DATE,
    owner_id UUID REFERENCES auth.users(id)
);

-- Index for quick lookups
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);

-- =====================================================
-- TASKS TABLE (Kanban)
-- All todos across projects
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES auth.users(id),
    due_date DATE,
    estimated_hours DECIMAL(4,1),
    actual_hours DECIMAL(4,1),
    tags TEXT[], -- Array of tags
    source VARCHAR(100), -- e.g., 'TODO.md', 'cron', 'manual'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- =====================================================
-- FITNESS METRICS TABLE
-- Garmin data and other health metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS fitness_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id),
    
    -- Garmin metrics
    body_battery INTEGER CHECK (body_battery >= 0 AND body_battery <= 100),
    vo2_max DECIMAL(4,1),
    hrv DECIMAL(5,2), -- Heart rate variability (ms)
    sleep_score INTEGER CHECK (sleep_score >= 0 AND sleep_score <= 100),
    sleep_hours DECIMAL(4,2),
    resting_hr INTEGER,
    steps INTEGER,
    calories_burned INTEGER,
    
    -- Manual entries
    weight_kg DECIMAL(5,2),
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    energy_score INTEGER CHECK (energy_score >= 1 AND energy_score >= 10),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fitness_date ON fitness_metrics(date);
CREATE INDEX idx_fitness_user ON fitness_metrics(user_id);

-- =====================================================
-- FINANCE ENTRIES TABLE
-- Hours worked and earnings tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS finance_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    
    date DATE NOT NULL,
    source VARCHAR(100) NOT NULL, -- 'Fåvang Varetaxi', 'Treffen', 'Kvitfjellhytter', etc.
    description TEXT,
    
    -- Hours and rates
    hours DECIMAL(4,2) NOT NULL,
    rate_nok DECIMAL(8,2) NOT NULL, -- Hourly rate in NOK
    mva_rate DECIMAL(4,2) DEFAULT 1.25, -- Usually 25% MVA = 1.25 multiplier
    
    -- Calculated fields (can be computed, but stored for performance)
    subtotal_nok DECIMAL(10,2) GENERATED ALWAYS AS (hours * rate_nok) STORED,
    total_nok DECIMAL(10,2) GENERATED ALWAYS AS (hours * rate_nok * mva_rate) STORED,
    
    -- Status
    invoiced BOOLEAN DEFAULT FALSE,
    invoiced_at TIMESTAMP WITH TIME ZONE,
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_finance_date ON finance_entries(date);
CREATE INDEX idx_finance_source ON finance_entries(source);
CREATE INDEX idx_finance_invoiced ON finance_entries(invoiced);
CREATE INDEX idx_finance_paid ON finance_entries(paid);

-- =====================================================
-- RESEARCH NOTES TABLE
-- Metadata for markdown research files
-- =====================================================
CREATE TABLE IF NOT EXISTS research_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL, -- URL-friendly identifier
    
    -- File location
    file_path VARCHAR(1000) NOT NULL,
    file_hash VARCHAR(64), -- For tracking changes
    file_size_bytes INTEGER,
    
    -- Organization
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    tags TEXT[],
    category VARCHAR(100), -- e.g., 'AI', 'Health', 'Business'
    
    -- Content summary (auto-generated)
    summary TEXT,
    key_insights TEXT[],
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'archived', 'obsolete')),
    
    -- Reading tracking
    read_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE -- When last synced from filesystem
);

CREATE INDEX idx_research_project ON research_notes(project_id);
CREATE INDEX idx_research_tags ON research_notes USING GIN(tags);
CREATE INDEX idx_research_category ON research_notes(category);
CREATE INDEX idx_research_status ON research_notes(status);

-- Full-text search on research notes
ALTER TABLE research_notes ADD COLUMN IF NOT EXISTS search_vector tsvector 
    GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || COALESCE(summary, ''))) STORED;
CREATE INDEX idx_research_search ON research_notes USING GIN(search_vector);

-- =====================================================
-- AUTOMATED UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fitness_metrics_updated_at BEFORE UPDATE ON fitness_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finance_entries_updated_at BEFORE UPDATE ON finance_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_notes_updated_at BEFORE UPDATE ON research_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Projects: Users can only see their own projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own projects" ON projects
    FOR ALL USING (owner_id = auth.uid());

-- Tasks: Users can only see their own tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own tasks" ON tasks
    FOR ALL USING (assignee_id = auth.uid());

-- Fitness metrics: Users can only see their own data
ALTER TABLE fitness_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own fitness data" ON fitness_metrics
    FOR ALL USING (user_id = auth.uid());

-- Finance entries: Users can only see their own entries
ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own finance entries" ON finance_entries
    FOR ALL USING (user_id = auth.uid());

-- Research notes: Users can see all notes (shared knowledge)
ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can read research notes" ON research_notes
    FOR SELECT USING (true);
CREATE POLICY "Users can CRUD own research notes" ON research_notes
    FOR ALL USING (true); -- Adjust if needed for multi-user

-- =====================================================
-- VIEWS FOR CONVENIENCE
-- =====================================================

-- Active tasks with project names
CREATE OR REPLACE VIEW active_tasks AS
SELECT 
    t.*,
    p.name as project_name,
    p.status as project_status
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.status NOT IN ('done', 'archived')
ORDER BY t.priority DESC, t.due_date ASC;

-- Monthly finance summary
CREATE OR REPLACE VIEW monthly_finance_summary AS
SELECT 
    DATE_TRUNC('month', date) as month,
    source,
    COUNT(*) as entries,
    SUM(hours) as total_hours,
    SUM(subtotal_nok) as total_subtotal,
    SUM(total_nok) as total_with_mva
FROM finance_entries
GROUP BY DATE_TRUNC('month', date), source
ORDER BY month DESC, source;

-- Fitness weekly averages
CREATE OR REPLACE VIEW fitness_weekly_avg AS
SELECT 
    DATE_TRUNC('week', date) as week,
    AVG(body_battery) as avg_body_battery,
    AVG(vo2_max) as avg_vo2_max,
    AVG(hrv) as avg_hrv,
    AVG(sleep_score) as avg_sleep_score,
    AVG(resting_hr) as avg_resting_hr,
    SUM(steps) as total_steps
FROM fitness_metrics
GROUP BY DATE_TRUNC('week', date)
ORDER BY week DESC;
