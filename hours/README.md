# 💰 Hour Management System

*Tracking driving hours for Fåvang Varetaxi and Treffen restaurant work*

---

## 📊 Rate Structure

### Fåvang Varetaxi (Driving)
| Time Period | Rate | With MVA (25%) |
|-------------|------|----------------|
| Before 22:00 | 300 kr/h | 375 kr/h |
| After 22:00 | 400 kr/h | 500 kr/h |

### Treffen (Restaurant)
| Rate | With MVA (25%) |
|------|----------------|
| 400 kr/h | 500 kr/h |

---

## 📅 January 2025 — Uninvoiced Hours

### Day Drives (10:00 - 18:30)
*Rate: 300 kr/h × 8.5h = 2,550 kr/day + MVA*

| Date | From | Until | Hours | Amount | MVA | Total |
|------|------|-------|-------|--------|-----|-------|
| 7 Jan | 10:00 | 18:30 | 8.5h | 2,550 kr | 637.50 kr | 3,187.50 kr |
| 8 Jan | 10:00 | 18:30 | 8.5h | 2,550 kr | 637.50 kr | 3,187.50 kr |
| 12 Jan | 10:00 | 18:30 | 8.5h | 2,550 kr | 637.50 kr | 3,187.50 kr |
| 15 Jan | 10:00 | 18:30 | 8.5h | 2,550 kr | 637.50 kr | 3,187.50 kr |
| 16 Jan | 10:00 | 18:30 | 8.5h | 2,550 kr | 637.50 kr | 3,187.50 kr |
| 19 Jan | 10:00 | 18:30 | 8.5h | 2,550 kr | 637.50 kr | 3,187.50 kr |
| 20 Jan | 10:00 | 18:30 | 8.5h | 2,550 kr | 637.50 kr | 3,187.50 kr |
| 29 Jan | 10:00 | 19:30 | 9.5h | 2,850 kr | 712.50 kr | 3,562.50 kr |
| 30 Jan | 10:00 | --:-- | -- | -- | -- | -- |

**Day Drive Subtotal:** 76h | 22,800 kr | 5,700 kr MVA | **28,500 kr**

---

### Night Drives (After 20:00)
*Rate: 400 kr/h + MVA*

| Date | From | Until | Hours | Amount | MVA | Total |
|------|------|-------|-------|--------|-----|-------|
| 10 Jan | 20:30 | 01:15 | 4.75h | 1,900 kr | 475 kr | 2,375 kr |
| 12 Jan | 20:00 | 00:00 | 4h | 1,600 kr | 400 kr | 2,000 kr |
| 15 Jan | 20:00 | 00:00 | 4h | 1,600 kr | 400 kr | 2,000 kr |
| 29 Jan | 20:00 | 23:30 | 3.5h | 1,400 kr | 350 kr | 1,750 kr |
| 30 Jan | --:-- | --:-- | -- | -- | -- | -- |

**Night Drive Subtotal:** 16.25h | 6,500 kr | 1,625 kr MVA | **8,125 kr**

---

### Fåvang Varetaxi Summary

| Category | Hours | Net | MVA | Total |
|----------|-------|-----|-----|-------|
| Day Drives | 76h | 22,800 kr | 5,700 kr | 28,500 kr |
| Night Drives | 16.25h | 6,500 kr | 1,625 kr | 8,125 kr |
| **TOTAL** | **92.25h** | **29,300 kr** | **7,325 kr** | **36,625 kr** |

---

## 🍽️ Treffen Restaurant Work

*Rate: 400 kr/h + MVA = 500 kr/h*

| Date | From | Until | Hours | Amount | MVA | Total |
|------|------|-------|-------|--------|-----|-------|
| *(No entries yet)* | | | | | | |

---

## 📝 Daily Log Template

```
## YYYY-MM-DD (Day)

### Fåvang Varetaxi
- Shift 1: HH:MM - HH:MM (Xh) @ Day/Night rate
- Shift 2: HH:MM - HH:MM (Xh) @ Day/Night rate

### Treffen
- HH:MM - HH:MM (Xh)

**Notes:**
```

---

## 📁 File Structure

```
hours/
├── README.md              # This file — overview & totals
├── fåvang-varetaxi/
│   ├── 2025-01.md         # January hours
│   ├── 2025-02.md         # February hours
│   └── invoices/
│       ├── 2025-01-XX.md  # Generated invoices
│       └── sent/
├── treffen/
│   ├── 2025-01.md
│   └── invoices/
└── templates/
    ├── daily-log.md
    └── invoice-template.md
```

---

## 🔄 Reminders

- [ ] **Tomorrow (30 Jan):** Driving day — log start/end times
- [ ] **End of month:** Generate invoice for January hours
- [ ] **Weekly:** Review and confirm all logged hours

---

*Last updated: 2026-01-29*
