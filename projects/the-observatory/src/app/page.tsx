import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Wallet, Kanban, FileText, TrendingUp, CheckCircle2 } from "lucide-react"
import { supabase, Project, Task } from "@/lib/supabase/client"

async function getDashboardData() {
  // Fetch all data in parallel
  const [
    { data: projects, error: projectsError },
    { data: tasks, error: tasksError },
    { data: fitness, error: fitnessError },
    { data: finance, error: financeError },
    { data: research, error: researchError }
  ] = await Promise.all([
    supabase.from('projects').select('*').order('priority', { ascending: false }),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('fitness_metrics').select('*').order('date', { ascending: false }).limit(1),
    supabase.from('finance_entries').select('*'),
    supabase.from('research_notes').select('*')
  ])

  if (projectsError) console.error('Projects error:', projectsError)
  if (tasksError) console.error('Tasks error:', tasksError)

  // Calculate stats
  const activeTasks = tasks?.filter(t => t.status !== 'done').length || 0
  const completedTasks = tasks?.filter(t => t.status === 'done').length || 0
  const highPriorityTasks = tasks?.filter(t => t.priority === 'urgent' || t.priority === 'high').length || 0
  
  const activeProjects = projects?.filter(p => p.status === 'active').length || 0
  
  const latestFitness = fitness?.[0]
  const vo2Max = latestFitness?.vo2_max || null
  
  const totalEarnings = finance?.reduce((sum, entry) => sum + (entry.total_nok || 0), 0) || 0

  return {
    projects: projects || [],
    tasks: tasks || [],
    activeTasks,
    completedTasks,
    highPriorityTasks,
    activeProjects,
    vo2Max,
    totalEarnings,
    researchCount: research?.length || 0,
    latestFitness
  }
}

export default async function MissionControl() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🎯 Mission Control</h1>
        <p className="text-muted-foreground mt-1">Overview of everything that matters</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Kanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeTasks}</div>
            <p className="text-xs text-muted-foreground">
              {data.highPriorityTasks} high priority • {data.completedTasks} done
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VO2 Max</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.vo2Max ? data.vo2Max : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.vo2Max ? 'Latest reading' : 'Connect Garmin to sync'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalEarnings.toLocaleString('no-NO')} kr
            </div>
            <p className="text-xs text-muted-foreground">
              {data.totalEarnings > 0 ? 'All time tracked' : 'No entries yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research Notes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.researchCount}</div>
            <p className="text-xs text-muted-foreground">
              {data.researchCount > 0 ? 'Notes stored' : 'No notes yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Complete Banner */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle2 className="h-5 w-5" />
            ✅ Observatory Online
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            Connected to Supabase with live data from {data.projects.length} projects and {data.tasks.length} tasks.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>🗂️ Projects</CardTitle>
            <CardDescription>Active project health scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.projects.slice(0, 5).map((project: Project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <span className="text-sm">{project.name}</span>
                  <div className="flex items-center gap-2">
                    {project.health_score !== null && (
                      <span className="text-xs text-muted-foreground">
                        {project.health_score}%
                      </span>
                    )}
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {data.projects.length === 0 && (
                <p className="text-sm text-muted-foreground">No projects found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Priority Tasks</CardTitle>
            <CardDescription>Top items from your kanban</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.tasks
                .filter((t: Task) => t.priority === 'urgent' || t.priority === 'high')
                .slice(0, 5)
                .map((task: Task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <span className="text-sm truncate max-w-[200px]">{task.title}</span>
                    <Badge 
                      variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              {data.tasks.filter((t: Task) => t.priority === 'urgent' || t.priority === 'high').length === 0 && (
                <p className="text-sm text-muted-foreground">No high priority tasks</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {data.latestFitness && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Latest Fitness Data
            </CardTitle>
            <CardDescription>Most recent metrics from {new Date(data.latestFitness.date).toLocaleDateString('no-NO')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.latestFitness.body_battery !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Body Battery</p>
                  <p className="text-lg font-semibold">{data.latestFitness.body_battery}</p>
                </div>
              )}
              {data.latestFitness.sleep_score !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Sleep Score</p>
                  <p className="text-lg font-semibold">{data.latestFitness.sleep_score}</p>
                </div>
              )}
              {data.latestFitness.steps !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Steps</p>
                  <p className="text-lg font-semibold">{data.latestFitness.steps.toLocaleString()}</p>
                </div>
              )}
              {data.latestFitness.resting_hr !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Resting HR</p>
                  <p className="text-lg font-semibold">{data.latestFitness.resting_hr} bpm</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
