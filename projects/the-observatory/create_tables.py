#!/usr/bin/env python3
"""
Create Observatory tables in Supabase
"""
import os
from supabase import create_client

# Supabase credentials
SUPABASE_URL = "https://vhrmxtolrrcrhrxljemp.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NDAwNCwiZXhwIjoyMDg1NTUwMDA0fQ.jnZEhrFl823cgQHubVZv_-qRwvS8aO90Yosp_jxY2cs"

# SQL to create tables
SQL_SCHEMA = """
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROJECTS TABLE
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
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);

-- =====================================================
-- TASKS TABLE (Kanban)
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date DATE,
    estimated_hours DECIMAL(4,1),
    actual_hours DECIMAL(4,1),
    tags TEXT[],
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- =====================================================
-- FITNESS METRICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS fitness_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    body_battery INTEGER CHECK (body_battery >= 0 AND body_battery <= 100),
    vo2_max DECIMAL(4,1),
    hrv DECIMAL(5,2),
    sleep_score INTEGER CHECK (sleep_score >= 0 AND sleep_score <= 100),
    sleep_hours DECIMAL(4,2),
    resting_hr INTEGER,
    steps INTEGER,
    calories_burned INTEGER,
    weight_kg DECIMAL(5,2),
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    energy_score INTEGER CHECK (energy_score >= 1 AND energy_score <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fitness_date ON fitness_metrics(date);
CREATE INDEX IF NOT EXISTS idx_fitness_user ON fitness_metrics(user_id);

-- =====================================================
-- FINANCE ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS finance_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    source VARCHAR(100) NOT NULL,
    description TEXT,
    hours DECIMAL(4,2) NOT NULL,
    rate_nok DECIMAL(8,2) NOT NULL,
    mva_rate DECIMAL(4,2) DEFAULT 1.25,
    subtotal_nok DECIMAL(10,2) GENERATED ALWAYS AS (hours * rate_nok) STORED,
    total_nok DECIMAL(10,2) GENERATED ALWAYS AS (hours * rate_nok * mva_rate) STORED,
    invoiced BOOLEAN DEFAULT FALSE,
    invoiced_at TIMESTAMP WITH TIME ZONE,
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_date ON finance_entries(date);
CREATE INDEX IF NOT EXISTS idx_finance_source ON finance_entries(source);
CREATE INDEX IF NOT EXISTS idx_finance_invoiced ON finance_entries(invoiced);
CREATE INDEX IF NOT EXISTS idx_finance_paid ON finance_entries(paid);

-- =====================================================
-- RESEARCH NOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS research_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_hash VARCHAR(64),
    file_size_bytes INTEGER,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    tags TEXT[],
    category VARCHAR(100),
    summary TEXT,
    key_insights TEXT[],
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'archived', 'obsolete')),
    read_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_research_project ON research_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_research_category ON research_notes(category);
CREATE INDEX IF NOT EXISTS idx_research_status ON research_notes(status);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fitness_metrics_updated_at ON fitness_metrics;
CREATE TRIGGER update_fitness_metrics_updated_at BEFORE UPDATE ON fitness_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_finance_entries_updated_at ON finance_entries;
CREATE TRIGGER update_finance_entries_updated_at BEFORE UPDATE ON finance_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_research_notes_updated_at ON research_notes;
CREATE TRIGGER update_research_notes_updated_at BEFORE UPDATE ON research_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own projects" ON projects;
CREATE POLICY "Users can CRUD own projects" ON projects
    FOR ALL USING (owner_id = auth.uid());

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own tasks" ON tasks;
CREATE POLICY "Users can CRUD own tasks" ON tasks
    FOR ALL USING (assignee_id = auth.uid());

ALTER TABLE fitness_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own fitness data" ON fitness_metrics;
CREATE POLICY "Users can CRUD own fitness data" ON fitness_metrics
    FOR ALL USING (user_id = auth.uid());

ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own finance entries" ON finance_entries;
CREATE POLICY "Users can CRUD own finance entries" ON finance_entries
    FOR ALL USING (user_id = auth.uid());

ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All users can read research notes" ON research_notes;
CREATE POLICY "All users can read research notes" ON research_notes
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can CRUD own research notes" ON research_notes;
CREATE POLICY "Users can CRUD own research notes" ON research_notes
    FOR ALL USING (true);

-- =====================================================
-- VIEWS
-- =====================================================
DROP VIEW IF EXISTS active_tasks;
CREATE OR REPLACE VIEW active_tasks AS
SELECT 
    t.*,
    p.name as project_name,
    p.status as project_status
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.status NOT IN ('done', 'archived')
ORDER BY 
    CASE t.priority 
        WHEN 'urgent' THEN 4 
        WHEN 'high' THEN 3 
        WHEN 'medium' THEN 2 
        ELSE 1 
    END DESC, 
    t.due_date ASC;

DROP VIEW IF EXISTS monthly_finance_summary;
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

DROP VIEW IF EXISTS fitness_weekly_avg;
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
"""

def create_tables():
    """Create all tables in Supabase"""
    supabase = create_client(SUPABASE_URL, SERVICE_KEY)
    
    # Execute SQL - split by semicolons to execute each statement
    statements = [s.strip() for s in SQL_SCHEMA.split(';') if s.strip()]
    
    success_count = 0
    error_count = 0
    
    for stmt in statements:
        try:
            # Use rpc to execute raw SQL
            result = supabase.rpc('exec_sql', {'sql': stmt + ';'}).execute()
            success_count += 1
            print(f"✓ Executed: {stmt[:50]}...")
        except Exception as e:
            # Try alternative method via REST
            try:
                import requests
                resp = requests.post(
                    f"{SUPABASE_URL}/rest/v1/",
                    headers={
                        "apikey": SERVICE_KEY,
                        "Authorization": f"Bearer {SERVICE_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={"query": stmt + ";"}
                )
                if resp.status_code in [200, 201, 204]:
                    success_count += 1
                    print(f"✓ Executed: {stmt[:50]}...")
                else:
                    error_count += 1
                    print(f"✗ Failed ({resp.status_code}): {stmt[:50]}...")
            except Exception as e2:
                error_count += 1
                print(f"✗ Error: {stmt[:50]}... - {str(e2)[:100]}")
    
    print(f"\n{'='*50}")
    print(f"Results: {success_count} succeeded, {error_count} failed")
    return error_count == 0

if __name__ == "__main__":
    print("Creating Observatory tables in Supabase...")
    print("="*50)
    success = create_tables()
    print("\n✅ Tables created successfully!" if success else "\n⚠️ Some tables may have failed (they might already exist)")
