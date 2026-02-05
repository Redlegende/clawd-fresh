import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/cron/task-check
 * Hourly task check job - runs every hour during work hours (9 AM - 10 PM)
 * 
 * Actions:
 * 1. Check for urgent tasks not started
 * 2. Check for tasks stuck in "in_progress" for >4 hours
 * 3. Send notification if action needed
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()

    // 1. Find urgent tasks still in backlog or todo
    const { data: urgentNotStarted, error: urgentError } = await supabase
      .from('tasks')
      .select('id, title, created_at')
      .eq('priority', 'urgent')
      .in('status', ['backlog', 'todo'])

    if (urgentError) throw urgentError

    // 2. Find tasks stuck in progress for >4 hours
    const { data: stuckTasks, error: stuckError } = await supabase
      .from('tasks')
      .select('id, title, updated_at')
      .eq('status', 'in_progress')
      .lt('updated_at', fourHoursAgo)

    if (stuckError) throw stuckError

    // Create notifications
    const notifications = []

    // Urgent tasks not started
    if (urgentNotStarted && urgentNotStarted.length > 0) {
      notifications.push({
        type: 'urgent_pending',
        message: `🔴 ${urgentNotStarted.length} urgent task(s) not started: ${urgentNotStarted.map(t => t.title).join(', ')}`,
        task_id: urgentNotStarted[0].id,
        task_title: urgentNotStarted[0].title,
        read: false,
        created_at: new Date().toISOString()
      })
    }

    // Stuck tasks
    if (stuckTasks && stuckTasks.length > 0) {
      notifications.push({
        type: 'stuck_task',
        message: `⏰ ${stuckTasks.length} task(s) stuck in progress for >4h: ${stuckTasks.map(t => t.title).join(', ')}`,
        task_id: stuckTasks[0].id,
        task_title: stuckTasks[0].title,
        read: false,
        created_at: new Date().toISOString()
      })
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: notifyError } = await supabase
        .from('fred_notifications')
        .insert(notifications)

      if (notifyError) throw notifyError
    }

    console.log(`[Cron] Task check: ${urgentNotStarted?.length || 0} urgent pending, ${stuckTasks?.length || 0} stuck`)

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      summary: {
        urgent_not_started: urgentNotStarted?.length || 0,
        stuck_in_progress: stuckTasks?.length || 0,
        notifications_created: notifications.length
      }
    })

  } catch (error) {
    console.error('[Cron] Task check error:', error)
    return NextResponse.json(
      { error: 'Task check failed' },
      { status: 500 }
    )
  }
}
