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

    // Find primary calendar
    const primaryCal = calendarList.items?.find(c => c.primary) || calendarList.items?.[0];

    // Store in database using correct schema columns
    const { error: dbError } = await supabase
      .from('calendars')
      .upsert({
        user_id: 'b4004bf7-9b69-47e5-8032-c0f39c654a61',
        provider: 'google',
        external_id: primaryCal?.id,
        name: primaryCal?.summary || 'Google Calendar',
        email: userInfo.email,
        color: primaryCal?.backgroundColor || '#4285F4',
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
        is_primary: true,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider,external_id'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect(new URL('/settings?error=db_error', request.url));
    }

    // Trigger initial sync
    await syncInitialEvents(tokens.access_token!, userInfo.id!);

    // Setup webhook for real-time sync
    try {
      await setupWebhook(userInfo.id!);
    } catch (webhookError) {
      console.error('Webhook setup failed (non-blocking):', webhookError);
      // Continue - webhook can be set up manually later
    }

    return NextResponse.redirect(new URL('/settings?success=calendar_connected', request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/settings?error=oauth_failed', request.url));
  }
}

async function syncInitialEvents(accessToken: string, userId: string) {
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

    // Get the calendar ID we just created
    const { data: calData } = await supabase
      .from('calendars')
      .select('id')
      .eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
      .eq('provider', 'google')
      .single();

    if (!calData) {
      console.error('Calendar not found after creation');
      return;
    }

    // Store events using correct schema
    for (const event of events.items || []) {
      await supabase.from('events').upsert({
        calendar_id: calData.id,
        user_id: 'b4004bf7-9b69-47e5-8032-c0f39c654a61',
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
      }, {
        onConflict: 'calendar_id,external_id'
      });
    }

    // Update last sync time
    await supabase.from('calendars').update({
      last_synced_at: new Date().toISOString(),
    }).eq('id', calData.id);

    console.log(`Initial sync complete: ${events.items?.length || 0} events`);

  } catch (error) {
    console.error('Initial sync error:', error);
  }
}

async function setupWebhook(userId: string) {
  // Call the webhook setup API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/calendar/webhook/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Webhook setup failed');
  }

  const result = await response.json();
  console.log('Webhook setup result:', result);
}
