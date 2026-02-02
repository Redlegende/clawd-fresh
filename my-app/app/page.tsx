'use client'

import { useState, useEffect } from 'react'
import { 
  Target, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  TrendingUp,
  AlertCircle,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  project: string
}

interface ResearchNote {
  id: string
  title: string
  topic: string
  created_at: string
}

export default function MissionControl() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [research, setResearch] = useState<ResearchNote[]>([])
  const [loading, setLoading] = useState(true)
  const [todayFocus, setTodayFocus] = useState("Define today's primary objective...")

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Fetch tasks
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['todo', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(5)

      if (taskData) setTasks(taskData)

      // Fetch recent research
      const { data: researchData } = await supabase
        .from('research_notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)

      if (researchData) setResearch(researchData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeTasks = tasks.filter(t => t.status === 'in_progress').length
  const pendingTasks = tasks.filter(t => t.status === 'todo').length

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Mission Control</h1>
            <p className="text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Focus */}
      <Card className="mb-8 bg-gradient-to-r from-cyan-950/50 to-blue-950/50 border-cyan-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-lg text-cyan-100">Today's Focus</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            value={todayFocus}
            onChange={(e) => setTodayFocus(e.target.value)}
            className="w-full bg-transparent text-xl font-medium text-slate-200 placeholder:text-slate-500 border-none outline-none"
            placeholder="What is your main focus for today?"
          />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Tasks</p>
                <p className="text-3xl font-bold text-slate-100">{activeTasks}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pending</p>
                <p className="text-3xl font-bold text-slate-100">{pendingTasks}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Research Notes</p>
                <p className="text-3xl font-bold text-slate-100">{research.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Streak</p>
                <p className="text-3xl font-bold text-slate-100">12 days</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              <CardTitle className="text-lg text-slate-100">Recent Tasks</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-800 rounded animate-pulse" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No active tasks</p>
                <Button variant="outline" className="mt-4 border-slate-700 text-slate-300">
                  Create Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'in_progress' ? 'bg-amber-500' : 'bg-slate-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.project}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        task.priority === 'high' ? 'border-red-500/30 text-red-400' :
                        task.priority === 'medium' ? 'border-amber-500/30 text-amber-400' :
                        'border-slate-500/30 text-slate-400'
                      }`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Research */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-lg text-slate-100">Latest Research</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
              Browse
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-800 rounded animate-pulse" />
                ))}
              </div>
            ) : research.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No research notes yet</p>
                <Button variant="outline" className="mt-4 border-slate-700 text-slate-300">
                  Add Note
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {research.map((note) => (
                  <div 
                    key={note.id}
                    className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 line-clamp-2">{note.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                            {note.topic}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
