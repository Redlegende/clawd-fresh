import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface ConflictCheck {
  taskId: string;
  proposedStart: string;
  proposedEnd: string;
}

interface Conflict {
  type: 'calendar_event' | 'other_task' | 'dependency_not_met' | 'deadline_at_risk';
  severity: 'warning' | 'blocking';
  message: string;
  conflictingItem?: {
    id: string;
    title: string;
    start: string;
    end: string;
  };
  suggestion?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConflictCheck = await request.json();
    const { taskId, proposedStart, proposedEnd } = body;

    const conflicts: Conflict[] = [];
    const userId = 'b4004bf7-9b69-47e5-8032-c0f39c654a61';

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('orchestrator.tasks')
      .select('*, task_dependencies!task_dependencies_task_id_fkey(depends_on_task_id)')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const startTime = new Date(proposedStart);
    const endTime = new Date(proposedEnd);

    // 1. Check calendar event conflicts
    const { data: calendarConflicts, error: calError } = await supabase
      .from('orchestrator.events')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .or(`start_time.lte.${proposedEnd},end_time.gte.${proposedStart}`)
      .order('start_time');

    if (calError) {
      console.error('Calendar check error:', calError);
    }

    for (const event of calendarConflicts || []) {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      // Check for actual overlap
      if (startTime < eventEnd && endTime > eventStart) {
        const overlapMinutes = Math.min(
          endTime.getTime() - startTime.getTime(),
          Math.min(endTime.getTime() - eventStart.getTime(), eventEnd.getTime() - startTime.getTime())
        ) / 60000;

        conflicts.push({
          type: 'calendar_event',
          severity: overlapMinutes > 15 ? 'blocking' : 'warning',
          message: `Overlaps with "${event.summary}"`,
          conflictingItem: {
            id: event.id,
            title: event.summary,
            start: event.start_time,
            end: event.end_time,
          },
          suggestion: `Reschedule to after ${eventEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
        });
      }
    }

    // 2. Check other task conflicts
    const { data: taskConflicts, error: taskConfError } = await supabase
      .from('orchestrator.tasks')
      .select('*')
      .eq('user_id', userId)
      .neq('id', taskId)
      .neq('status', 'completed')
      .not('scheduled_start', 'is', null)
      .or(`scheduled_start.lte.${proposedEnd},scheduled_end.gte.${proposedStart}`);

    if (taskConfError) {
      console.error('Task conflict error:', taskConfError);
    }

    for (const otherTask of taskConflicts || []) {
      const otherStart = new Date(otherTask.scheduled_start);
      const otherEnd = new Date(otherTask.scheduled_end);

      if (startTime < otherEnd && endTime > otherStart) {
        conflicts.push({
          type: 'other_task',
          severity: 'warning',
          message: `Overlaps with task "${otherTask.title}"`,
          conflictingItem: {
            id: otherTask.id,
            title: otherTask.title,
            start: otherTask.scheduled_start,
            end: otherTask.scheduled_end,
          },
          suggestion: 'Consider batching these tasks or sequential scheduling'
        });
      }
    }

    // 3. Check dependencies
    const dependencies = task.task_dependencies || [];
    if (dependencies.length > 0) {
      const depIds = dependencies.map((d: any) => d.depends_on_task_id);
      
      const { data: depTasks, error: depError } = await supabase
        .from('orchestrator.tasks')
        .select('id, title, status, scheduled_end')
        .in('id', depIds);

      if (!depError && depTasks) {
        for (const dep of depTasks) {
          if (dep.status !== 'completed') {
            // Check if dependency ends before this task starts
            const depEnd = dep.scheduled_end ? new Date(dep.scheduled_end) : null;
            
            if (!depEnd || depEnd > startTime) {
              conflicts.push({
                type: 'dependency_not_met',
                severity: 'blocking',
                message: `Depends on incomplete task "${dep.title}"`,
                conflictingItem: {
                  id: dep.id,
                  title: dep.title,
                  start: dep.scheduled_end || '',
                  end: dep.scheduled_end || '',
                },
                suggestion: depEnd 
                  ? `Schedule after ${depEnd.toLocaleString()}`
                  : 'Complete dependency task first'
              });
            }
          }
        }
      }
    }

    // 4. Check deadline risk
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      const bufferHours = 24; // Require 24h buffer before deadline
      const bufferDeadline = new Date(deadline.getTime() - bufferHours * 60 * 60 * 1000);

      if (endTime > bufferDeadline) {
        conflicts.push({
          type: 'deadline_at_risk',
          severity: 'warning',
          message: `Task ends close to deadline (${deadline.toLocaleDateString()})`,
          suggestion: 'Consider scheduling earlier or adjusting deadline'
        });
      }
    }

    // 5. Check work-life boundaries (optional warning)
    const hour = startTime.getHours();
    if (hour < 7 || hour >= 22) {
      conflicts.push({
        type: 'calendar_event',
        severity: 'warning',
        message: `Scheduled outside typical working hours (${hour}:00)`,
        suggestion: 'Consider if this is intentional or should be moved'
      });
    }

    // Sort by severity (blocking first)
    conflicts.sort((a, b) => {
      if (a.severity === 'blocking' && b.severity !== 'blocking') return -1;
      if (b.severity === 'blocking' && a.severity !== 'blocking') return 1;
      return 0;
    });

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      blockingCount: conflicts.filter(c => c.severity === 'blocking').length,
      warningCount: conflicts.filter(c => c.severity === 'warning').length,
      conflicts,
      canSchedule: conflicts.every(c => c.severity !== 'blocking'),
    });

  } catch (error) {
    console.error('Conflict check error:', error);
    return NextResponse.json(
      { error: 'Failed to check conflicts', details: (error as Error).message },
      { status: 500 }
    );
  }
}
