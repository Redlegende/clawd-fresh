import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/fred/tasks/:id/complete
 * Fred marks a task as done
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()
    const { notes, completed_by = 'fred' } = body
    
    // Get current task state
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()
    
    if (fetchError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }
    
    // Already done?
    if (task.status === 'done') {
      return NextResponse.json({
        ok: true,
        message: 'Task already completed',
        task: task
      })
    }
    
    // Update task to done
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // Create sync log entry
    await supabase.from('task_sync_log').insert({
      event_type: 'completed',
      task_id: taskId,
      task_title: task.title,
      previous_status: task.status,
      new_status: 'done',
      completed_by: completed_by,
      completed_at: new Date().toISOString(),
      synced_at: new Date().toISOString(),
      webhook_status: 'delivered'
    })
    
    return NextResponse.json({
      ok: true,
      message: 'Task marked as done',
      task: updatedTask
    })
    
  } catch (error) {
    console.error('[Fred API] Error completing task:', error)
    return NextResponse.json(
      { error: 'Failed to complete task' },
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
    } else {
      // Default: only active tasks (not done)
      query = query.not('status', 'eq', 'done')
    }
    
    if (priority) {
      query = query.eq('priority', priority)
    }
    
    const { data: tasks, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({
      tasks: tasks || [],
      count: tasks?.length || 0,
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
