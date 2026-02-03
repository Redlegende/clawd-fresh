import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/fred/tasks
 * Get tasks for Fred to review/work on
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const project_id = searchParams.get('project_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = supabase
      .from('tasks')
      .select(`
        *,
        projects:project_id (name, status)
      `)
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })
      .limit(limit)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (priority) {
      query = query.eq('priority', priority)
    }
    
    if (project_id) {
      query = query.eq('project_id', project_id)
    }
    
    const { data: tasks, error } = await query
    
    if (error) throw error
    
    // Get summary stats
    const { data: stats, error: statsError } = await supabase
      .from('tasks')
      .select('status, priority')
      .not('status', 'eq', 'done')
    
    const summary = {
      total: tasks?.length || 0,
      by_status: {} as Record<string, number>,
      by_priority: {} as Record<string, number>,
      urgent: stats?.filter(t => t.priority === 'urgent').length || 0,
      overdue: 0 // TODO: Calculate overdue tasks
    }
    
    stats?.forEach(task => {
      summary.by_status[task.status] = (summary.by_status[task.status] || 0) + 1
      summary.by_priority[task.priority] = (summary.by_priority[task.priority] || 0) + 1
    })
    
    return NextResponse.json({
      tasks: tasks || [],
      summary,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[Fred API] Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
