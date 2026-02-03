'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { LayoutGrid, CheckCircle2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-100 dark:bg-slate-800', shortTitle: 'Backlog' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-50 dark:bg-blue-950/30', shortTitle: 'To Do' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-amber-50 dark:bg-amber-950/30', shortTitle: 'Doing' },
  { id: 'review', title: 'Review', color: 'bg-purple-50 dark:bg-purple-950/30', shortTitle: 'Review' },
  { id: 'done', title: 'Done', color: 'bg-green-50 dark:bg-green-950/30', shortTitle: 'Done' },
] as const

type Task = {
  id: string
  title: string
  description?: string
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  project_id?: string
  due_date?: string
  created_at: string
  updated_at: string
}

type Project = {
  id: string
  name: string
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
  }
}

/**
 * Send webhook notification to Fred
 */
async function sendTaskWebhook(
  event: string,
  task: Task,
  previousData?: Partial<Task>
) {
  try {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        previous_status: previousData?.status,
        priority: task.priority,
        project_id: task.project_id,
        due_date: task.due_date,
        completed_by: 'jakob',
        completed_at: task.status === 'done' ? new Date().toISOString() : undefined,
        updated_by: 'jakob'
      }
    }

    const response = await fetch('/api/webhooks/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': 'temp-signature'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`)
    }

    console.log(`[TaskSync] Sent ${event} for:`, task.title)
    return await response.json()

  } catch (error) {
    console.error('[TaskSync] Failed to send webhook:', error)
    // Don't throw - we don't want to block the UI on webhook failure
  }
}

function TaskCard({ 
  task, 
  projectMap, 
  onStatusChange 
}: { 
  task: Task
  projectMap: Map<string, string>
  onStatusChange: (task: Task, newStatus: Task['status']) => void
}) {
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = async () => {
    if (task.status === 'done') return
    
    setIsCompleting(true)
    const previousStatus = task.status
    
    // Optimistically update UI
    onStatusChange(task, 'done')
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
          completed_by: 'jakob',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error

      // Notify Fred
      await sendTaskWebhook('task.completed', 
        { ...task, status: 'done' }, 
        { status: previousStatus }
      )

    } catch (error) {
      console.error('Failed to complete task:', error)
      // Revert on error
      onStatusChange(task, previousStatus)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-slate-900 group">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {/* Complete checkbox */}
          <div className="pt-0.5">
            <Checkbox 
              checked={task.status === 'done'}
              onCheckedChange={handleComplete}
              disabled={isCompleting || task.status === 'done'}
              className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium mb-2 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </p>

            {task.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>

              {task.project_id && projectMap.get(task.project_id) && (
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {projectMap.get(task.project_id)}
                </span>
              )}
            </div>

            {task.due_date && (
              <p className="text-xs text-muted-foreground mt-2">
                Due: {new Date(task.due_date).toLocaleDateString('no-NO')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ColumnContent({
  column,
  tasks,
  projectMap,
  onStatusChange
}: {
  column: typeof columns[number]
  tasks: Task[]
  projectMap: Map<string, string>
  onStatusChange: (task: Task, newStatus: Task['status']) => void
}) {
  return (
    <div className={`${column.color} rounded-lg p-3 h-full min-h-[300px]`}>
      <h3 className="font-semibold mb-3 flex items-center justify-between">
        <span className="hidden sm:inline">{column.title}</span>
        <span className="sm:hidden">{column.shortTitle}</span>
        <Badge variant="secondary">{tasks.length}</Badge>
      </h3>

      <div className="space-y-2">
        {tasks.map((task: Task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            projectMap={projectMap}
            onStatusChange={onStatusChange}
          />
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)

  // Fetch tasks and projects
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all tasks (including done for the Done column)
        const { data: taskData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })

        if (tasksError) throw tasksError

        const { data: projectData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name')

        if (projectsError) throw projectsError

        setTasks(taskData || [])
        setProjects(projectData || [])
      } catch (error) {
        console.error('Error fetching kanban data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle status change (optimistic update)
  const handleStatusChange = useCallback((task: Task, newStatus: Task['status']) => {
    setTasks(prev => 
      prev.map(t => 
        t.id === task.id ? { ...t, status: newStatus } : t
      )
    )
  }, [])

  const projectMap = new Map(projects.map(p => [p.id, p.name]))
  const activeTasks = tasks.filter(t => t.status !== 'done').length
  const doneTasks = tasks.filter(t => t.status === 'done').length

  const tasksByColumn = columns.reduce((acc, column) => {
    acc[column.id] = tasks.filter((task: Task) => task.status === column.id)
    return acc
  }, {} as Record<string, Task[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <LayoutGrid className="h-6 w-6" />
            Tasks
          </h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">
            {activeTasks} active • {doneTasks} completed • {tasks.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className={showCompleted ? 'bg-green-50' : ''}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {showCompleted ? 'Hide' : 'Show'} Done
          </Button>
          <Button className="w-full sm:w-auto">+ New Task</Button>
        </div>
      </div>

      {/* Desktop: Horizontal scroll kanban */}
      <div className="hidden lg:flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div 
            key={column.id} 
            className={`w-80 flex-shrink-0 ${column.id === 'done' && !showCompleted ? 'hidden' : ''}`}
          >
            <ColumnContent
              column={column}
              tasks={tasksByColumn[column.id]}
              projectMap={projectMap}
              onStatusChange={handleStatusChange}
            />
          </div>
        ))}
      </div>

      {/* Mobile/Tablet: Stacked view */}
      <div className="lg:hidden space-y-4">
        {columns.map((column) => (
          <div 
            key={column.id}
            className={column.id === 'done' && !showCompleted ? 'hidden' : ''}
          >
            <ColumnContent
              column={column}
              tasks={tasksByColumn[column.id]}
              projectMap={projectMap}
              onStatusChange={handleStatusChange}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
