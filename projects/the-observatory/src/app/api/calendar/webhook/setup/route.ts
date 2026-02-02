import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Setup Google Calendar push notifications (webhooks)
 * This creates a watch channel that expires after 7 days
 * Call this after OAuth connection or to renew an expired webhook
 * 
 * POST /api/calendar/webhook/setup
 */
export async function POST(request: NextRequest) {
  try {
    // Get calendar connection
    const { data: calendar, error: calError } = await supabase
      .from('calendars')
      .select('*')
      .eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
      .eq('provider', 'google')
      .single();

    if (calError || !calendar) {
      return NextResponse.json(
        { error: 'No calendar connected. Connect Google Calendar first.' },
        { status: 400 }
      );
    }

    // Setup OAuth
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

    // Determine webhook URL
    const webhookUrl = process.env.GOOGLE_WEBHOOK_URL || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://the-observatory-beta.vercel.app'}/api/webhooks/calendar`;

    // Generate unique channel ID
    const channelId = `observatory-${calendar.user_id}-${Date.now()}`;

    // Stop existing webhook if present
    if (calendar.webhook_channel_id && calendar.webhook_resource_id) {
      try {
        await googleCalendar.channels.stop({
          requestBody: {
            id: calendar.webhook_channel_id,
            resourceId: calendar.webhook_resource_id,
          },
        });
        console.log('Stopped existing webhook:', calendar.webhook_channel_id);
      } catch (e) {
        console.log('No existing webhook to stop or already expired');
      }
    }

    // Watch primary calendar
    const watchResponse = await googleCalendar.events.watch({
      calendarId: 'primary',
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        expiration: (Date.now() + 7 * 24 * 60 * 60 * 1000).toString(), // 7 days
      },
    });

    // Save webhook details
    const expirationDate = watchResponse.data.expiration 
      ? new Date(parseInt(watchResponse.data.expiration))
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await supabase.from('calendars').update({
      webhook_channel_id: watchResponse.data.id,
      webhook_resource_id: watchResponse.data.resourceId,
      webhook_expiration: expirationDate.toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', calendar.id);

    // Schedule automatic renewal (6 days from now)
    await scheduleWebhookRenewal(calendar.id, channelId, 6 * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      success: true,
      channel_id: watchResponse.data.id,
      resource_id: watchResponse.data.resourceId,
      expiration: expirationDate.toISOString(),
      webhook_url: webhookUrl,
      message: 'Webhook setup successful. Expires in 7 days.',
    });

  } catch (error) {
    console.error('Webhook setup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to setup webhook',
        details: (error as Error).message,
        hint: 'Make sure webhook URL is accessible from internet'
      },
      { status: 500 }
    );
  }
}

/**
 * Stop webhook notifications
 * DELETE /api/calendar/webhook/setup
 */
export async function DELETE(request: NextRequest) {
  try {
    const { data: calendar, error: calError } = await supabase
      .from('calendars')
      .select('*')
      .eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
      .eq('provider', 'google')
      .single();

    if (calError || !calendar || !calendar.webhook_channel_id) {
      return NextResponse.json({ error: 'No active webhook found' }, { status: 404 });
    }

    // Setup OAuth
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: calendar.access_token,
      refresh_token: calendar.refresh_token,
    });

    const googleCalendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await googleCalendar.channels.stop({
      requestBody: {
        id: calendar.webhook_channel_id,
        resourceId: calendar.webhook_resource_id,
      },
    });

    // Clear webhook details
    await supabase.from('calendars').update({
      webhook_channel_id: null,
      webhook_resource_id: null,
      webhook_expiration: null,
      updated_at: new Date().toISOString(),
    }).eq('id', calendar.id);

    return NextResponse.json({ success: true, message: 'Webhook stopped' });

  } catch (error) {
    console.error('Webhook stop error:', error);
    return NextResponse.json(
      { error: 'Failed to stop webhook', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Get webhook status
 * GET /api/calendar/webhook/setup
 */
export async function GET(request: NextRequest) {
  try {
    const { data: calendar, error: calError } = await supabase
      .from('calendars')
      .select('webhook_channel_id, webhook_expiration, sync_enabled, last_sync_at')
      .eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
      .eq('provider', 'google')
      .single();

    if (calError || !calendar) {
      return NextResponse.json({ connected: false, message: 'No calendar connected' });
    }

    const isWebhookActive = calendar.webhook_channel_id && 
      calendar.webhook_expiration && 
      new Date(calendar.webhook_expiration) > new Date();

    return NextResponse.json({
      connected: true,
      webhook_active: isWebhookActive,
      webhook_expires_at: calendar.webhook_expiration,
      sync_enabled: calendar.sync_enabled,
      last_sync_at: calendar.last_sync_at,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get webhook status', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Schedule webhook renewal via OpenClaw cron
async function scheduleWebhookRenewal(calendarId: string, channelId: string, delayMs: number) {
  try {
    // Calculate renewal time (6 days from now)
    const renewalDate = new Date(Date.now() + delayMs);
    
    // This would use OpenClaw's cron system to schedule a renewal job
    // For now, log it - the actual cron job can be set up separately
    console.log(`[CRON] Schedule webhook renewal for ${renewalDate.toISOString()}`);
    console.log(`[CRON] POST to /api/calendar/webhook/setup (calendarId: ${calendarId})`);
    
    // The user can set this up via:
    // openclaw cron add --name="webhook-renewal" --schedule="0 0 */6 * *" --url="/api/calendar/webhook/setup"
    
  } catch (error) {
    console.error('Failed to schedule renewal:', error);
  }
}
