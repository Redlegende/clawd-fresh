import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/cron/recurring-tasks
 * Daily at 6:00 AM — resets recurring tasks that are due
 * 
 * Logic:
 * - Find tasks with is_recurring = true
 * - Check if next_run_at <= now
 * - Reset status to 'todo' and update next_run_at
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()

    // Find recurring tasks that are due
    const { data: recurringTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title, status, recurrence_rule, recurrence_interval, next_run_at')
      .eq('is_recurring', true)
      .lte('next_run_at', now.toISOString())

    if (fetchError) throw fetchError

    if (!recurringTasks || recurringTasks.length === 0) {
      return NextResponse.json({
        ok: true,
        timestamp: now.toISOString(),
        message: 'No recurring tasks due',
        processed: 0
      })
    }

    let processed = 0
    const errors: string[] = []

    for (const task of recurringTasks) {
      try {
        // Calculate next run date
        const nextRun = calculateNextRun(task.recurrence_rule, task.recurrence_interval)

        // Reset task to todo and update timing
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            status: 'todo',
            last_run_at: now.toISOString(),
            next_run_at: nextRun.toISOString(),
            completed_at: null,
            updated_at: now.toISOString()
          })
          .eq('id', task.id)

        if (updateError) {
          errors.push(`${task.title}: ${updateError.message}`)
        } else {
          processed++
        }
      } catch (e) {
        errors.push(`${task.title}: ${(e as Error).message}`)
      }
    }

    // Create notification about reset tasks
    if (processed > 0) {
      await supabase.from('fred_notifications').insert({
        type: 'recurring_reset',
        message: `🔄 ${processed} recurring task(s) reset: ${recurringTasks.slice(0, 3).map(t => t.title).join(', ')}${recurringTasks.length > 3 ? '...' : ''}`,
        read: false,
        created_at: now.toISOString()
      })
    }

    console.log(`[Cron] Recurring tasks: ${processed} reset, ${errors.length} errors`)

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      processed,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('[Cron] Recurring tasks error:', error)
    return NextResponse.json(
      { error: 'Recurring tasks cron failed' },
      { status: 500 }
    )
  }
}

function calculateNextRun(rule: string | null, interval: string | null): Date {
  const now = new Date()

  switch (rule?.toLowerCase()) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case 'monthly':
      const next = new Date(now)
      next.setMonth(next.getMonth() + 1)
      return next
    default:
      // Default to daily
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }
}
