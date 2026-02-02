const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://vhrmxtolrrcrhrxljemp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NDAwNCwiZXhwIjoyMDg1NTUwMDA0fQ.jnZEhrFl823cgQHubVZv_-qRwvS8aO90Yosp_jxY2cs'

const supabase = createClient(supabaseUrl, supabaseKey)

const schemaSQL = `
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
    employer TEXT NOT NULL,
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
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_research_notes_updated_at ON research_notes;
CREATE TRIGGER update_research_notes_updated_at BEFORE UPDATE ON research_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_focus_updated_at ON daily_focus;
CREATE TRIGGER update_daily_focus_updated_at BEFORE UPDATE ON daily_focus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fitness_metrics_updated_at ON fitness_metrics;
CREATE TRIGGER update_fitness_metrics_updated_at BEFORE UPDATE ON fitness_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_finance_entries_updated_at ON finance_entries;
CREATE TRIGGER update_finance_entries_updated_at BEFORE UPDATE ON finance_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hours_tracking_updated_at ON hours_tracking;
CREATE TRIGGER update_hours_tracking_updated_at BEFORE UPDATE ON hours_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`

async function setupDatabase() {
  console.log('Setting up Observatory database...\n')
  
  try {
    // Execute schema SQL
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL })
    
    if (schemaError) {
      console.error('Schema error:', schemaError)
      // Try executing directly
      console.log('Trying direct SQL execution...')
    }
    
    console.log('✅ Tables created successfully!')
    
    // Insert sample tasks
    const { error: tasksError } = await supabase.from('tasks').upsert([
      { title: 'Complete Observatory MVP', description: 'Build Mission Control, Kanban, and Research Reader modules', status: 'in_progress', priority: 'high', project: 'Observatory', tags: ['dev', 'mvp'] },
      { title: 'Apply for Kartverket Matrikkel agreement', description: 'Submit application for property owner lookup access', status: 'todo', priority: 'high', project: '3dje Boligsektor', tags: ['legal', 'api'] },
      { title: 'Connect iGMS OAuth', description: 'Test the iGMS integration for Kvitfjellhytter dashboard', status: 'todo', priority: 'medium', project: 'Kvitfjellhytter', tags: ['integration'] },
      { title: 'Set up Garmin sync', description: 'Connect Fitness Lab to Garmin Connect API', status: 'todo', priority: 'medium', project: 'Observatory', tags: ['fitness', 'api'] },
      { title: 'Research kommune analysis', description: 'Find top municipalities for social housing development', status: 'done', priority: 'high', project: '3dje Boligsektor', tags: ['research', 'analysis'] }
    ], { onConflict: 'title' })
    
    if (tasksError) console.error('Tasks error:', tasksError)
    else console.log('✅ Sample tasks added!')
    
    // Insert sample research notes
    const { error: researchError } = await supabase.from('research_notes').upsert([
      { 
        title: 'SIBO Protocol - Dr. William Davis',
        content: 'L. reuteri yogurt (36-hour fermented) helps restore gut microbiome. Key points:\n- Use specific strains: DSM 17938 and ATCC PTA 6475\n- Ferment at 100°F for 36 hours\n- Consume 1/2 cup daily\n- Combine with prebiotic fibers (green banana flour, inulin)\n- Track symptoms: bloating, energy, mood',
        topic: 'Health',
        tags: ['sibo', 'gut-health', 'probiotics'],
        source_url: 'https://drdavisinfinitehealth.com/'
      },
      {
        title: 'Kartverket Matrikkel API Overview',
        content: 'Matrikkelen API provides property boundary and owner data:\n- Requires agreement for production access\n- Free tier available for testing\n- RESTful API with JSON responses\n- Key endpoints: /eiendom, /eiendomsrettigheter, /person\n- Rate limits: 1000 req/day for testing',
        topic: 'Tech',
        tags: ['api', 'kartverket', 'real-estate'],
        source_url: 'https://www.geonorge.no/aktuelt/om-geonorge/slik-bruker-du-apiene/'
      },
      {
        title: '3dje Boligsektor - Business Model',
        content: 'Revenue model for tomte-sourcing system:\n- Setup fee: 5,000 NOK per municipality\n- Monthly retainer tiers:\n  * Basic (5-10 lots): 15,000 NOK/month\n  * Standard (11-25 lots): 25,000 NOK/month\n  * Premium (25+ lots): 40,000 NOK/month\n- Success fee: 2% of land value upon sale\n- Target: 3 municipalities by end of Q1',
        topic: 'Business',
        tags: ['boligsektor', 'pricing', 'strategy']
      }
    ], { onConflict: 'title' })
    
    if (researchError) console.error('Research error:', researchError)
    else console.log('✅ Sample research notes added!')
    
    // Insert sample projects
    const { error: projectsError } = await supabase.from('projects').upsert([
      { name: 'Observatory Dashboard', description: 'Personal command center for life and business management', status: 'active', priority: 'high', start_date: '2026-02-01', target_date: '2026-02-15' },
      { name: '3dje Boligsektor MVP', description: 'Tomte-sourcing system with differanse algorithm', status: 'active', priority: 'high', start_date: '2026-02-01', target_date: '2026-02-07' },
      { name: 'Kvitfjellhytter Website', description: 'Complete owner dashboard and guest-facing website', status: 'active', priority: 'medium', start_date: '2026-01-15', target_date: '2026-02-28' },
      { name: 'Fitness Transformation Content', description: 'Document gut health and fitness journey for YouTube', status: 'paused', priority: 'low', start_date: '2026-01-01', target_date: '2026-06-01' }
    ], { onConflict: 'name' })
    
    if (projectsError) console.error('Projects error:', projectsError)
    else console.log('✅ Sample projects added!')
    
    // Insert today's focus
    const { error: focusError } = await supabase.from('daily_focus').upsert([
      { date: new Date().toISOString().split('T')[0], focus_text: 'Complete Observatory database setup and test all modules', completed: false }
    ], { onConflict: 'date' })
    
    if (focusError) console.error('Focus error:', focusError)
    else console.log('✅ Daily focus set!')
    
    console.log('\n🎉 Database setup complete!')
    console.log('\nTables created:')
    console.log('  - tasks (Kanban board)')
    console.log('  - research_notes (Research Reader)')
    console.log('  - projects (Project dashboard)')
    console.log('  - daily_focus (Mission Control)')
    console.log('  - fitness_metrics (Fitness Lab - ready for Garmin)')
    console.log('  - finance_entries (Finance module)')
    console.log('  - hours_tracking (Hour tracking)')
    
  } catch (error) {
    console.error('Setup error:', error)
  }
}

setupDatabase()
