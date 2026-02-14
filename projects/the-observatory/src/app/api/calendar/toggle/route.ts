import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * PATCH /api/calendar/toggle
 * Toggle a sub-calendar's selected state
 * Body: { calendarId: string, subCalendarId: string, selected: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { calendarId, subCalendarId, selected } = await request.json();

    if (!calendarId || !subCalendarId || typeof selected !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch current calendars JSONB
    const { data: cal, error: fetchError } = await supabase
      .from('calendars')
      .select('calendars')
      .eq('id', calendarId)
      .single();

    if (fetchError || !cal) {
      return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
    }

    // Update the selected state of the specific sub-calendar
    const updatedCalendars = (cal.calendars || []).map((c: any) =>
      c.id === subCalendarId ? { ...c, selected } : c
    );

    const { error: updateError } = await supabase
      .from('calendars')
      .update({
        calendars: updatedCalendars,
        updated_at: new Date().toISOString(),
      })
      .eq('id', calendarId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, calendars: updatedCalendars });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to toggle calendar', details: String(error) },
      { status: 500 }
    );
  }
}
