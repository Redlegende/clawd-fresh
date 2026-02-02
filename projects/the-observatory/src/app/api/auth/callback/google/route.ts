import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL('/settings?error=oauth_denied', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?error=no_code', request.url));
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Get calendar list
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { data: calendarList } = await calendar.calendarList.list();

    // Store tokens in database
    const { error: dbError } = await supabase.from('orchestrator.calendars').upsert({
      user_id: 'b4004bf7-9b69-47e5-8032-c0f39c654a61', // Jakob's user ID
      provider: 'google',
      provider_account_id: userInfo.id,
      email: userInfo.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scopes: tokens.scope?.split(' ') || [],
      calendars: calendarList.items?.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary || false,
        selected: cal.selected || false,
      })),
      sync_enabled: true,
      last_sync_at: null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,provider'
    });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect(new URL('/settings?error=db_error', request.url));
    }

    // Trigger initial sync
    await syncCalendars(tokens.access_token!);

    return NextResponse.redirect(new URL('/settings?success=calendar_connected', request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/settings?error=oauth_failed', request.url));
  }
}

async function syncCalendars(accessToken: string) {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Get events from primary calendar for next 30 days
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const { data: events } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: thirtyDaysLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    // Store events in database
    for (const event of events.items || []) {
      await supabase.from('orchestrator.events').upsert({
        user_id: 'b4004bf7-9b69-47e5-8032-c0f39c654a61',
        calendar_id: event.organizer?.email || 'primary',
        external_event_id: event.id,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start_time: event.start?.dateTime || event.start?.date,
        end_time: event.end?.dateTime || event.end?.date,
        is_all_day: !event.start?.dateTime,
        recurrence: event.recurrence,
        status: event.status,
        html_link: event.htmlLink,
        created_at: event.created,
        updated_at: event.updated,
        sync_status: 'synced',
      }, {
        onConflict: 'external_event_id'
      });
    }

    // Update last_sync_at
    await supabase.from('orchestrator.calendars').update({
      last_sync_at: new Date().toISOString(),
    }).eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61').eq('provider', 'google');

  } catch (error) {
    console.error('Calendar sync error:', error);
  }
}
