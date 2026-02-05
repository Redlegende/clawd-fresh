import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/fred/tasks/calendar
 * Create a task AND add it to the calendar if it has a due date
 * 
 * This is Fred's preferred endpoint when creating tasks that need calendar blocking
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
      add_to_calendar = false,
      calendar_duration_hours = 1
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        priority,
        status,
        project_id: project_id || null,
        due_date: due_date || null,
        tags: tags || [],
        source: 'fred',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (taskError) throw taskError

    let calendarEvent = null

    // Add to calendar if requested and has due date
    if (add_to_calendar && due_date) {
      try {
        // Check if user has connected calendar
        const { data: calendar } = await supabase
          .from('calendars')
          .select('*')
          .single()

        if (calendar?.access_token) {
          // Create calendar event via Google Calendar API
          const startTime = new Date(due_date)
          startTime.setHours(9, 0, 0, 0) // Default to 9 AM
          
          const endTime = new Date(startTime)
          endTime.setHours(startTime.getHours() + calendar_duration_hours)

          const event = {
            summary: `🎯 ${title}`,
            description: description || `Task from The Observatory\n\nPriority: ${priority}`,
            start: {
              dateTime: startTime.toISOString(),
              timeZone: 'Europe/Oslo'
            },
            end: {
              dateTime: endTime.toISOString(),
              timeZone: 'Europe/Oslo'
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 60 },
                { method: 'popup', minutes: 15 }
              ]
            }
          }

          const calendarResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${calendar.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(event)
            }
          )

          if (calendarResponse.ok) {
            calendarEvent = await calendarResponse.json()
            console.log(`[Fred] Added to calendar: ${title}`)
          } else {
            console.error('[Fred] Failed to add to calendar:', await calendarResponse.text())
          }
        }
      } catch (calError) {
        console.error('[Fred] Calendar integration error:', calError)
        // Don't fail the task creation if calendar fails
      }
    }

    // Log the creation
    await supabase.from('task_sync_log').insert({
      event_type: 'created',
      task_id: task.id,
      task_title: task.title,
      new_status: task.status,
      synced_at: new Date().toISOString(),
      webhook_status: 'delivered'
    })

    console.log(`[Fred] Task created: ${task.title}${calendarEvent ? ' (+ calendar)' : ''}`)

    return NextResponse.json({
      ok: true,
      message: calendarEvent 
        ? 'Task created and added to calendar' 
        : 'Task created successfully',
      task,
      calendar_event: calendarEvent ? {
        id: calendarEvent.id,
        link: calendarEvent.htmlLink
      } : null
    }, { status: 201 })

  } catch (error) {
    console.error('[Fred API] Error creating task with calendar:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
