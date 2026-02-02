import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Google Calendar Webhook Handler
 * Receives push notifications when calendar events change
 * 
 * Setup: Requires Google Calendar API watch() to be called initially
 * Expires after 7 days and needs renewal
 */

// Google sends a sync token to verify the webhook
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Google verification challenge
  const challenge = searchParams.get('hub.challenge');
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: 'ok' });
}

// Handle actual push notifications
export async function POST(request: NextRequest) {
  try {
    // Google sends headers with sync info
    const channelId = request.headers.get('X-Goog-Channel-ID');
    const resourceId = request.headers.get('X-Goog-Resource-ID');
    const resourceState = request.headers.get('X-Goog-Resource-State'); // 'sync', 'exists', 'not_exists'
    const resourceUri = request.headers.get('X-Goog-Resource-URI');

    console.log('Calendar webhook received:', {
      channelId,
      resourceId,
      resourceState,
      resourceUri,
    });

    // Find the calendar connection by channel ID
    const { data: calendar, error: calError } = await supabase
      .from('calendars')
      .select('*')
      .eq('webhook_channel_id', channelId)
      .single();

    if (calError || !calendar) {
      console.error('Calendar not found for webhook:', channelId);
      return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
    }

    // Skip sync messages (initial setup confirmation)
    if (resourceState === 'sync') {
      return NextResponse.json({ status: 'acknowledged' });
    }

    // Resource was deleted
    if (resourceState === 'not_exists') {
      // Handle deletion if needed
      return NextResponse.json({ status: 'acknowledged' });
    }

    // Sync the calendar
    await syncCalendarEvents(calendar);

    // Update sync timestamp
    await supabase
      .from('calendars')
      .update({ 
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', calendar.id);

    return NextResponse.json({ 
      status: 'synced',
      calendar_id: calendar.id
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function syncCalendarEvents(calendar: any) {
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
  if (Date.now() >= expiryDate - 5 * 60 * 1000) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    await supabase.from('calendars').update({
      access_token: credentials.access_token,
      expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
    }).eq('id', calendar.id);
  }

  const googleCalendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Sync next 30 days
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const calendarsToSync = calendar.calendars || [{ id: 'primary' }];

  for (const cal of calendarsToSync) {
    // Get events that changed since last sync
    const params: any = {
      calendarId: cal.id,
      timeMin: now.toISOString(),
      timeMax: thirtyDaysLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    };

    // Use sync token if available for delta sync
    if (calendar.sync_token) {
      params.syncToken = calendar.sync_token;
    }

    try {
      const { data: events, data: { nextSyncToken } } = await googleCalendar.events.list(params);

      for (const event of events.items || []) {
        if (event.status === 'cancelled') {
          // Delete cancelled events
          await supabase
            .from('events')
            .delete()
            .eq('external_event_id', event.id);
        } else {
          // Upsert event
          await supabase.from('events').upsert({
            user_id: calendar.user_id,
            calendar_id: cal.id,
            external_event_id: event.id,
            summary: event.summary || 'Untitled',
            description: event.description,
            location: event.location,
            start_time: event.start?.dateTime || event.start?.date,
            end_time: event.end?.dateTime || event.end?.date,
            is_all_day: !event.start?.dateTime,
            recurrence: event.recurrence,
            status: event.status,
            html_link: event.htmlLink,
            created_at: event.created,
            updated_at: new Date().toISOString(),
            sync_status: 'synced',
          }, {
            onConflict: 'external_event_id'
          });
        }
      }

      // Save sync token for next delta sync
      if (nextSyncToken) {
        await supabase
          .from('calendars')
          .update({ sync_token: nextSyncToken })
          .eq('id', calendar.id);
      }

    } catch (error: any) {
      // Sync token expired, do full sync
      if (error.code === 410) {
        console.log('Sync token expired, performing full sync');
        await supabase
          .from('calendars')
          .update({ sync_token: null })
          .eq('id', calendar.id);
        
        // Retry without sync token
        const { data: events } = await googleCalendar.events.list({
          calendarId: cal.id,
          timeMin: now.toISOString(),
          timeMax: thirtyDaysLater.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        });

        for (const event of events.items || []) {
          await supabase.from('events').upsert({
            user_id: calendar.user_id,
            calendar_id: cal.id,
            external_event_id: event.id,
            summary: event.summary || 'Untitled',
            description: event.description,
            location: event.location,
            start_time: event.start?.dateTime || event.start?.date,
            end_time: event.end?.dateTime || event.end?.date,
            is_all_day: !event.start?.dateTime,
            recurrence: event.recurrence,
            status: event.status,
            html_link: event.htmlLink,
            created_at: event.created,
            updated_at: new Date().toISOString(),
            sync_status: 'synced',
          }, {
            onConflict: 'external_event_id'
          });
        }
      } else {
        throw error;
      }
    }
  }
}
