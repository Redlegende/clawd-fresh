'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase, Task } from "@/lib/supabase/client"
import DailyView from "@/components/daily/DailyView"
import { LayoutGrid, Clock } from 'lucide-react';

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-100 dark:bg-slate-800', shortTitle: 'Backlog' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-50 dark:bg-blue-950/30', shortTitle: 'To Do' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-amber-50 dark:bg-amber-950/30', shortTitle: 'Doing' },
  { id: 'review', title: 'Review', color: 'bg-purple-50 dark:bg-purple-950/30', shortTitle: 'Review' },
  { id: 'done', title: 'Done', color: 'bg-green-50 dark:bg-green-950/30', shortTitle: 'Done' },
] as const

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
  }
}

function TaskCard({ task, projectMap }: { task: Task; projectMap: Map<string, string> }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
      <CardContent className="p-3">
        <p className="text-sm font-medium mb-2">{task.title}</p>

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
      </CardContent>
    </Card>
  )
}

function ColumnContent({
  column,
  tasks,
  projectMap
}: {
  column: typeof columns[number]
  tasks: Task[]
  projectMap: Map<string, string>
}) {
  return (
    <div className={`${column.color} rounded-lg p-3 h-full`}>
      <h3 className="font-semibold mb-3 flex items-center justify-between">
        <span className="hidden sm:inline">{column.title}</span>
        <span className="sm:hidden">{column.shortTitle}</span>
        <Badge variant="secondary">{tasks.length}</Badge>
      </h3>

      <div className="space-y-2">
        {tasks.map((task: Task) => (
          <TaskCard key={task.id} task={task} projectMap={projectMap} />
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
  const [projectMap, setProjectMap] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('board')

  useEffect(() => {
    fetchKanbanData()
  }, [])

  async function fetchKanbanData() {
    try {
      const [
        { data: taskData, error: tasksError },
        { data: projectData, error: projectsError }
      ] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name')
      ])

      if (tasksError) console.error('Tasks error:', tasksError)
      if (projectsError) console.error('Projects error:', projectsError)

      setTasks(taskData || [])
      setProjectMap(new Map(projectData?.map(p => [p.id, p.name]) || []))
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const tasksByColumn = columns.reduce((acc, column) => {
    acc[column.id] = tasks.filter((task: Task) => task.status === column.id)
    return acc
  }, {} as Record<string, Task[]>)

  const activeTasks = tasks.filter(t => t.status !== 'done').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">🗂️ Tasks</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">
            {activeTab === 'board' 
              ? `${activeTasks} active • ${tasks.length} total tasks`
              : 'Daily schedule & calendar events'
            }
          </p>
        </div>
        <Button className="w-full sm:w-auto">+ New Task</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="board" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Board</span>
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Today</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          {/* Desktop: Horizontal scroll kanban */}
          <div className="hidden lg:flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => (
              <div key={column.id} className="w-80 flex-shrink-0">
                <ColumnContent
                  column={column}
                  tasks={tasksByColumn[column.id]}
                  projectMap={projectMap}
                />
              </div>
            ))}
          </div>

          {/* Mobile/Tablet: Tabbed view */}
          <div className="lg:hidden">
            <Tabs defaultValue="in_progress" className="w-full">
              <TabsList className="w-full grid grid-cols-5 h-auto">
                {columns.map((column) => (
                  <TabsTrigger
                    key={column.id}
                    value={column.id}
                    className="text-xs px-1 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <span className="hidden sm:inline">{column.shortTitle}</span>
                    <span className="sm:hidden">
                      {column.id === 'in_progress' ? 'Doing' : column.id.slice(0, 3)}
                    </span>
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                      {tasksByColumn[column.id].length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {columns.map((column) => (
                <TabsContent key={column.id} value={column.id} className="mt-4">
                  <ColumnContent
                    column={column}
                    tasks={tasksByColumn[column.id]}
                    projectMap={projectMap}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="daily" className="mt-4">
          <DailyView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
