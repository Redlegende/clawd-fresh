import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Send, Trash2, User, Bot } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold mb-2">
                {task.title}
              </DialogTitle>
              
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace('_', ' ')}
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

        {/* Task Description */}
        {task.description && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {task.description}
          </div>
        )}

        {/* Due Date */}
        {task.due_date && (
          <div className="text-sm">
            <span className="text-muted-foreground">Due: </span>
            <span className={new Date(task.due_date) < new Date() ? 'text-red-400' : ''}>
              {new Date(task.due_date).toLocaleDateString('no-NO')}
            </span>
          </div>
        )}

        {/* Comments Section */}
        <div className="flex-1 min-h-0 flex flex-col">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments & Context
          </h4>

          <ScrollArea className="flex-1 max-h-[300px] pr-4">
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
          </ScrollArea>

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
