import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const mockTasks = [
  { id: 1, title: "Setup Garmin integration", status: "in_progress", priority: "high" },
  { id: 2, title: "Connect Supabase", status: "todo", priority: "urgent" },
  { id: 3, title: "Design dashboard layout", status: "done", priority: "medium" },
]

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-50 dark:bg-blue-950/30' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-amber-50 dark:bg-amber-950/30' },
  { id: 'review', title: 'Review', color: 'bg-purple-50 dark:bg-purple-950/30' },
  { id: 'done', title: 'Done', color: 'bg-green-50 dark:bg-green-950/30' },
]

export default function KanbanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🗂️ Kanban</h1>
          <p className="text-muted-foreground mt-1">Task management across all projects</p>
        </div>
        <Button>New Task</Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="w-72 flex-shrink-0">
            <div className={`${column.color} rounded-lg p-3`}>
              <h3 className="font-semibold mb-3 flex items-center justify-between">
                {column.title}
                <Badge variant="secondary">
                  {mockTasks.filter(t => t.status === column.id).length}
                </Badge>
              </h3>
              
              <div className="space-y-2">
                {mockTasks
                  .filter(task => task.status === column.id)
                  .map(task => (
                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">{task.title}</p>
                        <Badge 
                          variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}
                          className="mt-2 text-xs"
                        >
                          {task.priority}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                
                {mockTasks.filter(t => t.status === column.id).length === 0 && (
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
