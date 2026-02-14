# Kvitfjellhytter Dashboard - Bookings Integration

## What Was Created

This folder contains the files needed to add bookings display and property sync to your Kvitfjellhytter dashboard.

## Database Tables Created

### bookings
- Stores all booking data from iGMS
- 16 columns including booking_uid, dates, guests, pricing
- Indexes on booking_uid and checkin dates

### igms_properties  
- Stores property/listing data from iGMS
- 11 columns including uid, title, address, specs

## Files to Copy

### 1. Bookings Page
**Source:** `page.tsx`
**Destination:** Your dashboard's `app/dashboard/bookings/page.tsx`

This creates a `/dashboard/bookings` route that displays:
- Stats cards (upcoming bookings, total guests, total revenue)
- Table of all bookings with sorting by check-in date
- Formatted dates, currency, and status badges

### 2. Property Sync API
**Source:** `properties/route.ts`
**Destination:** Your dashboard's `app/api/igms/properties/route.ts`

This adds:
- `POST /api/igms/properties` - Sync properties from iGMS to Supabase
- `GET /api/igms/properties` - Fetch stored properties

### 3. SQL Cleanup
**Source:** `properties_and_cleanup.sql`
**Run in:** Supabase SQL Editor

Contains:
- Properties table creation (already done)
- Comments for cleaning up old test tokens

## Integration Steps

1. **Copy the bookings page** to your dashboard codebase
2. **Add the bookings link** to your dashboard navigation
3. **Copy the properties API route** if you want property sync
4. **Test the sync** by clicking "Sync Now" on your dashboard

## Manual Token Cleanup

To clean up old test tokens, run this in Supabase SQL Editor:

```sql
-- View existing tokens
SELECT id, created_at, LEFT(access_token, 20) as token_prefix 
FROM igms_tokens 
ORDER BY created_at DESC;

-- Delete old test tokens (uncomment to run)
-- DELETE FROM igms_tokens WHERE created_at < '2025-01-01';
-- DELETE FROM igms_tokens WHERE access_token LIKE '%test%';
```

## Dashboard URL
https://app-pink-eight-65.vercel.app

## Supabase Project
https://supabase.com/dashboard/project/spjcdygewwthheriwqaa
