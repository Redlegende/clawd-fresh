'use client'

import { useCallback, useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { MessageSquare } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { TaskDetailModal } from './TaskDetailModal'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Task = {
  id: string
  title: string
  description?: string
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  project_id?: string
  due_date?: string
  tags?: string[]
  comment_count?: number
  created_at: string
  updated_at: string
}

export type Column = {
  id: string
  title: string
  shortTitle: string
}

const columns: Column[] = [
  { id: 'backlog', title: 'Backlog', shortTitle: 'Backlog' },
  { id: 'todo', title: 'To Do', shortTitle: 'To Do' },
  { id: 'in_progress', title: 'In Progress', shortTitle: 'Doing' },
  { id: 'review', title: 'Review', shortTitle: 'Review' },
  { id: 'done', title: 'Done', shortTitle: 'Done' },
]

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_8px_rgba(255,0,85,0.3)]'
    case 'high': return 'bg-orange-500/20 text-orange-400 border border-orange-500/50 shadow-[0_0_8px_rgba(255,136,0,0.3)]'
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
    default: return 'bg-green-500/20 text-green-400 border border-green-500/50'
  }
}

function getColumnColor(columnId: string): string {
  switch (columnId) {
    case 'backlog': return 'bg-[#1a1a25] border-[#555588]'
    case 'todo': return 'bg-[#0d1a2a] border-[#0088ff]'
    case 'in_progress': return 'bg-[#1a1408] border-[#ff8800]'
    case 'review': return 'bg-[#1a0d25] border-[#8855ff]'
    case 'done': return 'bg-[#0d1a14] border-[#00ff88]'
    default: return 'bg-[#1a1a25] border-[#555588]'
  }
}

interface TaskCardProps {
  task: Task
  projectMap: Map<string, string>
  onStatusChange: (task: Task, newStatus: Task['status']) => Promise<void>
  onTaskClick: (task: Task) => void
  index: number
}

function TaskCard({ task, projectMap, onStatusChange, onTaskClick, index }: TaskCardProps) {
  const handleToggle = async () => {
    if (task.status === 'done') {
      await onStatusChange(task, 'todo')
    } else {
      await onStatusChange(task, 'done')
    }
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 ${snapshot.isDragging ? 'rotate-2 scale-105' : ''}`}
        >
          <Card 
            onClick={() => onTaskClick(task)}
            className={`cursor-pointer transition-all ${
              snapshot.isDragging 
                ? 'shadow-[0_0_30px_rgba(136,85,255,0.4)] ring-2 ring-purple-500/50 rotate-2 scale-105' 
                : 'hover:shadow-[0_0_20px_rgba(0,255,255,0.15)] hover:border-cyan-500/30'
            } bg-[#12121a] border-[#1a1a25]`}>
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={task.status === 'done'}
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:shadow-[0_0_8px_rgba(0,255,136,0.5)]"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium mb-1 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </p>

                  {task.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>

                      {task.project_id && projectMap.get(task.project_id) && (
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                          {projectMap.get(task.project_id)}
                        </span>
                      )}
                    </div>

                    {(task.comment_count || 0) > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span className="text-xs">{task.comment_count}</span>
                      </div>
                    )}
                  </div>

                  {task.due_date && (() => {
                    const dueDate = new Date(task.due_date)
                    const today = new Date(new Date().toDateString())
                    const isOverdue = dueDate < today && task.status !== 'done'
                    const isDueToday = dueDate.toDateString() === today.toDateString()
                    const isDueTomorrow = dueDate.toDateString() === new Date(today.getTime() + 86400000).toDateString()
                    
                    let dateClass = 'text-muted-foreground'
                    let icon = '📅'
                    let label = dueDate.toLocaleDateString('no-NO')
                    
                    if (isOverdue) {
                      dateClass = 'text-red-400 font-medium'
                      icon = '🚨'
                      label = `Overdue: ${label}`
                    } else if (isDueToday) {
                      dateClass = 'text-orange-400 font-medium'
                      icon = '⏰'
                      label = 'Due today'
                    } else if (isDueTomorrow) {
                      dateClass = 'text-yellow-400'
                      icon = '📅'
                      label = 'Due tomorrow'
                    }
                    
                    return (
                      <p className={`text-xs mt-1 ${dateClass}`}>
                        {icon} {label}
                      </p>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  )
}

function StrictModeDroppable({ children, ...props }: React.ComponentProps<typeof Droppable>) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true))
    return () => {
      cancelAnimationFrame(animation)
      setEnabled(false)
    }
  }, [])

  if (!enabled) {
    return null
  }

  return <Droppable {...props}>{children}</Droppable>
}

interface KanbanColumnProps {
  column: Column
  tasks: Task[]
  projectMap: Map<string, string>
  onStatusChange: (task: Task, newStatus: Task['status']) => Promise<void>
  onTaskClick: (task: Task) => void
}

function KanbanColumn({ column, tasks, projectMap, onStatusChange, onTaskClick }: KanbanColumnProps) {
  return (
    <div className={`w-72 lg:w-80 flex-shrink-0 rounded-lg border ${getColumnColor(column.id)}`}>
      <div className="p-3 border-b border-inherit">
        <h3 className="font-semibold flex items-center justify-between">
          <span className="hidden sm:inline">{column.title}</span>
          <span className="sm:hidden">{column.shortTitle}</span>
          <Badge variant="secondary">{tasks.length}</Badge>
        </h3>
      </div>

      <StrictModeDroppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-2 min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-cyan-500/10' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                projectMap={projectMap}
                onStatusChange={onStatusChange}
                onTaskClick={onTaskClick}
                index={index}
              />
            ))}
            {provided.placeholder}
            
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No tasks
              </div>
            )}
          </div>
        )}
      </StrictModeDroppable>
    </div>
  )
}

interface KanbanBoardProps {
  tasks: Task[]
  projectMap: Map<string, string>
  showCompleted: boolean
  onTasksChange: (tasks: Task[]) => void
  onStatusChange: (task: Task, newStatus: Task['status']) => Promise<void>
}

export function KanbanBoard({ 
  tasks, 
  projectMap, 
  showCompleted, 
  onTasksChange,
  onStatusChange 
}: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setDetailModalOpen(true)
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    const updatedTasks = tasks.map(t => 
      t.id === updatedTask.id ? { ...t, ...updatedTask } : t
    )
    onTasksChange(updatedTasks)
    setSelectedTask(updatedTask)
  }
  
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const task = tasks.find(t => t.id === draggableId)
    if (!task) return

    const newStatus = destination.droppableId as Task['status']
    const previousStatus = task.status

    // Optimistic update
    const updatedTasks = tasks.map(t => 
      t.id === draggableId ? { ...t, status: newStatus } : t
    )
    onTasksChange(updatedTasks)

    try {
      // Update in Supabase
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      if (newStatus === 'done') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', draggableId)

      if (error) throw error

      // Send webhook notification if status changed to done
      if (newStatus === 'done' && previousStatus !== 'done') {
        await fetch('/api/webhooks/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'task.completed',
            timestamp: new Date().toISOString(),
            task: {
              id: task.id,
              title: task.title,
              status: newStatus,
              previous_status: previousStatus,
              completed_by: 'jakob',
              completed_at: new Date().toISOString()
            }
          })
        })
      } else if (newStatus !== previousStatus) {
        await fetch('/api/webhooks/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'task.updated',
            timestamp: new Date().toISOString(),
            task: {
              id: task.id,
              title: task.title,
              status: newStatus,
              previous_status: previousStatus,
              updated_by: 'jakob'
            }
          })
        })
      }

      console.log(`[Kanban] Moved "${task.title}" from ${previousStatus} to ${newStatus}`)

    } catch (error) {
      console.error('Failed to update task:', error)
      // Revert on error
      onTasksChange(tasks)
    }
  }, [tasks, onTasksChange])

  const tasksByColumn = columns.reduce((acc, column) => {
    acc[column.id] = tasks.filter(task => task.status === column.id)
    return acc
  }, {} as Record<string, Task[]>)

  const visibleColumns = showCompleted 
    ? columns 
    : columns.filter(col => col.id !== 'done')

  return (
    <>
      <div className="relative">
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Desktop: Horizontal scroll */}
          <div className="hidden lg:flex gap-4 overflow-x-auto pb-4">
            {visibleColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByColumn[column.id] || []}
                projectMap={projectMap}
                onStatusChange={onStatusChange}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>

          {/* Mobile: Stacked */}
          <div className="lg:hidden space-y-4">
            {visibleColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByColumn[column.id] || []}
                projectMap={projectMap}
                onStatusChange={onStatusChange}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      <TaskDetailModal
        task={selectedTask}
        projectName={selectedTask ? projectMap.get(selectedTask.project_id || '') : undefined}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onTaskUpdated={handleTaskUpdated}
      />
    </>
  )
}
