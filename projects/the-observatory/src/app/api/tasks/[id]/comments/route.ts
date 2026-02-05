import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/tasks/[id]/comments
 * Get all comments for a specific task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params

    // Verify task exists
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Get comments
    const { data: comments, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      task_id: taskId,
      task_title: task.title,
      comments: comments || [],
      count: comments?.length || 0
    })

  } catch (error) {
    console.error('[API] Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks/[id]/comments
 * Add a new comment to a task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()
    const { content, author = 'jakob', is_internal_note = false } = body

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Validate author
    if (!['jakob', 'fred'].includes(author)) {
      return NextResponse.json(
        { error: 'Author must be jakob or fred' },
        { status: 400 }
      )
    }

    // Verify task exists
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, status')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Insert comment
    const { data: comment, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        author,
        content: content.trim(),
        is_internal_note,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Notify the other party
    const notifyAuthor = author === 'jakob' ? 'fred' : 'jakob'
    await supabase.from('fred_notifications').insert({
      type: 'task_comment',
      message: `💬 New comment on "${task.title}" from ${author}`,
      task_id: taskId,
      task_title: task.title,
      comment_id: comment.id,
      read: false,
      created_at: new Date().toISOString()
    })

    console.log(`[Comments] ${author} commented on task: ${task.title}`)

    return NextResponse.json({
      ok: true,
      comment,
      message: 'Comment added successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('[API] Error adding comment:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]/comments?comment_id=xxx
 * Delete a comment (only by the author)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('comment_id')

    if (!commentId) {
      return NextResponse.json(
        { error: 'comment_id is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId)
      .eq('task_id', taskId)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      message: 'Comment deleted'
    })

  } catch (error) {
    console.error('[API] Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
