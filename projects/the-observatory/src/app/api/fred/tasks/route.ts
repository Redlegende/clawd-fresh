import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/fred/tasks
 * Fred creates a new task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      priority = 'medium', 
      status = 'todo',
      project_id,
      due_date,
      tags,
      source = 'fred'
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['backlog', 'todo', 'in_progress', 'review', 'done']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Create the task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        priority,
        status,
        project_id: project_id || null,
        due_date: due_date || null,
        tags: tags || [],
        source,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Log the creation
    await supabase.from('task_sync_log').insert({
      event_type: 'created',
      task_id: task.id,
      task_title: task.title,
      new_status: task.status,
      completed_by: 'fred',
      synced_at: new Date().toISOString(),
      webhook_status: 'delivered'
    })

    console.log(`[Fred API] Task created: ${task.title}`)

    return NextResponse.json({
      ok: true,
      message: 'Task created successfully',
      task
    }, { status: 201 })

  } catch (error) {
    console.error('[Fred API] Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

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
