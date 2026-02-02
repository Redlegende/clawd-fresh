import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase, Task, Project } from "@/lib/supabase/client"

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-50 dark:bg-blue-950/30' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-amber-50 dark:bg-amber-950/30' },
  { id: 'review', title: 'Review', color: 'bg-purple-50 dark:bg-purple-950/30' },
  { id: 'done', title: 'Done', color: 'bg-green-50 dark:bg-green-950/30' },
] as const

async function getKanbanData() {
  const [
    { data: tasks, error: tasksError },
    { data: projects, error: projectsError }
  ] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('projects').select('id, name')
  ])

  if (tasksError) console.error('Tasks error:', tasksError)
  if (projectsError) console.error('Projects error:', projectsError)

  // Create project lookup map
  const projectMap = new Map(projects?.map(p => [p.id, p.name]) || [])

  return {
    tasks: tasks || [],
    projectMap
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
  }
}

export default async function KanbanPage() {
  const { tasks, projectMap } = await getKanbanData()

  const tasksByColumn = columns.reduce((acc, column) => {
    acc[column.id] = tasks.filter((task: Task) => task.status === column.id)
    return acc
  }, {} as Record<string, Task[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🗂️ Kanban</h1>
          <p className="text-muted-foreground mt-1">
            {tasks.length} tasks across all projects
          </p>
        </div>
        <Button>New Task</Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="w-80 flex-shrink-0">
            <div className={`${column.color} rounded-lg p-3`}>
              <h3 className="font-semibold mb-3 flex items-center justify-between">
                {column.title}
                <Badge variant="secondary">
                  {tasksByColumn[column.id]?.length || 0}
                </Badge>
              </h3>
              
              <div className="space-y-2">
                {tasksByColumn[column.id]?.map((task: Task) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
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
                ))}
                
                {(!tasksByColumn[column.id] || tasksByColumn[column.id].length === 0) && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
