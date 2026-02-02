#!/usr/bin/env node
/**
 * Create Observatory tables using direct Postgres connection
 */
const { Client } = require('pg');

// Connection string for Supabase (using connection pooler)
const connectionString = 'postgresql://postgres.vhrmxtolrrcrhrxljemp:[PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';

const SQL_SCHEMA = `
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
`;

async function createTables() {
    const password = process.env.SUPABASE_DB_PASSWORD || 'your-password-here';
    const connStr = connectionString.replace('[PASSWORD]', password);
    
    const client = new Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        console.log('Connected to Supabase database');
        
        await client.query(SQL_SCHEMA);
        console.log('✅ Tables created successfully!');
        
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

createTables();
