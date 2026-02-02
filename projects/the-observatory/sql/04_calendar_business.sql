-- Calendar Table
CREATE TABLE orchestrator.calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'outlook', 'internal')),
    external_id TEXT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4285F4',
    sync_token TEXT,
    last_synced_at TIMESTAMPTZ,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider, external_id)
);

-- Calendar Events
CREATE TABLE orchestrator.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL REFERENCES orchestrator.calendars(id) ON DELETE CASCADE,
    external_id TEXT,
    
    -- Event details
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    
    -- Timing (stored in UTC)
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Europe/Oslo',
    is_all_day BOOLEAN DEFAULT false,
    
    -- Recurrence
    recurrence_rule TEXT,
    recurrence_parent_id UUID REFERENCES orchestrator.events(id),
    is_exception BOOLEAN DEFAULT false,
    
    -- Sync & deduplication
    etag TEXT,
    ical_uid TEXT UNIQUE,
    fingerprint TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(calendar_id, external_id)
);

-- Cabins (Airbnb)
CREATE TABLE orchestrator.cabins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    airbnb_listing_id TEXT UNIQUE,
    checkin_time TIME DEFAULT '15:00',
    checkout_time TIME DEFAULT '11:00',
    cleaning_duration_minutes INTEGER DEFAULT 240,
    buffer_minutes INTEGER DEFAULT 30,
    auto_cleaning_schedule BOOLEAN DEFAULT true,
    auto_guest_messages BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings
CREATE TABLE orchestrator.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabin_id UUID NOT NULL REFERENCES orchestrator.cabins(id) ON DELETE CASCADE,
    
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    guest_phone TEXT,
    guest_count INTEGER,
    
    airbnb_confirmation_code TEXT,
    booking_source TEXT DEFAULT 'airbnb' CHECK (booking_source IN ('airbnb', 'direct', 'bookingcom')),
    
    checkin_date DATE NOT NULL,
    checkout_date DATE NOT NULL,
    
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('inquiry', 'pending', 'confirmed', 'cancelled', 'completed')),
    
    total_amount DECIMAL(10,2),
    currency TEXT DEFAULT 'NOK',
    
    last_synced_at TIMESTAMPTZ,
    sync_fingerprint TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(cabin_id, airbnb_confirmation_code)
);

-- Cleaning Schedules
CREATE TABLE orchestrator.cleaning_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabin_id UUID NOT NULL REFERENCES orchestrator.cabins(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES orchestrator.bookings(id) ON DELETE CASCADE,
    
    scheduled_date DATE NOT NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    
    type TEXT NOT NULL CHECK (type IN ('checkout', 'mid_stay', 'maintenance')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'skipped')),
    
    assigned_to TEXT,
    notes TEXT,
    
    task_id UUID REFERENCES orchestrator.tasks(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hour Tracking / Finance
CREATE TABLE orchestrator.hour_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES orchestrator.users(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    client TEXT NOT NULL CHECK (client IN ('stephan_trond', 'by_taxi', 'treffen', 'other')),
    description TEXT,
    
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_hours DECIMAL(4,2),
    
    rate_nok INTEGER NOT NULL,
    mva_rate DECIMAL(3,2) DEFAULT 1.25,
    total_nok DECIMAL(10,2),
    
    invoiced BOOLEAN DEFAULT false,
    invoiced_at TIMESTAMPTZ,
    invoice_number TEXT,
    
    source TEXT CHECK (source IN ('manual', 'calendar', 'agent')),
    event_id UUID REFERENCES orchestrator.events(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX idx_events_calendar ON orchestrator.events(calendar_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_time_range ON orchestrator.events(starts_at, ends_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_cabin ON orchestrator.bookings(cabin_id);
CREATE INDEX idx_bookings_dates ON orchestrator.bookings(checkin_date, checkout_date);
CREATE INDEX idx_cleaning_cabin ON orchestrator.cleaning_schedules(cabin_id, scheduled_date);
CREATE INDEX idx_hours_user_date ON orchestrator.hour_entries(user_id, date);

-- Enable RLS
ALTER TABLE orchestrator.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.cabins ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.cleaning_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator.hour_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow anon read calendars" ON orchestrator.calendars FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert calendars" ON orchestrator.calendars FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update calendars" ON orchestrator.calendars FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon read events" ON orchestrator.events FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert events" ON orchestrator.events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update events" ON orchestrator.events FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete events" ON orchestrator.events FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read cabins" ON orchestrator.cabins FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert cabins" ON orchestrator.cabins FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update cabins" ON orchestrator.cabins FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon read bookings" ON orchestrator.bookings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert bookings" ON orchestrator.bookings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update bookings" ON orchestrator.bookings FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon read cleaning" ON orchestrator.cleaning_schedules FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert cleaning" ON orchestrator.cleaning_schedules FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update cleaning" ON orchestrator.cleaning_schedules FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon read hours" ON orchestrator.hour_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert hours" ON orchestrator.hour_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update hours" ON orchestrator.hour_entries FOR UPDATE TO anon USING (true);
