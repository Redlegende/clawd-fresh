import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/fred/briefing
 * Fred's morning briefing - comprehensive overview of tasks, calendar, and recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Fetch all active tasks
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`*, projects:project_id (name)`)
      .neq('status', 'done')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })

    if (tasksError) throw tasksError

    // Fetch tasks completed yesterday
    const { data: completedYesterday, error: completedError } = await supabase
      .from('tasks')
      .select('id, title, completed_at')
      .gte('completed_at', `${yesterday}T00:00:00`)
      .lt('completed_at', `${today}T00:00:00`)
      .eq('status', 'done')

    if (completedError) throw completedError

    // Fetch calendar events for today (if calendar table exists)
    let calendarEvents: any[] = []
    try {
      const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', `${today}T00:00:00`)
        .lt('start_time', `${today}T23:59:59`)
        .order('start_time', { ascending: true })
      
      calendarEvents = events || []
    } catch {
      // Calendar table may not exist yet
    }

    // Categorize tasks
    const tasks = allTasks || []
    
    const urgent = tasks.filter(t => t.priority === 'urgent')
    const high = tasks.filter(t => t.priority === 'high')
    const inProgress = tasks.filter(t => t.status === 'in_progress')
    const overdue = tasks.filter(t => t.due_date && t.due_date < today)
    const dueToday = tasks.filter(t => t.due_date === today)
    const dueThisWeek = tasks.filter(t => t.due_date && t.due_date > today && t.due_date <= weekFromNow)

    // Calculate available hours (assume 8 hour day minus meetings)
    const meetingHours = calendarEvents.reduce((total, event) => {
      if (event.start_time && event.end_time) {
        const start = new Date(event.start_time)
        const end = new Date(event.end_time)
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      }
      return total
    }, 0)
    const availableHours = Math.max(0, 8 - meetingHours)

    // Generate recommendations
    const recommendations: string[] = []
    
    if (overdue.length > 0) {
      recommendations.push(`🚨 ${overdue.length} overdue task(s) need immediate attention`)
    }
    
    if (inProgress.length > 0) {
      recommendations.push(`Continue work on "${inProgress[0].title}" - already in progress`)
    }
    
    if (urgent.length > 0 && inProgress.length === 0) {
      recommendations.push(`Start with urgent task: "${urgent[0].title}"`)
    }
    
    if (dueToday.length > 0) {
      recommendations.push(`${dueToday.length} task(s) due today - prioritize these`)
    }
    
    if (availableHours < 4 && tasks.length > 5) {
      recommendations.push(`Limited time today (${availableHours.toFixed(1)}h) - focus on top 2-3 tasks only`)
    }

    // Build the briefing
    const briefing = {
      date: today,
      generated_at: now.toISOString(),
      
      calendar: {
        events: calendarEvents.map(e => ({
          title: e.title || e.summary,
          start: e.start_time,
          end: e.end_time
        })),
        meeting_hours: meetingHours,
        available_hours: availableHours
      },
      
      tasks: {
        total_active: tasks.length,
        urgent,
        high,
        in_progress: inProgress,
        overdue,
        due_today: dueToday,
        due_this_week: dueThisWeek,
        backlog: tasks.filter(t => t.status === 'backlog').length
      },
      
      yesterday: {
        completed: completedYesterday || [],
        completed_count: completedYesterday?.length || 0
      },
      
      recommendations,
      
      summary: {
        focus_task: inProgress[0] || urgent[0] || high[0] || dueToday[0] || null,
        critical_count: overdue.length + urgent.length,
        productivity_score: completedYesterday?.length || 0
      }
    }

    return NextResponse.json(briefing)

  } catch (error) {
    console.error('[Fred Briefing] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate briefing' },
      { status: 500 }
    )
  }
}
