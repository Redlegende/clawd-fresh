import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface TimeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
}

interface Task {
  id: string;
  title: string;
  duration_minutes: number;
  priority: number;
  energy_level: 'high' | 'medium' | 'low' | null;
  deadline: string | null;
  dependencies: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { taskId, date } = await request.json();
    
    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('orchestrator.tasks')
      .select('*, task_dependencies!task_dependencies_task_id_fkey(depends_on_task_id)')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get calendar events for the date
    const targetDate = new Date(date || new Date());
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: events, error: eventsError } = await supabase
      .from('orchestrator.events')
      .select('*')
      .eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time');

    if (eventsError) {
      console.error('Events error:', eventsError);
    }

    // Get user preferences (working hours, energy patterns)
    const { data: userPrefs } = await supabase
      .from('orchestrator.users')
      .select('working_hours_start, working_hours_end, timezone')
      .eq('id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
      .single();

    // Find optimal slot
    const suggestedSlot = findOptimalSlot({
      task,
      events: events || [],
      userPrefs: userPrefs || { working_hours_start: '09:00', working_hours_end: '17:00' },
      targetDate
    });

    if (!suggestedSlot) {
      return NextResponse.json({
        success: false,
        message: 'No suitable time slot found for this task',
        alternatives: suggestAlternativeDays(task, 5)
      });
    }

    // Check for conflicts
    const conflicts = findConflicts(suggestedSlot, events || []);

    return NextResponse.json({
      success: true,
      suggestedSlot: {
        start: suggestedSlot.start.toISOString(),
        end: suggestedSlot.end.toISOString(),
        durationMinutes: suggestedSlot.durationMinutes,
      },
      conflicts: conflicts.length > 0 ? conflicts : null,
      reasoning: generateReasoning(suggestedSlot, task, userPrefs)
    });

  } catch (error) {
    console.error('Schedule task error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule task', details: (error as Error).message },
      { status: 500 }
    );
  }
}

interface SchedulingParams {
  task: Task;
  events: any[];
  userPrefs: {
    working_hours_start?: string;
    working_hours_end?: string;
    timezone?: string;
  };
  targetDate: Date;
}

function findOptimalSlot({ task, events, userPrefs, targetDate }: SchedulingParams): TimeSlot | null {
  const workStart = parseTime(userPrefs.working_hours_start || '09:00', targetDate);
  const workEnd = parseTime(userPrefs.working_hours_end || '17:00', targetDate);
  const durationMs = (task.duration_minutes || 60) * 60 * 1000;

  // Build busy periods
  const busyPeriods = events
    .filter(e => e.status !== 'cancelled')
    .map(e => ({
      start: new Date(e.start_time),
      end: new Date(e.end_time)
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Find free slots
  const freeSlots: TimeSlot[] = [];
  let currentTime = new Date(workStart);

  for (const busy of busyPeriods) {
    if (busy.start > currentTime) {
      const slotEnd = busy.start < workEnd ? busy.start : workEnd;
      if (slotEnd > currentTime) {
        freeSlots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd),
          durationMinutes: (slotEnd.getTime() - currentTime.getTime()) / 60000
        });
      }
    }
    currentTime = busy.end > currentTime ? busy.end : currentTime;
    if (currentTime >= workEnd) break;
  }

  // Check remaining time after last event
  if (currentTime < workEnd) {
    freeSlots.push({
      start: new Date(currentTime),
      end: new Date(workEnd),
      durationMinutes: (workEnd.getTime() - currentTime.getTime()) / 60000
    });
  }

  // Score and rank slots
  const scoredSlots = freeSlots
    .filter(slot => slot.durationMinutes >= (task.duration_minutes || 60))
    .map(slot => ({
      slot,
      score: scoreSlot(slot, task, events)
    }))
    .sort((a, b) => b.score - a.score);

  if (scoredSlots.length === 0) return null;

  const bestSlot = scoredSlots[0].slot;
  return {
    start: bestSlot.start,
    end: new Date(bestSlot.start.getTime() + durationMs),
    durationMinutes: task.duration_minutes || 60
  };
}

function scoreSlot(slot: TimeSlot, task: Task, allEvents: any[]): number {
  let score = 0;
  const hour = slot.start.getHours();

  // Morning preference for high-energy tasks
  if (task.energy_level === 'high' && hour >= 8 && hour <= 11) {
    score += 30;
  }

  // Afternoon for medium energy
  if (task.energy_level === 'medium' && hour >= 13 && hour <= 16) {
    score += 20;
  }

  // Buffer from other events (avoid back-to-back)
  const bufferScore = calculateBufferScore(slot, allEvents);
  score += bufferScore;

  // Prefer earlier in day for urgent tasks (high priority)
  if (task.priority >= 4) {
    score += (17 - hour) * 5; // Earlier = higher score
  }

  return score;
}

function calculateBufferScore(slot: TimeSlot, events: any[]): number {
  let score = 0;
  const bufferMs = 15 * 60 * 1000; // 15 min buffer

  for (const event of events) {
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);
    
    // Check if slot starts right after an event (bad)
    const gapBefore = slot.start.getTime() - eventEnd.getTime();
    if (gapBefore >= 0 && gapBefore < bufferMs) {
      score -= 10; // Small penalty for tight transition
    }

    // Check if slot ends right before an event (bad)
    const gapAfter = eventStart.getTime() - slot.end.getTime();
    if (gapAfter >= 0 && gapAfter < bufferMs) {
      score -= 10;
    }
  }

  return score;
}

function findConflicts(slot: TimeSlot, events: any[]): any[] {
  return events.filter(event => {
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);
    return slot.start < eventEnd && slot.end > eventStart;
  });
}

function parseTime(timeStr: string, baseDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function generateReasoning(slot: TimeSlot, task: Task, prefs: any): string {
  const hour = slot.start.getHours();
  const timeStr = slot.start.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  if (task.energy_level === 'high' && hour < 12) {
    return `Scheduled at ${timeStr} to match your high-energy morning window.`;
  }
  if (task.priority >= 4) {
    return `Scheduled at ${timeStr} early in the day due to high priority.`;
  }
  return `Scheduled at ${timeStr} based on your available time.`;
}

async function suggestAlternativeDays(task: Task, days: number): Promise<string[]> {
  const alternatives = [];
  const today = new Date();
  
  for (let i = 1; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    alternatives.push(date.toISOString().split('T')[0]);
  }
  
  return alternatives;
}
