import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY! // Service role for webhook

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Webhook secret for HMAC verification
const WEBHOOK_SECRET = process.env.TASK_WEBHOOK_SECRET || 'dev-secret'

interface TaskWebhookPayload {
  event: 'task.created' | 'task.updated' | 'task.completed' | 'task.deleted' | 'task.rescheduled'
  timestamp: string
  task: {
    id: string
    title: string
    description?: string
    status: string
    previous_status?: string
    priority: string
    project_id?: string
    due_date?: string
    completed_by?: string
    completed_at?: string
    updated_by?: string
  }
}

/**
 * POST /api/webhooks/tasks
 * Receives task events from Kanban UI and notifies Fred
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (basic HMAC)
    const signature = request.headers.get('x-webhook-signature')
    const body = await request.text()
    
    // TODO: Implement proper HMAC verification in production
    // const expectedSig = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
    // if (signature !== expectedSig) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    
    const payload: TaskWebhookPayload = JSON.parse(body)
    
    console.log(`[Webhook] Received ${payload.event}:`, payload.task.title)
    
    // Handle different event types
    switch (payload.event) {
      case 'task.completed':
        await handleTaskCompleted(payload)
        break
      case 'task.created':
        await handleTaskCreated(payload)
        break
      case 'task.updated':
        await handleTaskUpdated(payload)
        break
      case 'task.rescheduled':
        await handleTaskRescheduled(payload)
        break
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: `Processed ${payload.event}` 
    })
    
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' }, 
      { status: 500 }
    )
  }
}

async function handleTaskCompleted(payload: TaskWebhookPayload) {
  const { task } = payload
  
  // Log the completion
  await supabase.from('task_sync_log').insert({
    event_type: 'completed',
    task_id: task.id,
    task_title: task.title,
    completed_by: task.completed_by || 'unknown',
    synced_at: new Date().toISOString()
  })
  
  // Notify Fred via Telegram (via internal API call)
  await notifyFred({
    type: 'task_completed',
    message: `✅ Task completed: "${task.title}"`,
    task: task
  })
  
  console.log(`[Sync] Task marked done: ${task.title}`)
}

async function handleTaskCreated(payload: TaskWebhookPayload) {
  const { task } = payload
  
  // Only notify for urgent/high priority
  if (task.priority === 'urgent' || task.priority === 'high') {
    await notifyFred({
      type: 'task_created',
      message: `🆕 New ${task.priority} priority task: "${task.title}"`,
      task: task
    })
  }
  
  console.log(`[Sync] Task created: ${task.title}`)
}

async function handleTaskUpdated(payload: TaskWebhookPayload) {
  const { task } = payload
  
  // Only notify for significant changes (status, priority, due_date)
  if (task.previous_status && task.previous_status !== task.status) {
    await notifyFred({
      type: 'task_updated',
      message: `🔄 Task moved: "${task.title}" → ${task.status}`,
      task: task
    })
  }
}

async function handleTaskRescheduled(payload: TaskWebhookPayload) {
  const { task } = payload
  
  await notifyFred({
    type: 'task_rescheduled',
    message: `📅 Task rescheduled: "${task.title}" to ${task.due_date}`,
    task: task
  })
}

/**
 * Send notification to Fred (via Telegram or internal queue)
 */
async function notifyFred(notification: {
  type: string
  message: string
  task: any
}) {
  // Store in notification queue for Fred to pick up
  await supabase.from('fred_notifications').insert({
    type: notification.type,
    message: notification.message,
    task_id: notification.task.id,
    task_title: notification.task.title,
    read: false,
    created_at: new Date().toISOString()
  })
  
  // In production, this would also send to Telegram webhook
  console.log(`[Notify Fred] ${notification.message}`)
}

/**
 * GET /api/webhooks/tasks
 * For Fred to check pending notifications
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    
    let query = supabase
      .from('fred_notifications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (unreadOnly) {
      query = query.eq('read', false)
    }
    
    const { data: notifications, error } = await query.limit(50)
    
    if (error) throw error
    
    return NextResponse.json({ notifications })
    
  } catch (error) {
    console.error('[API] Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' }, 
      { status: 500 }
    )
  }
}
