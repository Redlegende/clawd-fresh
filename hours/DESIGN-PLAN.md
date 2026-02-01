# 🚕 Hour Management System — Design Plan

*Proper planning before building — understanding requirements, constraints, and capabilities*

**Status:** 📝 Planning Phase  
**Last Updated:** 2026-01-29  

---

## 🎯 Core Problem Statement

**Current workflow:**
1. Fåvang Varetaxi sends PDF with scheduled driving dates (not hours)
2. Jakob drives on those dates
3. Jakob needs to track actual hours driven per day
4. Jakob needs to invoice based on actual hours + rates
5. Different rates: Day (300 kr/h), Night (400 kr/h), Treffen (400 kr/h)
6. MVA (25%) added to all rates

**Key insight:** PDF = scheduled dates only. Hours must come from Jakob's reporting.

---

## ❌ What I Got Wrong (First Attempt)

| Assumption | Reality |
|------------|---------|
| PDF contains hours | PDF only contains dates |
| I can auto-extract hours | I need Jakob to report hours |
| Calendar events = actual hours | Calendar = planned, need confirmation |
| Fully automated | Human-in-the-loop required |

---

## ✅ Correct System Design

### Data Flow (Clarified)

```
PDF Arrives (from Fåvang Varetaxi)
    │
    ▼
Extract: DATES only (which days Jakob is scheduled)
    │
    ▼
Calendar: Add those dates as reminders
    │
    ▼
On Driving Day → Freddy reminds Jakob
    │
    ▼
Jakob drives → Reports HOURS to Freddy (text)
    │
    ▼
Freddy: Calculate pay, log to hours file
    │
    ▼
End of month: Generate invoice
```

**Key Distinction:**
- **PDF** = Scheduled driving **DATES** (when)
- **Jakob's text** = Actual **HOURS** worked (how long)
- **Freddy** = Calculate pay + log everything

### Required Inputs from Jakob

**Daily reporting format:**
```
"Drove 30 Jan: 10:00-19:30, night 20:00-23:30"
```

**What I need to capture:**
- Date
- Start time
- End time  
- Shift type (day/night/Treffen)

**What I calculate:**
- Hours
- Rate (day 300, night 400, Treffen 400)
- Amount
- MVA (25%)
- Total

---

## 🔧 Required Capabilities Analysis

### Current Capabilities ✅

| Capability | Status | Notes |
|------------|--------|-------|
| Read/write files | ✅ | Markdown logs work |
| Calculate hours/pay | ✅ | Simple math |
| Store structured data | ✅ | Markdown + JSON |
| Telegram messaging | ✅ | Two-way communication |
| Cron reminders | ⚠️ | Need to configure properly |

### Missing Capabilities ❌

| Capability | Needed For | Solution Options |
|------------|------------|------------------|
| **PDF parsing** | Extract dates from taxi PDF | 1. Install `pdftotext` 2. Python pdfplumber 3. Upload PDF to me for manual read |
| **Email access** | Check for PDF arrival | 1. gog Gmail skill 2. IMAP direct 3. Forward PDFs to Telegram |
| **Calendar write** | Add planned shifts | gog Calendar skill |
| **Persistent reminders** | Ask for hours after shifts | Cron jobs or heartbeat checks |

---

## 🏗️ System Components (Revised)

### 1. PDF Receipt System
**Purpose:** Know which dates Jakob is scheduled

**Options:**
- **A. Automated:** Check Gmail Fri/Sat/Sun, download PDF, parse dates
- **B. Semi-auto:** Jakob forwards PDF to Telegram, I extract dates
- **C. Manual:** Jakob tells me "PDF received, dates: 30 Jan, 31 Jan..."

**Recommended:** Start with B (semi-auto) — lower complexity, still helpful

### 2. Shift Reporting System  
**Purpose:** Capture actual hours from Jakob

**Workflow:**
1. Jakob drives
2. Jakob messages me: "Done for today. 10-19:30, night 20-23"
3. I parse, calculate, confirm
4. I log to hours file

**Error handling:**
- If format unclear → ask for clarification
- If date missing → assume today
- If shift type unclear → ask day/night/Treffen

### 3. Calculation Engine
**Purpose:** Turn raw hours into invoice-ready data

**Rates:**
```
Day (before 22:00):   300 kr/h × 1.25 MVA = 375 kr/h
Night (after 22:00):  400 kr/h × 1.25 MVA = 500 kr/h
Treffen:              400 kr/h × 1.25 MVA = 500 kr/h
```

**Formula:**
```
Hours × Rate = Net
Net × 1.25 = Total with MVA
```

### 4. Storage System
**Purpose:** Keep permanent records

**Files:**
```
hours/
├── fåvang-varetaxi/
│   ├── 2025-01.md       # Human-readable log
│   └── 2025-01.json     # Machine-readable data
├── treffen/
│   ├── 2025-01.md
│   └── 2025-01.json
└── invoices/
    ├── 2025-01-fåvang.md  # Generated invoice
    └── sent/
```

### 5. Invoice Generation
**Purpose:** Create invoice documents

**Output format options:**
- Markdown (copy-paste to email)
- PDF (professional attachment)
- CSV (for accountant)

---

## 📋 Phase 1: MVP Requirements (Clarified)

### Phase 1A: Text Reporting (Can Build Now) ✅
- [x] Jakob reports hours via Telegram
- [x] Freddy calculates pay (day/night rates + MVA)
- [x] Store in markdown file
- [x] Show monthly summary
- [ ] Daily reminder at end of shift (manual for now)

**Example workflow:**
```
Jakob: "Drove today: 10-19:30, night 20-23"
Freddy: "Logged! Day: 9.5h × 375 kr = 3,562.50 kr | Night: 3.5h × 500 kr = 1,750 kr | Total: 5,312.50 kr"
```

### Phase 1B: PDF Dates → Calendar Reminders (Needs Tools)
- [ ] Read PDF to extract scheduled driving dates
- [ ] Add those dates to Google Calendar (as reminders)
- [ ] On those days: Remind Jakob to report hours

**Why:** PDF shows "You're driving Jan 30, 31, Feb 1" → Calendar reminders → "Today you're driving, report hours when done"

### Phase 2: Automation
- [ ] Automatic PDF checking (Fri/Sat/Sun)
- [ ] Invoice PDF generation
- [ ] Treffen integration
- [ ] Fiken/QuickBooks export

### Phase 3: Intelligence
- [ ] Pattern recognition ("You usually drive 10-19")
- [ ] Predictive reminders
- [ ] Historical analytics

---

## 🤔 Open Questions

1. **PDF access:** Should I get PDF parsing capability, or is text reporting enough for MVP?
2. **Treffen hours:** Same reporting format, different company — how to distinguish?
3. **Invoice delivery:** Does Jakob send invoices, or should I generate email drafts?
4. **Backup:** What if I miss a day — can Jakob retroactively report?

---

## 🎯 MVP Decision: Two-Phase Build

### Phase 1A: Text Reporting (Build Today) ✅
**Scope:** You text me hours, I calculate and log

**Requirements:**
- ✅ File writing (have)
- ✅ Telegram messaging (have)
- ✅ Math calculation (have)

**Workflow:**
1. You drive
2. You text: "30 Jan: 10-19:30 day, 20-23 night"
3. I calculate and confirm
4. Logged to `hours/fåvang-varetaxi/2025-01.md`

### Phase 1B: PDF → Calendar (Build Next)
**Scope:** I read PDF dates, add to calendar, remind you on those days

**Requirements:**
- ❌ PDF text extraction (need: `pdftotext` or `pdfplumber`)
- ❌ Gmail access (need: `gog` configured)
- ❌ Calendar write (need: `gog calendar create`)

**Workflow:**
1. PDF arrives with dates: "Jan 30, 31, Feb 1"
2. I extract dates
3. Add to calendar: "🚕 Driving day - report hours"
4. On those days at 19:00: "Driving today? Report hours when done"

---

## 🚀 Next Steps

1. **Today:** Use text reporting (already works)
2. **Tomorrow:** Install PDF tools when you're home
3. **This week:** Set up PDF → Calendar → Reminders flow

**Ready to proceed with Phase 1A?** Just send me your hours like: "Today: 10-19:30, night 20-23"
