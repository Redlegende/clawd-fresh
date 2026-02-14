import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/fitness/sync
 * Triggers a fitness data sync. In production this would call the Garmin API.
 * For now, it checks for the latest data in Supabase and reports sync status.
 * The actual Garmin fetch is done by the Python script (garmin-skill/daily_sync.py).
 */
export async function POST() {
  try {
    // Check latest fitness data
    const { data: latest, error } = await supabase
      .from('fitness_metrics')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    const lastSyncDate = latest?.date || null
    const daysSinceSync = lastSyncDate 
      ? Math.floor((Date.now() - new Date(lastSyncDate).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Create a notification for Fred to run the sync
    await supabase
      .from('fred_notifications')
      .insert({
        type: 'fitness_sync_requested',
        message: `🏋️ Manual fitness sync requested. Last data: ${lastSyncDate || 'never'}. Run garmin-skill/daily_sync.py to fetch latest data.`,
        read: false,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      ok: true,
      last_sync_date: lastSyncDate,
      days_since_sync: daysSinceSync,
      message: daysSinceSync !== null && daysSinceSync > 1
        ? `Last sync was ${daysSinceSync} days ago. Sync request sent to Fred.`
        : 'Sync request sent to Fred.',
      note: 'The Garmin sync runs via Python script. Fred will process this request.'
    })
  } catch (error) {
    console.error('[Fitness Sync] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data: latest } = await supabase
      .from('fitness_metrics')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
      .single()

    const { count } = await supabase
      .from('fitness_metrics')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      last_sync_date: latest?.date || null,
      total_days: count || 0,
      days_since_sync: latest?.date
        ? Math.floor((Date.now() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24))
        : null
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 })
  }
}
