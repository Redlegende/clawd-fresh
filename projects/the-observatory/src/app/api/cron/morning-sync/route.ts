import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/cron/morning-sync
 * Daily morning sync job - runs at 8:00 AM
 * 
 * Actions:
 * 1. Check for overdue tasks → create Fred notification
 * 2. Check for tasks due today → create reminder notification
 * 3. Create daily summary of yesterday's completed tasks
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // 1. Find overdue tasks (due date passed, not done)
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('tasks')
      .select('id, title, due_date, priority')
      .lt('due_date', today)
      .neq('status', 'done')
      .order('due_date', { ascending: true })

    if (overdueError) throw overdueError

    // 2. Find tasks due today
    const { data: dueTodayTasks, error: dueTodayError } = await supabase
      .from('tasks')
      .select('id, title, due_date, priority')
      .eq('due_date', today)
      .neq('status', 'done')

    if (dueTodayError) throw dueTodayError

    // 3. Find tasks completed yesterday
    const { data: completedYesterday, error: completedError } = await supabase
      .from('tasks')
      .select('id, title, completed_at')
      .gte('completed_at', `${yesterday}T00:00:00`)
      .lt('completed_at', `${today}T00:00:00`)
      .eq('status', 'done')

    if (completedError) throw completedError

    // Create notifications for Fred
    const notifications = []

    // Overdue tasks notification
    if (overdueTasks && overdueTasks.length > 0) {
      notifications.push({
        type: 'overdue_tasks',
        message: `⚠️ ${overdueTasks.length} overdue task(s): ${overdueTasks.map(t => t.title).join(', ')}`,
        task_id: overdueTasks[0].id,
        task_title: overdueTasks[0].title,
        read: false,
        created_at: new Date().toISOString()
      })

      // Auto-escalate priority for overdue tasks
      for (const task of overdueTasks) {
        if (task.priority === 'medium') {
          await supabase
            .from('tasks')
            .update({ priority: 'high', updated_at: new Date().toISOString() })
            .eq('id', task.id)
        } else if (task.priority === 'high') {
          await supabase
            .from('tasks')
            .update({ priority: 'urgent', updated_at: new Date().toISOString() })
            .eq('id', task.id)
        }
      }
    }

    // Due today notification
    if (dueTodayTasks && dueTodayTasks.length > 0) {
      notifications.push({
        type: 'due_today',
        message: `📅 ${dueTodayTasks.length} task(s) due today: ${dueTodayTasks.map(t => t.title).join(', ')}`,
        task_id: dueTodayTasks[0].id,
        task_title: dueTodayTasks[0].title,
        read: false,
        created_at: new Date().toISOString()
      })
    }

    // Yesterday's summary
    if (completedYesterday && completedYesterday.length > 0) {
      notifications.push({
        type: 'daily_summary',
        message: `✅ Yesterday: ${completedYesterday.length} task(s) completed`,
        task_id: null,
        task_title: null,
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

    console.log(`[Cron] Morning sync: ${overdueTasks?.length || 0} overdue, ${dueTodayTasks?.length || 0} due today, ${completedYesterday?.length || 0} completed yesterday`)

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      summary: {
        overdue: overdueTasks?.length || 0,
        due_today: dueTodayTasks?.length || 0,
        completed_yesterday: completedYesterday?.length || 0,
        notifications_created: notifications.length
      }
    })

  } catch (error) {
    console.error('[Cron] Morning sync error:', error)
    return NextResponse.json(
      { error: 'Morning sync failed' },
      { status: 500 }
    )
  }
}
