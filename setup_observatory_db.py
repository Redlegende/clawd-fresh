#!/usr/bin/env python3
"""
Create Observatory tables via Supabase Management API
"""
import requests
import json
import time

TOKEN = "sbp_2b1f19d25ca514fb6bc03e77ec225c682e836d66"
PROJECT_ID = "vhrmxtolrrcrhrxljemp"
BASE_URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def run_sql(query, description=""):
    """Execute SQL via Management API"""
    url = f"{BASE_URL}/database/query"
    try:
        resp = requests.post(url, headers=headers, json={"query": query}, timeout=30)
        if resp.status_code == 200:
            print(f"  ✓ {description or 'Query executed'}")
            return True, resp.json()
        else:
            error = resp.json().get('message', resp.text) if resp.text else 'Unknown error'
            # Ignore "already exists" errors
            if 'already exists' in error.lower() or 'duplicate' in error.lower():
                print(f"  ✓ {description} (already exists)")
                return True, None
            print(f"  ✗ {description}: {error[:100]}")
            return False, error
    except Exception as e:
        print(f"  ✗ {description}: {e}")
        return False, str(e)

print("🚀 Creating Observatory Database Tables\n")

# 1. Enable UUID extension
print("1. Enabling UUID extension...")
run_sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', "UUID extension")

# 2. Create projects table (if not exists)
print("\n2. Creating projects table...")
sql = '''
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    folder_path VARCHAR(500),
    github_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_completion DATE
)
'''
run_sql(sql, "projects table")
run_sql("CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);", "projects status index")
run_sql("CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);", "projects priority index")

# 3. Create tasks table
print("\n3. Creating tasks table...")
sql = '''
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'backlog',
    priority VARCHAR(20) DEFAULT 'medium',
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    due_date DATE,
    estimated_hours DECIMAL(4,1),
    actual_hours DECIMAL(4,1),
    tags TEXT[],
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
)
'''
run_sql(sql, "tasks table")
run_sql("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);", "tasks status index")
run_sql("CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);", "tasks project index")
run_sql("CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);", "tasks priority index")
run_sql("CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);", "tasks due_date index")

# 4. Create fitness_metrics table
print("\n4. Creating fitness_metrics table...")
sql = '''
CREATE TABLE IF NOT EXISTS fitness_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    body_battery INTEGER CHECK (body_battery >= 0 AND body_battery <= 100),
    vo2_max DECIMAL(4,1),
    hrv DECIMAL(5,2),
    sleep_score INTEGER CHECK (sleep_score >= 0 AND sleep_score <= 100),
    sleep_hours DECIMAL(4,2),
    resting_hr INTEGER,
    steps INTEGER,
    calories_burned INTEGER,
    weight_kg DECIMAL(5,2),
    mood_score INTEGER,
    energy_score INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
'''
run_sql(sql, "fitness_metrics table")
run_sql("CREATE INDEX IF NOT EXISTS idx_fitness_date ON fitness_metrics(date);", "fitness date index")

# 5. Create finance_entries table
print("\n5. Creating finance_entries table...")
sql = '''
CREATE TABLE IF NOT EXISTS finance_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
)
'''
run_sql(sql, "finance_entries table")
run_sql("CREATE INDEX IF NOT EXISTS idx_finance_date ON finance_entries(date);", "finance date index")
run_sql("CREATE INDEX IF NOT EXISTS idx_finance_source ON finance_entries(source);", "finance source index")

# 6. Create research_notes table
print("\n6. Creating research_notes table...")
sql = '''
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
    status VARCHAR(50) DEFAULT 'draft',
    read_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
)
'''
run_sql(sql, "research_notes table")
run_sql("CREATE INDEX IF NOT EXISTS idx_research_project ON research_notes(project_id);", "research project index")
run_sql("CREATE INDEX IF NOT EXISTS idx_research_category ON research_notes(category);", "research category index")
run_sql("CREATE INDEX IF NOT EXISTS idx_research_status ON research_notes(status);", "research status index")

# 7. Create update trigger function
print("\n7. Creating updated_at trigger function...")
sql = '''
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql'
'''
run_sql(sql, "update_updated_at function")

# 8. Create triggers
print("\n8. Creating triggers...")
triggers = [
    ("projects", "update_projects_updated_at"),
    ("tasks", "update_tasks_updated_at"),
    ("fitness_metrics", "update_fitness_metrics_updated_at"),
    ("finance_entries", "update_finance_entries_updated_at"),
    ("research_notes", "update_research_notes_updated_at"),
]
for table, trigger_name in triggers:
    sql = f'''
    DROP TRIGGER IF EXISTS {trigger_name} ON {table};
    CREATE TRIGGER {trigger_name} BEFORE UPDATE ON {table} 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    '''
    run_sql(sql, f"{trigger_name} trigger")

# 9. Create views
print("\n9. Creating views...")

# Active tasks view
sql = '''
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
    t.due_date ASC
'''
run_sql(sql, "active_tasks view")

# Monthly finance view
sql = '''
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
ORDER BY month DESC, source
'''
run_sql(sql, "monthly_finance_summary view")

# Fitness weekly view
sql = '''
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
ORDER BY week DESC
'''
run_sql(sql, "fitness_weekly_avg view")

print("\n✅ Observatory database setup complete!")
print("\nTables created:")
print("  - projects")
print("  - tasks")  
print("  - fitness_metrics")
print("  - finance_entries")
print("  - research_notes")
print("\nViews created:")
print("  - active_tasks")
print("  - monthly_finance_summary")
print("  - fitness_weekly_avg")
