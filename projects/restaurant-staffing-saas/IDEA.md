# Restaurant Staffing & Hour Tracking SaaS

**Status:** 💡 Idea Phase  
**Priority:** ASAP  
**Created:** 2026-02-13

---

## The Problem

Restaurant owners spend hours each month on:
- Finding staff to cover shifts
- Manual scheduling
- Tracking hours worked
- Calculating payroll

## The Solution

A scalable SaaS platform for restaurants/businesses with:

### Core Features

#### 1. Automatic Staff Finding
- Post open shifts → system finds available workers
- Worker pool (part-time, on-call, temp staff)
- Matching based on: skills, location, availability, ratings
- Instant notifications to workers

#### 2. Scheduling System
- Drag-and-drop schedule builder
- Recurring shifts
- Conflict detection (overlaps, labor laws)
- Worker availability calendar
- Shift swapping between workers

#### 3. Automatic Hour Tracking
- Clock in/out via app (GPS verified)
- QR code scanning at workplace
- Automatic break deductions
- Real-time hours dashboard
- Overtime alerts

#### 4. Payroll Integration
- Automatic hour calculations
- Export to payroll systems
- Tax/MVA calculations
- Invoice generation for temp workers

### Multi-Tenant Architecture
- Each restaurant = separate tenant
- White-label option
- Role-based access (owner, manager, worker)
- Data isolation between restaurants

### Compliance & Backup
- **Automated backups** — Hours data never lost
- **Audit trail** — Every change logged
- **Labor law compliance** — Break rules, overtime, youth restrictions
- **GDPR compliant** — Employee data protection
- **Export to PDF/Excel** — For authorities/accountants

---

## Business Model

| Tier | Price | Features |
|------|-------|----------|
| **Starter** | 499 kr/mo | 1 location, 10 workers, basic scheduling |
| **Pro** | 1,499 kr/mo | 3 locations, unlimited workers, payroll export |
| **Enterprise** | Custom | Multi-chain, API access, white-label |

**Worker fees:** Small fee per shift filled (paid by restaurant or worker)

---

## Tech Stack Proposal

- **Frontend:** Next.js 16 + shadcn/ui
- **Backend:** Supabase (multi-tenant with RLS)
- **Mobile:** React Native or PWA
- **Payments:** Stripe
- **Notifications:** OneSignal / Firebase
- **Backup:** Automated Supabase backups + S3

---

## Target Market

- Restaurants
- Cafes
- Hotels
- Retail stores
- Event staffing agencies
- Construction (hour tracking)

---

## MVP Scope (4-6 weeks)

1. **Week 1:** Multi-tenant setup, auth, basic roles
2. **Week 2:** Scheduling system
3. **Week 3:** Hour tracking (clock in/out)
4. **Week 4:** Worker pool & shift matching
5. **Week 5:** Payroll export, compliance features
6. **Week 6:** Polish, testing, first pilot customer

---

## Competitors
- Planday (Danish, expensive)
- Deputy (US-based)
- Quinyx (Enterprise)
- **Gap:** No good Norwegian solution with automatic staff finding

---

## Next Steps

- [ ] Validate with restaurant owners
- [ ] Define detailed requirements
- [ ] Create wireframes
- [ ] Build MVP
- [ ] Pilot with 1-2 restaurants
- [ ] Iterate based on feedback

---

## Why This Wins

1. **Painkiller, not vitamin** — Saves hours of manual work
2. **Network effects** — More restaurants = more workers = better matches
3. **Sticky** — Once hours are tracked here, hard to leave
4. **Scalable** — Same platform, many restaurants
5. **Defensible** — Data + relationships = moat

---

*Idea from Jakob — 2026-02-13*
