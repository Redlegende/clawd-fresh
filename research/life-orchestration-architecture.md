# Life Orchestration System — Deep Research Report

## Executive Summary

This report outlines a robust, database-first life orchestration system architecture that manages calendar events, tasks, reminders, and business workflows without relying on AI memory. The system is designed for infinite scalability, handles all edge cases, and runs reliably for months without manual intervention.

**Key Principles:**
1. **Database as Source of Truth** — PostgreSQL stores all state
2. **Idempotent Operations** — Safe to retry any operation
3. **Sub-Agent Pattern** — Specialized agents for different domains
4. **Edge-First Design** — All edge cases handled before they occur
5. **At-Least-Once Delivery** — Jobs may run twice; design for it

---

## 1. Architecture Overview

### 1.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER (Supabase)                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Core   │ │ Calendar │ │  Tasks   │ │Reminders │ │ Business │  │
│  │  Users   │ │  Events  │ │   Jobs   │ │  Queue   │ │Airbnb/etc│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Job Queue (pgmq)                          │  │
│  │   SCHEDULED → QUEUED → PROCESSING → COMPLETED/FAILED        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUB-AGENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│   │  Calendar  │  │    Task    │  │  Reminder  │  │   Airbnb   │   │
│   │   Agent    │  │   Agent    │  │   Agent    │  │   Agent    │   │
│   └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│                                                                       │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐                    │
│   │  Finance   │  │  Scheduler │  │ Notification│                   │
│   │   Agent    │  │   Agent    │  │   Agent     │                   │
│   └────────────┘  └────────────┘  └────────────┘                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL INTEGRATIONS                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Google  │  │  Apple   │  │ Telegram │  │  Airbnb  │           │
│  │ Calendar │  │ Calendar │  │   Bot    │  │   API    │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Why This Architecture Works

| Problem | Solution |
|---------|----------|
| AI memory limits | Everything in PostgreSQL |
| Lost tasks on restart | Database persists, cron re-queries |
| Duplicate reminders | Idempotency keys + delivery logs |
| Race conditions | Optimistic locking (version field) |
| Timezone bugs | Store UTC, convert at display |
| API rate limits | Queue with exponential backoff |
| System downtime | Queue retries + dead letter queue |

---

## 2. Database Schema — Production Ready

### 2.1 Core Tables

```sql
-- Users & Configuration
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id TEXT UNIQUE,
    timezone TEXT NOT NULL DEFAULT 'Europe/Oslo',
    email TEXT,
    notification_prefs JSONB DEFAULT '{"morning_briefing": true, "reminders": true}'
);

-- System configuration
CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 Calendar Schema (UTC-First)

```sql
CREATE TABLE calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    provider TEXT CHECK (provider IN ('google', 'apple', 'internal')),
    external_id TEXT, -- Google's calendar ID
    sync_token TEXT,  -- For delta sync
    last_synced TIMESTAMPTZ
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID REFERENCES calendars(id),
    external_id TEXT, -- Google's event ID
    
    -- Event details
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    
    -- TIMING — ALL IN UTC
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL, -- Original timezone for display
    
    -- Recurrence (RFC 5545)
    recurrence_rule TEXT,
    recurrence_parent_id UUID REFERENCES events(id),
    
    -- Deduplication
    ical_uid TEXT UNIQUE,
    etag TEXT, -- Google's version tag
    
    -- Soft delete for sync
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(calendar_id, external_id)
);
```

### 2.3 Tasks Schema (Infinite Scalability)

```sql
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled');
CREATE TYPE priority AS ENUM ('lowest', 'low', 'medium', 'high', 'urgent');

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'backlog',
    priority priority DEFAULT 'medium',
    
    -- Scheduling
    due_date DATE,
    due_time TIME,
    scheduled_start TIMESTAMPTZ, -- When actually planned
    scheduled_end TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 60,
    
    -- Link to calendar when scheduled
    calendar_event_id UUID REFERENCES events(id),
    
    -- Source tracking
    source TEXT, -- 'manual', 'telegram', 'airbnb', 'agent'
    external_id TEXT,
    
    -- Recurrence
    recurrence_rule TEXT,
    
    -- Completion
    completed_at TIMESTAMPTZ,
    completed_by TEXT,
    
    -- Concurrency control
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Performance indexes for scale
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE status NOT IN ('done', 'cancelled');
CREATE INDEX idx_tasks_scheduled ON tasks(scheduled_start) WHERE scheduled_start IS NOT NULL;
```

### 2.4 Reminders Schema (One-Time Only)

```sql
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    
    -- What we're reminding about
    entity_type TEXT CHECK (entity_type IN ('event', 'task', 'standalone')),
    entity_id UUID,
    
    -- When to remind
    remind_at TIMESTAMPTZ NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed', 'snoozed')),
    sent_at TIMESTAMPTZ,
    
    -- IDEMPOTENCY KEY — Prevents duplicates
    idempotency_key TEXT GENERATED ALWAYS AS (
        user_id::text || ':' || entity_type || ':' || entity_id::text || ':' || remind_at::text
    ) STORED UNIQUE,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient reminder queries
CREATE INDEX idx_reminders_pending ON reminders(remind_at) 
    WHERE status = 'pending' AND remind_at <= now() + interval '1 hour';
```

### 2.5 Airbnb/Business Schema

```sql
CREATE TABLE cabins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    airbnb_listing_id TEXT UNIQUE,
    checkin_time TIME DEFAULT '15:00',
    checkout_time TIME DEFAULT '11:00',
    cleaning_hours INTEGER DEFAULT 4
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabin_id UUID REFERENCES cabins(id),
    
    guest_name TEXT,
    guest_email TEXT,
    airbnb_confirmation_code TEXT,
    
    checkin_date DATE NOT NULL,
    checkout_date DATE NOT NULL,
    
    status TEXT DEFAULT 'confirmed',
    
    -- Sync tracking
    last_synced TIMESTAMPTZ,
    sync_fingerprint TEXT,
    
    UNIQUE(cabin_id, airbnb_confirmation_code)
);

-- Auto-generated cleaning tasks
CREATE TABLE cleaning_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabin_id UUID REFERENCES cabins(id),
    booking_id UUID REFERENCES bookings(id),
    
    scheduled_date DATE NOT NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    
    status TEXT DEFAULT 'scheduled',
    
    -- Link to task system
    task_id UUID REFERENCES tasks(id)
);
```

### 2.6 Job Queue Schema

```sql
-- Use pgmq extension for production queue
-- CREATE EXTENSION IF NOT EXISTS pgmq;

-- Scheduled jobs for one-time execution
CREATE TABLE scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL, -- 'reminder', 'sync', 'morning_briefing'
    payload JSONB NOT NULL,
    
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending',
    
    -- Deduplication
    dedup_key TEXT UNIQUE,
    
    -- Processing
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_jobs_pending ON scheduled_jobs(scheduled_for) WHERE status = 'pending';
```

---

## 3. Sub-Agent Responsibilities

### 3.1 Agent Orchestration Pattern

```
┌─────────────────────────────────────────┐
│          Main Agent (You)               │
│  - Understand user intent               │
│  - Dispatch to specialized agents       │
│  - Aggregate responses                  │
└─────────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Calendar│    │  Task   │    │ Reminder│
│  Agent  │    │  Agent  │    │  Agent  │
└─────────┘    └─────────┘    └─────────┘
```

### 3.2 Calendar Agent

**Responsibilities:**
- Sync Google/Apple calendars every 15 minutes
- Handle recurring events (RRULE expansion)
- Detect conflicts
- Find free slots for task scheduling

**Idempotency:**
```typescript
async function syncEvent(externalEvent: GoogleEvent): Promise<void> {
  // Unique key prevents duplicates
  await db.events.upsert({
    external_id: externalEvent.id,
    calendar_id: calendarId,
    etag: externalEvent.etag
  }, {
    onConflict: ['calendar_id', 'external_id'],
    update: ['title', 'starts_at', 'ends_at', 'etag']
  });
}
```

### 3.3 Task Agent

**Responsibilities:**
- CRUD operations for tasks
- Auto-scheduling based on priority + available time
- Rescheduling incomplete tasks
- Link tasks to calendar events

**Auto-Scheduling Algorithm:**
```typescript
function scheduleTask(task: Task): TimeSlot {
  // 1. Find free slots in calendar
  const freeSlots = getFreeSlots(
    after: now(),
    duration: task.duration_minutes,
    exclude: ['08:00-10:00'] // Morning routine
  );
  
  // 2. Filter by priority
  if (task.priority === 'urgent') {
    return freeSlots[0]; // ASAP
  }
  
  // 3. Respect energy patterns
  if (task.type === 'deep_work') {
    return freeSlots.find(slot => slot.isMorning);
  }
  
  return freeSlots[0];
}
```

### 3.4 Reminder Agent

**Responsibilities:**
- Create reminders from task due dates
- Send notifications via Telegram
- Handle snooze/dismiss
- One-time execution only

**One-Time Cron Pattern:**
```typescript
// When user says: "Remind me tomorrow at 3 PM"
async function createOneTimeReminder(text: string, when: DateTime): Promise<void> {
  // 1. Add to database
  const reminder = await db.reminders.insert({
    user_id: userId,
    remind_at: when,
    message: text
  });
  
  // 2. Schedule one-time job (auto-deletes after run)
  await cron.schedule({
    runAt: when.minus({ minutes: 5 }), // 5 min early
    job: async () => {
      await sendTelegramMessage(userId, `🔔 ${text} in 5 minutes`);
      await db.reminders.update(reminder.id, { status: 'sent' });
    },
    oneTime: true // Critical: doesn't repeat
  });
}
```

### 3.5 Airbnb Agent

**Responsibilities:**
- Sync bookings from iGMS/Airbnb API
- Generate cleaning schedules
- Create guest communication tasks
- Handle booking modifications

**Guest Request → Task Flow:**
```
Guest SMS: "Can we get firewood?"
    ↓
iMessage Agent parses message
    ↓
Creates task: "Bring firewood to Sandmovegen 3"
    ↓
Scheduled for: day_before_checkin at 14:00
    ↓
Reminder: morning_of at 08:00
    ↓
You get Telegram: "🪵 Bring firewood today before 3 PM"
```

### 3.6 Finance/Hour Tracking Agent

**Responsibilities:**
- Log hours from calendar events
- Calculate pay with MVA
- Month-end invoice generation
- Rate rules (day/night for By Taxi)

**Rate Configuration:**
```typescript
const RATE_RULES = {
  'stephan_trond': { rate: 400, mva: 1.25 }, // 400 kr/h + MVA
  'by_taxi_day': { rate: 300, mva: 1.25, hours: '10:00-22:00' },
  'by_taxi_night': { rate: 400, mva: 1.25, hours: '22:00-10:00' }
};

function calculatePay(entry: HourEntry): number {
  const rule = RATE_RULES[entry.client];
  const base = entry.hours * rule.rate;
  return base * rule.mva;
}
```

---

## 4. Critical Edge Cases & Solutions

### 4.1 One-Time Reminders (Critical!)

**Problem:** Cron jobs repeat by default
**Solution:** Three-layer protection

```sql
-- Layer 1: Database prevents duplicate reminders
idempotency_key UNIQUE

-- Layer 2: Job queue with dedup_key
scheduled_jobs.dedup_key UNIQUE

-- Layer 3: Application check
async function sendReminder(reminderId: string): Promise<void> {
  const reminder = await db.reminders.find(reminderId);
  
  // Skip if already sent
  if (reminder.status === 'sent') {
    logger.info('Reminder already sent, skipping');
    return;
  }
  
  await sendTelegram(reminder.user_id, reminder.message);
  await db.reminders.update(reminderId, { status: 'sent' });
}
```

### 4.2 Timezone Hell

**Problem:** Events created in different timezones, DST transitions
**Solution:** 
- Store everything in UTC
- Convert at presentation layer
- Handle DST explicitly

```typescript
// Wrong — ambiguous
const start = new Date('2026-03-29 02:30'); // DST transition!

// Right — explicit UTC
const start = DateTime.fromISO('2026-03-29T02:30:00', { zone: 'Europe/Oslo' }).toUTC();

// When scheduling reminders, always calculate from UTC
function getReminderTime(eventStart: DateTimeUTC, minutesBefore: number): DateTimeUTC {
  return eventStart.minus({ minutes: minutesBefore });
}
```

### 4.3 Race Conditions

**Problem:** Two agents try to update same task simultaneously
**Solution:** Optimistic locking

```typescript
async function updateTask(taskId: string, changes: TaskUpdate): Promise<Task> {
  const task = await db.tasks.find(taskId);
  const currentVersion = task.version;
  
  const updated = await db.tasks.update({
    id: taskId,
    version: currentVersion // WHERE clause
  }, {
    ...changes,
    version: currentVersion + 1
  });
  
  if (!updated) {
    throw new Error('Task was modified by another process. Please retry.');
  }
  
  return updated;
}
```

### 4.4 Duplicate Booking Sync

**Problem:** Same booking synced multiple times from Airbnb
**Solution:** Fingerprint + upsert

```typescript
const fingerprint = md5(`${booking.confirmation_code}:${booking.checkin_date}:${booking.checkout_date}`);

await db.bookings.upsert({
  cabin_id: cabinId,
  airbnb_confirmation_code: booking.confirmation_code,
  sync_fingerprint: fingerprint
}, {
  onConflict: ['cabin_id', 'airbnb_confirmation_code'],
  update: ['guest_name', 'checkin_date', 'checkout_date', 'sync_fingerprint']
});
```

### 4.5 System Downtime Recovery

**Problem:** Server restarts, missed cron jobs
**Solution:** 
1. Cron runs every minute to check for pending jobs
2. Jobs are idempotent (safe to run twice)
3. On startup, process all missed jobs

```typescript
// On system startup
async function recoverMissedJobs(): Promise<void> {
  const missedJobs = await db.scheduled_jobs.find({
    status: 'pending',
    scheduled_for: { lt: now() }
  });
  
  for (const job of missedJobs) {
    logger.info(`Recovering missed job: ${job.id}`);
    await processJob(job); // Safe to retry
  }
}
```

### 4.6 Infinite Loop Prevention

**Problem:** Task A reschedules, triggers reminder, which updates task, which triggers reminder...
**Solution:** Event sourcing + deduplication

```typescript
async function updateTaskWithEvents(taskId: string, changes: TaskUpdate): Promise<void> {
  // 1. Update task
  await db.tasks.update(taskId, changes);
  
  // 2. Create event (for audit, not for triggering)
  await db.events.insert({
    entity_type: 'task',
    entity_id: taskId,
    action: 'updated',
    changes,
    processed: false
  });
  
  // 3. Event processor runs separately (every 5 min)
  //    with deduplication
}
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up Supabase with schema
- [ ] Create base agents (Calendar, Task, Reminder)
- [ ] Implement one-time reminder system
- [ ] Telegram bot integration
- [ ] Morning briefing cron

### Phase 2: Calendar Integration (Week 2)
- [ ] Google Calendar OAuth + sync
- [ ] Auto-scheduling tasks to free slots
- [ ] Handle recurring events
- [ ] Timezone conversion

### Phase 3: Business Workflows (Week 3)
- [ ] iGMS/Airbnb API integration
- [ ] Booking → Cleaning task auto-generation
- [ ] Guest request parsing (iMessage)
- [ ] Hour tracking from calendar events

### Phase 4: Smart Orchestration (Week 4)
- [ ] Auto-rescheduling incomplete tasks
- [ ] Conflict detection & resolution
- [ ] Energy-based scheduling
- [ ] End-of-day review

### Phase 5: Advanced Features (Later)
- [ ] Voice commands
- [ ] Garmin integration
- [ ] Invoice generation
- [ ] PARA method organization

---

## 6. Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Database | Supabase PostgreSQL | Real-time subscriptions, pg_cron, RLS |
| Queue | pgmq (PostgreSQL) | No external dependency, ACID guarantees |
| Cron | pg_cron + Clawdbot | Database-level + agent-level scheduling |
| Calendar API | Google Calendar API | Industry standard, webhooks |
| Airbnb | iGMS API | Your existing PMS |
| Messaging | Telegram Bot API | Reliable, fast, supports your workflow |
| Hosting | Vercel + Supabase | Serverless, scales to zero |
| Agents | TypeScript + OpenClaw | Type-safe, your existing stack |

---

## 7. Daily Workflow (Target State)

### 7:00 AM — Morning Briefing (Auto)
```
🌅 Good morning Jakob!

📅 Today:
• 08:00-10:00 ☕ Morning routine
• 10:00-14:00 🚗 Driving (Fåvang Varetaxi)
• 14:00-15:00 🔴 URGENT: Call Kartverket (rescheduled from yesterday)
• 15:00-18:00 💻 Deep work: Kvitfjellhytter OAuth

🏠 Airbnb:
• Tomorrow: Sandmovegen 3 checkout 11:00 → Clean 11:30
• Guest request: Firewood for Friday arrival

🔴 Overdue:
• Reply to Henrik about 3dje (2 days)

What should I prioritize?
```

### During Day:
- **You:** "I can't do Kartverket today"
- **Me:** *Auto-finds next slot:* "✅ Moved to tomorrow 14:00. Calendar updated."

### 23:00 — End of Day (Auto)
- Mark incomplete tasks
- Reschedule to next available slot
- Send tomorrow preview

---

## 8. Key Decisions

### 8.1 Why Not Rely on AI Memory?
| Risk | Mitigation |
|------|-----------|
| Context window fills | Database has no limit |
| Session restarts | State persists in PostgreSQL |
| Wrong recall | Query exact data from source |
| Concurrent access | Database handles locking |

### 8.2 Why Sub-Agents?
| Benefit | Example |
|---------|---------|
| Specialization | Calendar agent knows RRULE |
| Isolation | Airbnb failure doesn't break reminders |
| Scaling | Can run agents on different workers |
| Testing | Test calendar sync independently |

### 8.3 Why PostgreSQL Queue (pgmq)?
- No external Redis/RabbitMQ to manage
- ACID transactions (job + data update = atomic)
- Same backup/restore as rest of system
- Visibility timeout built-in

---

## 9. Open Questions

1. **Calendar authority:** Should I auto-add events or suggest → you approve?
2. **Rescheduling:** Auto-move incomplete tasks or ask first?
3. **iMessage access:** Auto-read SMS or forward to me?
4. **Energy tracking:** Log how you feel each day for better scheduling?
5. **Guest communication:** Auto-send messages or draft → you send?

---

## 10. Success Metrics

- ✅ Zero missed reminders (track in delivery_log)
- ✅ <1 second task creation latency
- ✅ 99.9% cron job success rate
- ✅ No duplicate bookings/tasks ever
- ✅ <5 minutes from "add todo" to scheduled in calendar

---

*This architecture is designed to run for years without manual intervention. Every edge case is handled. The system is your reliable partner, not a fragile toy.*
