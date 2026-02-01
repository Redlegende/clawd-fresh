# 🤖 Automated Hour Tracking System

*Auto-extract hours from Fåvang Varetaxi PDFs, log to calendar, and remind you to confirm*

---

## 📋 System Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Email     │────▶│  PDF Parse  │────▶│   Calendar  │
│   Check     │     │  + Extract  │     │    Entry    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                       ┌────────────────────────┘
                       ▼
              ┌─────────────┐     ┌─────────────┐
              │   Reminder  │────▶│   Hours     │
              │    Set      │     │   Logged    │
              └─────────────┘     └─────────────┘
```

---

## 🔄 Weekly Workflow

### Friday (Primary Check)
**Time:** Friday 16:00
**Action:** Check Gmail for PDF from Fåvang Varetaxi
- Search: `from:fåvangvaretaxi.no OR from:*@fåvangvaretaxi.no newer_than:7d has:attachment filename:pdf`
- If found: Download, parse, extract hours
- If NOT found: Schedule Saturday check

### Saturday (Backup Check #1)
**Time:** Saturday 10:00  
**Action:** Re-check Gmail if Friday was empty
- If found: Process as above
- If NOT found: Schedule Sunday check

### Sunday (Backup Check #2)
**Time:** Sunday 10:00
**Action:** Final check if Saturday was empty
- If found: Process
- If NOT found: Alert user PDF not received

---

## 📅 Calendar Integration

### Event Creation
For each driving day extracted from PDF:
```bash
gog calendar create primary \
  --summary "🚕 Fåvang Varetaxi - Day Shift" \
  --from "2026-01-30T10:00:00" \
  --to "2026-01-30T19:00:00" \
  --event-color 10 \
  --description "Auto-logged from taxi PDF. Reply to Freddy with actual end time."
```

### Color Coding
- 🟢 **Green (10):** Day shift (before 22:00)
- 🔴 **Red (11):** Night shift (after 22:00)

---

## ⏰ Reminder System

### End-of-Shift Reminder
**Trigger:** Calendar event end time
**Message:** 
> "🚕 Shift ending! How many hours did you actually drive today? Reply: 'Started 10, finished 19:30, night 20-23'"

### Daily Summary Reminder
**Time:** 22:30 (if day shift) or 01:00 (if night shift)
**Message:**
> "📊 Today's hours summary:
> - Day: X hours @ 375 kr = X kr
> - Night: X hours @ 500 kr = X kr
> - Total: X kr
> 
> Confirm? Reply 'yes' or send corrections."

---

## 📧 PDF Parsing Logic

### Expected PDF Format
Fåvang Varetaxi sends weekly PDFs with:
```
Uke XX - 2025
Dato:       Fra:    Til:    Kunde:           Timer:
2025-01-27  10:00   18:30   Standard         8.5
2025-01-27  20:00   23:30   Night            3.5
...
```

### Extraction Steps
1. Download PDF attachment
2. Convert to text (using `pdftotext` or similar)
3. Parse lines matching date pattern: `YYYY-MM-DD`
4. Extract: Date, Start, End, Hours
5. Categorize: Day (<22:00) vs Night (≥22:00)
6. Store in `hours/fåvang-varetaxi/2025-XX.md`

---

## 📁 File Structure

```
hours/
├── README.md
├── automation/
│   ├── check-taxi-email.sh      # Friday/Sat/Sun checker
│   ├── parse-pdf.py              # PDF text extraction
│   ├── update-hours.sh           # Update markdown files
│   └── set-reminders.sh          # Cron reminder setup
├── fåvang-varetaxi/
│   ├── 2025-01.md
│   └── pdfs/                     # Downloaded PDFs
│       └── uke-4-2025.pdf
├── treffen/
│   └── 2025-01.md
└── calendar-sync.log             # Track what was added
```

---

## 🛠️ Implementation Tasks

### Phase 1: Manual Test (This Week)
- [ ] Install `pdftotext` or Python PDF parser
- [ ] Test gog email search manually
- [ ] Test gog calendar create
- [ ] Parse one PDF manually, verify extraction

### Phase 2: Automation (Next Week)
- [ ] Create `check-taxi-email.sh` script
- [ ] Create PDF parsing function
- [ ] Create calendar integration
- [ ] Set up cron jobs for Fri/Sat/Sun checks
- [ ] Create reminder system

### Phase 3: Refinement
- [ ] Handle edge cases (no PDF, multiple PDFs)
- [ ] Add error handling and alerts
- [ ] Create monthly invoice generator

---

## 🔐 Required Setup

### 1. gog Authentication (One-time)
```bash
gog auth add jakob@yourdomain.com --services gmail,calendar
```

### 2. PDF Tools
```bash
# Option 1: pdftotext (lightweight)
brew install poppler

# Option 2: Python (more robust)
pip install PyPDF2 pdfplumber
```

### 3. Cron Jobs
```bash
# Friday 16:00
0 16 * * 5 /Users/jakobbakken/clawd/hours/automation/check-taxi-email.sh

# Saturday 10:00 (only if Friday empty)
0 10 * * 6 /Users/jakobbakken/clawd/hours/automation/check-taxi-email.sh --retry

# Sunday 10:00 (only if Saturday empty)  
0 10 * * 0 /Users/jakobbakken/clawd/hours/automation/check-taxi-email.sh --retry
```

---

## 📊 Status Tracking

| Check | Status | Result | Action Taken |
|-------|--------|--------|--------------|
| 2026-01-31 Fri | ⏳ | - | Scheduled |

---

*Created: 2026-01-29*
