'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ScheduledTask {
  id: string;
  title: string;
  description: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  duration_minutes: number;
  priority: number;
  status: string;
  energy_level: string | null;
  project_name?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
}

interface TimeBlock {
  hour: number;
  label: string;
  tasks: ScheduledTask[];
  events: CalendarEvent[];
}

export default function DailyView() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDailyData();
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDailyData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00Z`;
      const endOfDay = `${today}T23:59:59Z`;

      // Fetch scheduled tasks
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          projects:project_id (name)
        `)
        .eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
        .gte('scheduled_start', startOfDay)
        .lte('scheduled_start', endOfDay)
        .neq('status', 'completed')
        .order('scheduled_start');

      if (taskError) throw taskError;

      // Fetch calendar events
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time');

      if (eventError) throw eventError;

      setTasks(taskData?.map(t => ({
        ...t,
        project_name: t.projects?.name
      })) || []);
      setEvents(eventData || []);
    } catch (error) {
      console.error('Error fetching daily data:', error);
    } finally {
      setLoading(false);
    }
  }

  const timeBlocks = generateTimeBlocks(tasks, events);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Today</h2>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-bold text-cyan-500">
            {currentTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => t.priority >= 4).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
          {timeBlocks.map((block) => (
            <div 
              key={block.hour}
              className={`flex gap-4 p-3 rounded-lg ${
                block.hour === currentTime.getHours() 
                  ? 'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="w-16 text-sm font-mono text-muted-foreground pt-1">
                {block.label}
              </div>
              
              <div className="flex-1 space-y-2">
                {/* Events */}
                {block.events.map((event) => (
                  <div 
                    key={event.id}
                    className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800"
                  >
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">{event.summary}</span>
                    {event.is_all_day && (
                      <Badge variant="secondary" className="text-xs">All day</Badge>
                    )}
                  </div>
                ))}

                {/* Tasks */}
                {block.tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`flex items-center gap-2 p-2 rounded border ${
                      task.status === 'in_progress'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : task.status === 'in_progress' ? (
                      <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    ) : (
                      <div className={`w-4 h-4 rounded-full ${
                        task.priority >= 4 ? 'bg-red-500' :
                        task.priority === 3 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{task.title}</span>
                      {task.project_name && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {task.project_name}
                        </span>
                      )}
                    </div>

                    {task.energy_level && (
                      <Badge variant="outline" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        {task.energy_level}
                      </Badge>
                    )}

                    <span className="text-xs text-muted-foreground">
                      {task.duration_minutes}m
                    </span>
                  </div>
                ))}

                {block.events.length === 0 && block.tasks.length === 0 && (
                  <div className="text-sm text-muted-foreground italic">
                    Free time
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function generateTimeBlocks(tasks: ScheduledTask[], events: CalendarEvent[]): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  
  for (let hour = 6; hour <= 22; hour++) {
    const hourTasks = tasks.filter(task => {
      if (!task.scheduled_start) return false;
      const taskHour = new Date(task.scheduled_start).getHours();
      return taskHour === hour;
    });

    const hourEvents = events.filter(event => {
      const eventHour = new Date(event.start_time).getHours();
      return eventHour === hour;
    });

    blocks.push({
      hour,
      label: `${hour === 12 ? 12 : hour % 12} ${hour < 12 ? 'AM' : 'PM'}`,
      tasks: hourTasks,
      events: hourEvents
    });
  }

  return blocks;
}
