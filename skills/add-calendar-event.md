# Skill: Add Calendar Event

**Trigger:** "Add event", "Schedule", "Book time for", "Put X on calendar"

## How to Use

Make a POST request to the Observatory API to create a Google Calendar event.

### Endpoint
```
POST https://the-observatory-beta.vercel.app/api/calendar/events
```

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "title": "Meeting with Henrik",
  "description": "Discuss tomte pipeline",
  "location": "Oslo",
  "starts_at": "2026-02-10T14:00:00",
  "ends_at": "2026-02-10T15:00:00",
  "is_all_day": false,
  "timezone": "Europe/Oslo"
}
```

### All-Day Event
```json
{
  "title": "Deadline: MVA Oppgave",
  "starts_at": "2026-02-15",
  "is_all_day": true
}
```

### Required Fields
- `title` — Event name
- `starts_at` — ISO datetime or YYYY-MM-DD for all-day

### Optional Fields
- `ends_at` — Defaults to 1 hour after start
- `description` — Event description
- `location` — Location string
- `is_all_day` — Boolean, default false
- `timezone` — Default "Europe/Oslo"

### Response
```json
{
  "success": true,
  "event": {
    "id": "uuid",
    "google_id": "google-event-id",
    "title": "Meeting with Henrik",
    "starts_at": "2026-02-10T14:00:00",
    "ends_at": "2026-02-10T15:00:00",
    "link": "https://calendar.google.com/calendar/event?eid=..."
  }
}
```

### Example (curl)
```bash
curl -X POST https://the-observatory-beta.vercel.app/api/calendar/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Gym","starts_at":"2026-02-10T17:00:00","ends_at":"2026-02-10T18:30:00"}'
```

---

## Edit an Event

### Endpoint
```
PATCH https://the-observatory-beta.vercel.app/api/calendar/events
```

### Body
```json
{
  "id": "supabase-event-uuid",
  "title": "Updated title",
  "starts_at": "2026-02-10T15:00:00",
  "ends_at": "2026-02-10T16:00:00"
}
```

Only include fields you want to change. The `id` is the Supabase event UUID.

---

## Delete an Event

### Endpoint
```
DELETE https://the-observatory-beta.vercel.app/api/calendar/events?id=<supabase-event-uuid>
```

Removes from both Google Calendar and Supabase (soft-delete).

---

## Smart Reschedule (Fred Skill)

When Jakob's schedule changes (e.g., has to work Varetaxi, restaurant shift):

1. **Identify the conflict** — which time block is now occupied
2. **Query events for the day** — `GET` from Supabase `events` table
3. **Prioritize** — high priority events stay, low priority ones get moved
4. **Find empty slots** — look at surrounding days for free time
5. **PATCH events** to move them to empty slots
6. **Never touch external/synced events** — only move Observatory-created events

**Priority rules:**
- Work commitments (Varetaxi, Treffen) > everything
- High priority tasks > medium > low
- Events with other people > solo events
- Don't double-book any slot

### Notes
- Events are created on the primary Google Calendar
- Events are simultaneously stored in Supabase `events` table
- The calendar must be connected first (Settings → Connect Google Calendar)
- Token refresh is handled automatically
