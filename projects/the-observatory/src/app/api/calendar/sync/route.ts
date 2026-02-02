import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get calendar connection
    const { data: connection, error: connError } = await supabase
      .from('calendars')
      .select('*')
      .eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
      .eq('provider', 'google')
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'No calendar connected' },
        { status: 400 }
      );
    }

    // Setup OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
    });

    // Refresh token if needed
    const expiryDate = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
    if (Date.now() >= expiryDate - 5 * 60 * 1000) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      // Update tokens in database
      await supabase.from('calendars').update({
        access_token: credentials.access_token,
        expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('id', connection.id);
    }

    // Sync events
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const calendarsToSync = connection.calendars || [{ id: 'primary' }];
    let totalEvents = 0;

    for (const cal of calendarsToSync) {
      const { data: events } = await calendar.events.list({
        calendarId: cal.id,
        timeMin: now.toISOString(),
        timeMax: thirtyDaysLater.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      for (const event of events.items || []) {
        const { error: upsertError } = await supabase.from('events').upsert({
          user_id: 'b4004bf7-9b69-47e5-8032-c0f39c654a61',
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

        if (!upsertError) {
          totalEvents++;
        }
      }
    }

    // Update last_sync_at
    await supabase.from('calendars').update({
      last_sync_at: new Date().toISOString(),
    }).eq('id', connection.id);

    return NextResponse.json({
      success: true,
      events_synced: totalEvents,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
