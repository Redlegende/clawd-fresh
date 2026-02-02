-- Task Status and Priority Enums
CREATE TYPE orchestrator.task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled');
CREATE TYPE orchestrator.priority AS ENUM ('lowest', 'low', 'medium', 'high', 'urgent');

-- Projects Table
CREATE TABLE orchestrator.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366F1',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    parent_id UUID REFERENCES orchestrator.projects(id),
    sort_order INTEGER DEFAULT 0,
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Tasks Table (Core)
CREATE TABLE orchestrator.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES orchestrator.projects(id) ON DELETE SET NULL,
    
    -- Core fields
    title TEXT NOT NULL,
    description TEXT,
    status orchestrator.task_status DEFAULT 'backlog',
    priority orchestrator.priority DEFAULT 'medium',
    
    -- Scheduling
    due_date DATE,
    due_time TIME,
    due_datetime TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 60,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    
    -- Source tracking
    source TEXT CHECK (source IN ('manual', 'telegram', 'airbnb', 'calendar', 'agent')),
    external_id TEXT,
    
    -- Recurrence and dependencies
    recurrence_rule TEXT,
    parent_id UUID REFERENCES orchestrator.tasks(id) ON DELETE CASCADE,
    reschedule_count INTEGER DEFAULT 0,
    
    -- Energy and context
    energy_required TEXT CHECK (energy_required IN ('low', 'medium', 'high')),
    context JSONB DEFAULT '{}'::jsonb,
    
    -- Completion
    completed_at TIMESTAMPTZ,
    completed_by TEXT,
    
    -- Concurrency control
    version INTEGER DEFAULT 1,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, external_id)
);

-- Task Dependencies
CREATE TABLE orchestrator.task_dependencies (
    task_id UUID REFERENCES orchestrator.tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES orchestrator.tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (task_id, depends_on_task_id)
);

-- Task History (Audit Trail)
CREATE TABLE orchestrator.task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES orchestrator.tasks(id) ON DELETE CASCADE,
    changed_by TEXT,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX idx_tasks_user_status ON orchestrator.tasks(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due ON orchestrator.tasks(due_date) WHERE status NOT IN ('done', 'cancelled') AND deleted_at IS NULL;
CREATE INDEX idx_tasks_scheduled ON orchestrator.tasks(scheduled_start) WHERE scheduled_start IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_tasks_project ON orchestrator.tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_user ON orchestrator.projects(user_id) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE orchestrator.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.task_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow anon read projects" ON orchestrator.projects FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert projects" ON orchestrator.projects FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update projects" ON orchestrator.projects FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon read tasks" ON orchestrator.tasks FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert tasks" ON orchestrator.tasks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update tasks" ON orchestrator.tasks FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete tasks" ON orchestrator.tasks FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read dependencies" ON orchestrator.task_dependencies FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert dependencies" ON orchestrator.task_dependencies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon delete dependencies" ON orchestrator.task_dependencies FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read history" ON orchestrator.task_history FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert history" ON orchestrator.task_history FOR INSERT TO anon WITH CHECK (true);
