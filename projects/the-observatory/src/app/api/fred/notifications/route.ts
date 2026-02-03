import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/fred/notifications
 * For Fred to check his unread notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Get unread notifications for Fred
    const { data: notifications, error } = await supabase
      .from('fred_notifications')
      .select('*')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('Error fetching notifications:', error)
      // Return empty if table doesn't exist yet
      return NextResponse.json({
        notifications: [],
        recent_completed: [],
        unread_count: 0,
        timestamp: new Date().toISOString()
      })
    }
    
    // Get count of recent completed tasks (last 24h)
    const { data: recentCompleted, error: recentError } = await supabase
      .from('recently_completed')
      .select('id, title, project_name, completed_at, completed_by')
      .limit(20)
    
    if (recentError) throw recentError
    
    return NextResponse.json({
      notifications: notifications || [],
      recent_completed: recentCompleted || [],
      unread_count: notifications?.length || 0,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[Fred API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/fred/notifications/:id/read
 * Mark a notification as read
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'mark_read') {
      const { notification_id } = await request.json()
      
      const { error } = await supabase
        .from('fred_notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
          acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', notification_id)
      
      if (error) throw error
      
      return NextResponse.json({ ok: true, message: 'Marked as read' })
    }
    
    if (action === 'mark_all_read') {
      const { error } = await supabase
        .from('fred_notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('read', false)
      
      if (error) throw error
      
      return NextResponse.json({ ok: true, message: 'All marked as read' })
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    
  } catch (error) {
    console.error('[Fred API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
