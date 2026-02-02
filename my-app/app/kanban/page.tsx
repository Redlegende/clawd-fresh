'use client'

import { useState, useEffect } from 'react'
import { Plus, MoreHorizontal, Calendar, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  project: string
  tags: string[]
  due_date?: string
}

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-800' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-amber-950/30' },
  { id: 'review', title: 'Review', color: 'bg-blue-950/30' },
  { id: 'done', title: 'Done', color: 'bg-emerald-950/30' },
]

const priorityColors = {
  low: 'border-slate-500/30 text-slate-400',
  medium: 'border-amber-500/30 text-amber-400',
  high: 'border-red-500/30 text-red-400',
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    try {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return

    const newTask: Partial<Task> = {
      title: newTaskTitle,
      description: '',
      status: 'todo',
      priority: 'medium',
      project: 'General',
      tags: [],
    }

    try {
      const { data } = await supabase.from('tasks').insert([newTask]).select()
      if (data) {
        setTasks([...tasks, data[0]])
        setNewTaskTitle('')
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  async function moveTask(taskId: string, newStatus: string) {
    try {
      await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t))
    } catch (error) {
      console.error('Error moving task:', error)
    }
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Kanban Board</h1>
          <p className="text-slate-400">Organize and track your tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="New task..."
              className="bg-transparent px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none w-64"
            />
            <Button 
              size="sm" 
              onClick={addTask}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 grid grid-cols-4 gap-6 overflow-hidden">
        {columns.map((column) => {
          const columnTasks = tasks.filter(t => t.status === column.id)
          
          return (
            <div key={column.id} className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-slate-200">{column.title}</h2>
                  <Badge variant="outline" className="border-slate-700 text-slate-400">
                    {columnTasks.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              <div className={`flex-1 ${column.color} rounded-xl p-3 overflow-y-auto space-y-3`}>
                {loading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-slate-800 rounded-lg animate-pulse" />
                    ))}
                  </>
                ) : (
                  columnTasks.map((task) => (
                    <Card 
                      key={task.id} 
                      className="bg-slate-950 border-slate-800 hover:border-slate-700 cursor-pointer group"
                      draggable
                      onDragEnd={() => {
                        const nextColumn = columns[columns.findIndex(c => c.id === column.id) + 1]
                        if (nextColumn) moveTask(task.id, nextColumn.id)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-medium text-slate-200 line-clamp-2">{task.title}</h3>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${priorityColors[task.priority]}`}
                            >
                              {task.priority}
                            </Badge>
                            {task.project && (
                              <span className="text-xs text-slate-500">{task.project}</span>
                            )}
                          </div>
                          
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>

                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-3 flex-wrap">
                            {task.tags.map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs border-slate-700 text-slate-400"
                              >
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}

                {/* Drop Zone */}
                <div className="h-20 border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-sm hover:border-slate-700 hover:text-slate-500 transition-colors">
                  Drop here
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
