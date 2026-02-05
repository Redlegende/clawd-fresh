#!/usr/bin/env python3
"""
Create Observatory tables in Supabase using direct SQL execution via pg_execute
"""
import os
import sys
from supabase import create_client

# Get credentials
url = "https://vhrmxtolrrcrhrxljemp.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NDAwNCwiZXhwIjoyMDg1NTUwMDA0fQ.jnZEhrFl823cgQHubVZv_-qRwvS8aO90Yosp_jxY2cs"

supabase = create_client(url, key)

# Check if exec_sql function exists - if not, create it
exec_sql_check = """
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE query;
    result := '{"success": true}'::json;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    result := json_build_object('success', false, 'error', SQLERRM);
    RETURN result;
END;
$$;
"""

try:
    # Try to create the exec_sql function via raw SQL
    # First check if it exists
    result = supabase.table('projects').select('*').limit(1).execute()
    print("✓ Connected to Supabase")
except Exception as e:
    print(f"Connection error: {e}")
    sys.exit(1)

# Tables to create in order
TABLES = [
    ("tasks", """
        CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(500) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'backlog',
            priority VARCHAR(20) DEFAULT 'medium',
            project_id UUID,
            assignee_id UUID,
            due_date DATE,
            estimated_hours DECIMAL(4,1),
            actual_hours DECIMAL(4,1),
            tags TEXT[],
            source VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE
        )
    """),
    ("fitness_metrics", """
        CREATE TABLE IF NOT EXISTS fitness_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            date DATE NOT NULL UNIQUE,
            user_id UUID,
            body_battery INTEGER,
            vo2_max DECIMAL(4,1),
            hrv DECIMAL(5,2),
            sleep_score INTEGER,
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
    """),
    ("finance_entries", """
        CREATE TABLE IF NOT EXISTS finance_entries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
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
    """),
    ("research_notes", """
        CREATE TABLE IF NOT EXISTS research_notes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(500) NOT NULL,
            slug VARCHAR(500) UNIQUE NOT NULL,
            file_path VARCHAR(1000) NOT NULL,
            file_hash VARCHAR(64),
            file_size_bytes INTEGER,
            project_id UUID,
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
    """),
]

# Create tables using REST API by inserting into a special endpoint
# Actually, Supabase doesn't allow CREATE TABLE via REST
# We need to use the Management API or SQL Editor

print("\n⚠️  Supabase REST API cannot create tables directly.")
print("Opening dashboard SQL Editor with schema...")
print("\n========== COPY THIS SQL TO SUPABASE SQL EDITOR ==========\n")
print(open('/Users/jakobbakken/clawd-fresh/projects/the-observatory/schema.sql').read())
print("\n========== END SQL ==========")
print("\nDashboard URL: https://supabase.com/dashboard/project/vhrmxtolrrcrhrxljemp/sql/new")
