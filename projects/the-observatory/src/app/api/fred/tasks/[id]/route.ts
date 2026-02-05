import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/fred/tasks/:id
 * Get a specific task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`*, projects:project_id (name, status)`)
      .eq('id', id)
      .single()

    if (error) throw error

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ task })

  } catch (error) {
    console.error('[Fred API] Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/fred/tasks/:id
 * Update a task (status, description, priority, etc.)
 * Used by Fred to track progress on tasks
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const allowedFields = ['title', 'description', 'status', 'priority', 'due_date', 'tags', 'project_id']
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    // Only include allowed fields
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Handle status changes
    if (body.status === 'done') {
      updateData.completed_at = new Date().toISOString()
    } else if (body.status && body.status !== 'done') {
      // If moving out of done, clear completed_at
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', id)
        .single()
      
      if (currentTask?.status === 'done') {
        updateData.completed_at = null
      }
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log the update
    await supabase.from('task_sync_log').insert({
      event_type: 'updated',
      task_id: id,
      task_title: task.title,
      new_status: task.status,
      synced_at: new Date().toISOString(),
      webhook_status: 'delivered'
    })

    console.log(`[Fred API] Task updated: ${task.title}`)

    return NextResponse.json({
      ok: true,
      message: 'Task updated',
      task
    })

  } catch (error) {
    console.error('[Fred API] Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
