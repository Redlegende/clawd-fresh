import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function getGoogleCalendar() {
  const { data: calendar, error: calError } = await supabase
    .from('calendars')
    .select('*')
    .eq('user_id', 'b4004bf7-9b69-47e5-8032-c0f39c654a61')
    .eq('provider', 'google')
    .single();

  if (calError || !calendar) {
    throw new Error('No Google Calendar connected');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: calendar.access_token,
    refresh_token: calendar.refresh_token,
  });

  const expiryDate = calendar.expires_at ? new Date(calendar.expires_at).getTime() : 0;
  if (Date.now() >= expiryDate - 5 * 60 * 1000) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    await supabase.from('calendars').update({
      access_token: credentials.access_token,
      expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
    }).eq('id', calendar.id);
  }

  return {
    gcal: google.calendar({ version: 'v3', auth: oauth2Client }),
    calendar,
  };
}

/**
 * POST /api/calendar/events — Create event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, location, starts_at, ends_at, is_all_day, timezone } = body;

    if (!title || !starts_at) {
      return NextResponse.json({ error: 'title and starts_at are required' }, { status: 400 });
    }

    const { gcal: googleCalendar, calendar } = await getGoogleCalendar();
    const tz = timezone || 'Europe/Oslo';

    // Build Google Calendar event
    const eventBody: any = {
      summary: title,
      description: description || undefined,
      location: location || undefined,
    };

    if (is_all_day) {
      // All-day events use date format (YYYY-MM-DD)
      const startDate = starts_at.split('T')[0];
      const endDate = ends_at ? ends_at.split('T')[0] : startDate;
      eventBody.start = { date: startDate };
      // Google requires end date to be exclusive (day after)
      const endObj = new Date(endDate);
      endObj.setDate(endObj.getDate() + 1);
      eventBody.end = { date: endObj.toISOString().split('T')[0] };
    } else {
      eventBody.start = { dateTime: starts_at, timeZone: tz };
      eventBody.end = { 
        dateTime: ends_at || new Date(new Date(starts_at).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: tz 
      };
    }

    // Create in Google Calendar
    const { data: googleEvent } = await googleCalendar.events.insert({
      calendarId: 'primary',
      requestBody: eventBody,
    });

    // Store in Supabase events table
    const { data: dbEvent, error: dbError } = await supabase
      .from('events')
      .upsert({
        calendar_id: calendar.id,
        user_id: calendar.user_id,
        external_id: googleEvent.id,
        title,
        description: description || null,
        location: location || null,
        starts_at: is_all_day ? starts_at.split('T')[0] : starts_at,
        ends_at: is_all_day 
          ? (ends_at ? ends_at.split('T')[0] : starts_at.split('T')[0])
          : (ends_at || new Date(new Date(starts_at).getTime() + 60 * 60 * 1000).toISOString()),
        timezone: tz,
        is_all_day: is_all_day || false,
        ical_uid: googleEvent.iCalUID,
        etag: googleEvent.etag,
        status: 'confirmed',
        sync_status: 'synced',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'calendar_id,external_id'
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB error storing event:', dbError);
    }

    return NextResponse.json({
      success: true,
      event: {
        id: dbEvent?.id || googleEvent.id,
        google_id: googleEvent.id,
        title,
        starts_at,
        ends_at: eventBody.end?.dateTime || eventBody.end?.date,
        link: googleEvent.htmlLink,
      }
    });

  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/events?id=<supabase_event_id>
 * Remove event from Google Calendar + soft-delete in Supabase
 */
export async function DELETE(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get('id');
    if (!eventId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Get event from Supabase
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete from Google Calendar if it has an external_id
    if (event.external_id) {
      try {
        const { gcal } = await getGoogleCalendar();
        await gcal.events.delete({
          calendarId: 'primary',
          eventId: event.external_id,
        });
      } catch (gErr: any) {
        // 404/410 = already deleted on Google side, that's fine
        if (gErr?.code !== 404 && gErr?.code !== 410) {
          console.error('Google delete error:', gErr);
        }
      }
    }

    // Soft-delete in Supabase
    await supabase
      .from('events')
      .update({
        status: 'cancelled',
        deleted_at: new Date().toISOString(),
        sync_status: 'synced',
      })
      .eq('id', eventId);

    return NextResponse.json({ success: true, deleted: eventId });

  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/calendar/events
 * Update an existing event in Google Calendar + Supabase
 * Body: { id: string, title?, description?, location?, starts_at?, ends_at?, is_all_day?, timezone? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, location, starts_at, ends_at, is_all_day, timezone } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Get event from Supabase
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { gcal, calendar } = await getGoogleCalendar();
    const tz = timezone || event.timezone || 'Europe/Oslo';
    const allDay = is_all_day !== undefined ? is_all_day : event.is_all_day;

    // Build update payload for Google
    const patch: any = {};
    if (title !== undefined) patch.summary = title;
    if (description !== undefined) patch.description = description;
    if (location !== undefined) patch.location = location;

    if (starts_at || ends_at || is_all_day !== undefined) {
      const newStart = starts_at || event.starts_at;
      const newEnd = ends_at || event.ends_at;

      if (allDay) {
        patch.start = { date: newStart.split('T')[0] };
        const endDate = new Date(newEnd.split('T')[0]);
        endDate.setDate(endDate.getDate() + 1);
        patch.end = { date: endDate.toISOString().split('T')[0] };
      } else {
        patch.start = { dateTime: newStart, timeZone: tz };
        patch.end = { dateTime: newEnd, timeZone: tz };
      }
    }

    // Update in Google Calendar
    if (event.external_id && Object.keys(patch).length > 0) {
      await gcal.events.patch({
        calendarId: 'primary',
        eventId: event.external_id,
        requestBody: patch,
      });
    }

    // Update in Supabase
    const dbUpdate: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) dbUpdate.title = title;
    if (description !== undefined) dbUpdate.description = description;
    if (location !== undefined) dbUpdate.location = location;
    if (starts_at) dbUpdate.starts_at = starts_at;
    if (ends_at) dbUpdate.ends_at = ends_at;
    if (is_all_day !== undefined) dbUpdate.is_all_day = is_all_day;

    const { data: updated } = await supabase
      .from('events')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();

    return NextResponse.json({ success: true, event: updated });

  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Failed to update event', details: String(error) },
      { status: 500 }
    );
  }
}
