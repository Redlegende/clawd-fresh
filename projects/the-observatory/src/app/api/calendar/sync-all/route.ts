import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Periodic sync cron job
 * Runs every 15 minutes as backup to webhooks
 * Also useful for initial import or when webhooks expire
 * 
 * Can be triggered:
 * - Via cron: POST /api/calendar/sync-all
 * - Manually: Click "Sync Now" in settings
 */

export async function POST(request: NextRequest) {
  try {
    // Check if this is a cron request or manual request
    const authHeader = request.headers.get('authorization');
    const isCronJob = authHeader?.includes('Bearer') || request.headers.get('x-cron-secret');
    
    if (!isCronJob) {
      // Manual sync - return immediately
      console.log('Manual sync triggered');
    }

    // Get all connected Google calendars
    const { data: calendars, error: calError } = await supabase
      .from('calendars')
      .select('*')
      .eq('provider', 'google')
      .eq('sync_enabled', true);

    if (calError) {
      throw new Error(`Failed to fetch calendars: ${calError.message}`);
    }

    if (!calendars || calendars.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No calendars to sync',
        synced: 0 
      });
    }

    const results: Array<{
      calendar_id: string;
      email: string;
      success: boolean;
      events_synced?: number;
      errors?: string[];
      timestamp?: string;
      error?: string;
    }> = [];

    for (const calendar of calendars) {
      try {
        const result = await syncCalendar(calendar);
        results.push({
          calendar_id: calendar.id,
          email: calendar.email,
          success: result.success,
          events_synced: result.events_synced,
          errors: result.errors,
          timestamp: result.timestamp,
        });
      } catch (error) {
        console.error(`Failed to sync calendar ${calendar.id}:`, error);
        results.push({
          calendar_id: calendar.id,
          email: calendar.email,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalEvents = results.reduce((sum, r) => sum + (r.events_synced || 0), 0);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      calendars_processed: calendars.length,
      calendars_successful: successCount,
      total_events_synced: totalEvents,
      results
    });

  } catch (error) {
    console.error('Sync all error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Sync failed', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

async function syncCalendar(calendar: any) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: calendar.access_token,
    refresh_token: calendar.refresh_token,
  });

  // Refresh token if needed
  const expiryDate = calendar.expires_at ? new Date(calendar.expires_at).getTime() : 0;
  let accessToken = calendar.access_token;

  if (Date.now() >= expiryDate - 5 * 60 * 1000) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    accessToken = credentials.access_token!;

    await supabase.from('calendars').update({
      access_token: credentials.access_token,
      expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
    }).eq('id', calendar.id);
  }

  const googleCalendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Sync window: past 7 days to future 60 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sixtyDaysLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const calendarsToSync = calendar.calendars || [{ id: 'primary' }];
  let totalEvents = 0;
  let errors: string[] = [];

  for (const cal of calendarsToSync) {
    try {
      const params: any = {
        calendarId: cal.id,
        timeMin: sevenDaysAgo.toISOString(),
        timeMax: sixtyDaysLater.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500, // Google Calendar API limit
      };

      // Use sync token for delta sync if available
      if (calendar.sync_token) {
        params.syncToken = calendar.sync_token;
      }

      let pageToken: string | undefined;
      let pageCount = 0;
      let newSyncToken: string | undefined;

      do {
        if (pageToken) {
          params.pageToken = pageToken;
        }

        const { data: events, data: { nextPageToken, nextSyncToken } } = 
          await googleCalendar.events.list(params);

        pageToken = nextPageToken || undefined;
        if (nextSyncToken) {
          newSyncToken = nextSyncToken;
        }
        pageCount++;

        for (const event of events.items || []) {
          // Map Google Calendar fields to our schema
          const eventData = {
            calendar_id: calendar.id, // Link to our calendars table
            user_id: calendar.user_id,
            external_id: event.id,
            title: event.summary || 'Untitled',
            description: event.description,
            location: event.location,
            starts_at: event.start?.dateTime || event.start?.date,
            ends_at: event.end?.dateTime || event.end?.date,
            timezone: event.start?.timeZone || 'Europe/Oslo',
            is_all_day: !event.start?.dateTime,
            recurrence_rule: event.recurrence?.[0],
            ical_uid: event.iCalUID,
            etag: event.etag,
            status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
            sync_status: 'synced',
            updated_at: new Date().toISOString(),
          };

          if (event.status === 'cancelled') {
            // Soft delete cancelled events
            await supabase
              .from('events')
              .update({ 
                status: 'cancelled',
                deleted_at: new Date().toISOString(),
                sync_status: 'synced'
              })
              .eq('external_id', event.id)
              .eq('calendar_id', calendar.id);
          } else {
            // Upsert event
            const { error: upsertError } = await supabase
              .from('events')
              .upsert(eventData, {
                onConflict: 'calendar_id,external_id'
              });

            if (upsertError) {
              errors.push(`Event ${event.id}: ${upsertError.message}`);
            } else {
              totalEvents++;
            }
          }
        }

        // Prevent infinite loops
        if (pageCount > 10) break;

      } while (pageToken);

      // Save sync token for next delta sync
      if (newSyncToken) {
        await supabase
          .from('calendars')
          .update({ sync_token: newSyncToken })
          .eq('id', calendar.id);
      }

    } catch (error: any) {
      // Sync token expired, will do full sync next time
      if (error.code === 410) {
        await supabase
          .from('calendars')
          .update({ sync_token: null })
          .eq('id', calendar.id);
        errors.push(`Sync token expired for calendar ${cal.id}`);
      } else {
        errors.push(`Calendar ${cal.id}: ${error.message}`);
      }
    }
  }

  // Update last sync time
  await supabase.from('calendars').update({
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', calendar.id);

  return {
    success: true,
    events_synced: totalEvents,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * GET endpoint for quick status check
 */
export async function GET(request: NextRequest) {
  try {
    const { data: calendars, error } = await supabase
      .from('calendars')
      .select('id, email, last_synced_at, sync_enabled, provider')
      .eq('provider', 'google');

    if (error) throw error;

    return NextResponse.json({
      calendars: calendars || [],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get sync status', details: (error as Error).message },
      { status: 500 }
    );
  }
}
