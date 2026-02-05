'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Trash2, User, Bot, ArrowLeft, ArrowRight, AlertCircle, Calendar } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Comment {
  id: string
  task_id: string
  author: 'jakob' | 'fred'
  content: string
  is_internal_note: boolean
  created_at: string
}

interface Task {
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

interface TaskDetailModalProps {
  task: Task | null
  projectName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: (task: Task) => void
}

const STATUS_FLOW: Task['status'][] = ['backlog', 'todo', 'in_progress', 'review', 'done']

const STATUS_LABELS: Record<Task['status'], string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done'
}

export function TaskDetailModal({ 
  task, 
  projectName,
  open, 
  onOpenChange,
  onTaskUpdated 
}: TaskDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Fetch comments when task changes
  useEffect(() => {
    if (task && open) {
      fetchComments()
    }
  }, [task, open])

  const fetchComments = async () => {
    if (!task) return
    setLoading(true)
    
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`)
      const data = await response.json()
      
      if (response.ok) {
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const addComment = async () => {
    if (!task || !newComment.trim()) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          author: 'jakob'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [data.comment, ...prev])
        setNewComment('')
        
        // Update task comment count
        if (onTaskUpdated && task) {
          onTaskUpdated({
            ...task,
            comment_count: (task.comment_count || 0) + 1
          })
        }
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!task) return
    
    try {
      const response = await fetch(
        `/api/tasks/${task.id}/comments?comment_id=${commentId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
        
        if (onTaskUpdated && task) {
          onTaskUpdated({
            ...task,
            comment_count: Math.max(0, (task.comment_count || 0) - 1)
          })
        }
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const updatePriority = async (newPriority: Task['priority']) => {
    if (!task || updating) return
    
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ priority: newPriority, updated_at: new Date().toISOString() })
        .eq('id', task.id)

      if (error) throw error

      if (onTaskUpdated) {
        onTaskUpdated({ ...task, priority: newPriority })
      }
    } catch (error) {
      console.error('Failed to update priority:', error)
    } finally {
      setUpdating(false)
    }
  }

  const moveStatus = async (direction: 'prev' | 'next') => {
    if (!task || updating) return
    
    const currentIndex = STATUS_FLOW.indexOf(task.status)
    const newIndex = direction === 'next' 
      ? Math.min(currentIndex + 1, STATUS_FLOW.length - 1)
      : Math.max(currentIndex - 1, 0)
    
    if (newIndex === currentIndex) return
    
    const newStatus = STATUS_FLOW[newIndex]
    
    setUpdating(true)
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      if (newStatus === 'done') {
        updateData.completed_at = new Date().toISOString()
      } else if (task.status === 'done') {
        updateData.completed_at = null
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id)

      if (error) throw error

      if (onTaskUpdated) {
        onTaskUpdated({ ...task, status: newStatus })
      }

      // Send webhook
      await fetch('/api/webhooks/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: newStatus === 'done' ? 'task.completed' : 'task.updated',
          timestamp: new Date().toISOString(),
          task: {
            id: task.id,
            title: task.title,
            status: newStatus,
            previous_status: task.status
          }
        })
      })

    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const updateDueDate = async (newDueDate: string) => {
    if (!task || updating) return
    
    setUpdating(true)
    try {
      const dueDateValue = newDueDate || null
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          due_date: dueDateValue, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', task.id)

      if (error) throw error

      if (onTaskUpdated) {
        onTaskUpdated({ ...task, due_date: dueDateValue || undefined })
      }
    } catch (error) {
      console.error('Failed to update due date:', error)
    } finally {
      setUpdating(false)
    }
  }

  const clearDueDate = async () => {
    await updateDueDate('')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('no-NO')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      default: return 'bg-green-500/20 text-green-400 border-green-500/50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500/20 text-green-400'
      case 'in_progress': return 'bg-orange-500/20 text-orange-400'
      case 'review': return 'bg-purple-500/20 text-purple-400'
      case 'todo': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (!task) return null

  const currentStatusIndex = STATUS_FLOW.indexOf(task.status)
  const canMovePrev = currentStatusIndex > 0
  const canMoveNext = currentStatusIndex < STATUS_FLOW.length - 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogDescription className="sr-only">
            Task details and comments for {task.title}
          </DialogDescription>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold mb-2">
                {task.title}
              </DialogTitle>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Priority Selector */}
                <Select
                  value={task.priority}
                  onValueChange={(v) => updatePriority(v as Task['priority'])}
                  disabled={updating}
                >
                  <SelectTrigger className={`w-[120px] h-7 text-xs ${getPriorityColor(task.priority)}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>

                <Badge className={getStatusColor(task.status)}>
                  {STATUS_LABELS[task.status]}
                </Badge>
                
                {projectName && (
                  <Badge variant="outline">{projectName}</Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">{comments.length}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Status Navigation */}
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={() => moveStatus('prev')}
            disabled={!canMovePrev || updating}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {canMovePrev ? STATUS_LABELS[STATUS_FLOW[currentStatusIndex - 1]] : 'Start'}
          </Button>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {STATUS_FLOW.map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${
                  i === currentStatusIndex 
                    ? 'bg-cyan-400' 
                    : i < currentStatusIndex 
                      ? 'bg-green-400' 
                      : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => moveStatus('next')}
            disabled={!canMoveNext || updating}
          >
            {canMoveNext ? STATUS_LABELS[STATUS_FLOW[currentStatusIndex + 1]] : 'Done'}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Task Description */}
        {task.description && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {task.description}
          </div>
        )}

        {/* Due Date Editor */}
        <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <label className="text-sm text-muted-foreground block mb-1">Due Date</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={task.due_date || ''}
                onChange={(e) => updateDueDate(e.target.value)}
                disabled={updating}
                className="w-auto h-8 text-sm"
              />
              {task.due_date && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDueDate}
                  disabled={updating}
                  className="h-8 px-2 text-muted-foreground hover:text-red-400"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          {task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done' && (
            <div className="flex items-center gap-1 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              Overdue
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="flex-1 min-h-0 flex flex-col">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments & Context
          </h4>

          <div className="flex-1 max-h-[300px] overflow-y-auto pr-4">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Loading comments...
              </p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Add context or updates below.
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div 
                    key={comment.id}
                    className={`p-3 rounded-lg ${
                      comment.author === 'fred' 
                        ? 'bg-purple-500/10 border border-purple-500/20' 
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {comment.author === 'fred' ? (
                          <Bot className="h-4 w-4 text-purple-400" />
                        ) : (
                          <User className="h-4 w-4 text-cyan-400" />
                        )}
                        <span className={`text-sm font-medium ${
                          comment.author === 'fred' ? 'text-purple-400' : 'text-cyan-400'
                        }`}>
                          {comment.author === 'fred' ? 'Fred' : 'Jakob'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      
                      {comment.author === 'jakob' && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Comment */}
          <div className="mt-4 flex gap-2">
            <Textarea
              placeholder="Add context or notes (e.g., 'Waiting for Henrik's reply')..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  addComment()
                }
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">
              Cmd+Enter to send
            </span>
            <Button 
              onClick={addComment} 
              disabled={!newComment.trim() || saving}
              size="sm"
            >
              {saving ? 'Sending...' : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Add Comment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
