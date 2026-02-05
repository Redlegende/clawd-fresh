'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutGrid, CheckCircle2, Plus, Filter, AlertCircle, Clock } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { TaskModal } from '@/components/kanban/TaskModal'
import { KanbanBoard, Task } from '@/components/kanban/KanbanBoard'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

type Project = {
  id: string
  name: string
}

const PRIORITY_FILTERS = ['all', 'urgent', 'high', 'medium', 'low'] as const
const CATEGORY_TAGS = ['business', 'finance', 'health', 'tech', 'personal'] as const

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

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

  const handleTaskCreated = useCallback((newTask: Task) => {
    setTasks(prev => [newTask, ...prev])
  }, [])

  const handleStatusChange = useCallback(async (task: Task, newStatus: Task['status']) => {
    const previousStatus = task.status
    
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: newStatus } : t
    ))

    try {
      const updateData: Record<string, any> = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      // Set or clear completed_at based on status
      if (newStatus === 'done') {
        updateData.completed_at = new Date().toISOString()
      } else if (previousStatus === 'done') {
        updateData.completed_at = null
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id)

      if (error) throw error

      // Notify Fred
      const event = newStatus === 'done' ? 'task.completed' : 
                    previousStatus === 'done' ? 'task.reopened' : 'task.updated'
      
      await fetch('/api/webhooks/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          task: {
            id: task.id,
            title: task.title,
            status: newStatus,
            previous_status: previousStatus
          }
        })
      })
    } catch (error) {
      console.error('Failed to update task:', error)
      // Revert on error
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: previousStatus } : t
      ))
    }
  }, [])

  const projectMap = new Map(projects.map(p => [p.id, p.name]))
  
  // Apply filters
  const filteredTasks = useMemo(() => {
    let result = tasks
    
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter)
    }
    
    if (categoryFilter !== 'all') {
      result = result.filter(t => 
        t.tags?.includes(categoryFilter) || 
        projectMap.get(t.project_id || '')?.toLowerCase().includes(categoryFilter)
      )
    }
    
    return result
  }, [tasks, priorityFilter, categoryFilter, projectMap])

  const activeTasks = filteredTasks.filter(t => t.status !== 'done').length
  const doneTasks = filteredTasks.filter(t => t.status === 'done').length
  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length
  const overdueCount = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false
    return new Date(t.due_date) < new Date(new Date().toDateString())
  }).length

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
            {activeTasks} active • {doneTasks} completed
            {urgentCount > 0 && <span className="text-red-500 ml-2">• {urgentCount} urgent</span>}
            {overdueCount > 0 && <span className="text-orange-500 ml-2">• {overdueCount} overdue</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className={showCompleted ? 'bg-green-50 dark:bg-green-950' : ''}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {showCompleted ? 'Hide' : 'Show'} Done
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => setShowTaskModal(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Filter className="h-4 w-4" /> Priority:
        </span>
        {PRIORITY_FILTERS.map((p) => (
          <Button
            key={p}
            variant={priorityFilter === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPriorityFilter(p)}
            className={`text-xs ${p === 'urgent' && priorityFilter !== p ? 'border-red-500/50 text-red-400' : ''} ${p === 'high' && priorityFilter !== p ? 'border-orange-500/50 text-orange-400' : ''}`}
          >
            {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
        
        <span className="text-sm text-muted-foreground ml-4">Category:</span>
        <Button
          variant={categoryFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategoryFilter('all')}
          className="text-xs"
        >
          All
        </Button>
        {CATEGORY_TAGS.map((tag) => (
          <Button
            key={tag}
            variant={categoryFilter === tag ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(tag)}
            className="text-xs"
          >
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </Button>
        ))}
      </div>

      <KanbanBoard
        tasks={filteredTasks}
        projectMap={projectMap}
        showCompleted={showCompleted}
        onTasksChange={setTasks}
        onStatusChange={handleStatusChange}
      />

      <TaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        projects={projects}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  )
}
