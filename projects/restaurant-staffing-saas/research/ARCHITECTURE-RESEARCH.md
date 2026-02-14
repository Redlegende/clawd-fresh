# Restaurant Staffing SaaS - Architecture & Competitor Research

**Date:** February 13, 2026  
**Research Focus:** Norwegian market competitors & technical architecture for multi-tenant SaaS

---

## Executive Summary

The Norwegian restaurant staffing/scheduling market has several established players but shows clear opportunity for a modern, Norway-focused SaaS solution. Key findings:

**Market Gap:** Most international solutions (Deputy, Planday, 7shifts) don't fully address Norwegian labor regulations, language preferences, and local payment practices. Staffers.no exists but focuses on staffing marketplace rather than pure scheduling.

**Technical Recommendation:** Supabase + Next.js 16 + Vercel provides an excellent modern stack for multi-tenant SaaS with strong TypeScript support, real-time capabilities, and cost-effective scaling.

**Cost Projection:** Starting costs ~$50-150/month at small scale, scaling to ~$1,500-3,000/month at 1,000 restaurants.

---

## 1. Norwegian Competitor Analysis

### 1.1 Local Norwegian Competitors

#### Staffers (staffers.no)
| Attribute | Details |
|-----------|---------|
| **Website** | https://www.staffers.no |
| **Type** | Restaurant staffing marketplace + recruitment tool |
| **Founded** | 2018 (Oslo-based) |
| **Target** | Restaurants, bars, nightclubs in Norway |
| **Model** | Platform connecting workers with shifts; NOT pure scheduling |

**Key Features:**
- Staffing marketplace for temporary workers
- Digital contracts signed in-app
- Wage information sent to employers after work completion
- Plugin solution for existing scheduling/HR systems
- Oslo-focused (beta launch), queue system for restaurants

**Strengths:**
- Norwegian founders with restaurant industry experience
- Understands local market needs
- Handles Norwegian employment contracts
- No traditional staffing agency overhead

**Weaknesses vs Our Concept:**
- Focuses on staffing marketplace, not scheduling software
- Limited to Oslo area (as of research date)
- Doesn't provide comprehensive scheduling/HR features
- No apparent integration with major POS systems

**Pricing:** Not publicly disclosed (likely commission-based on filled shifts)

---

### 1.2 Nordic/Nearby Competitors

#### Planday (Denmark - Acquired by Xero 2021)
| Attribute | Details |
|-----------|---------|
| **Website** | https://www.planday.com |
| **Type** | Employee scheduling + workforce management |
| **Pricing** | Starts at ~$2/user/month |
| **Users** | 400,000+ users across Europe, Australia, US |
| **Headquarters** | Copenhagen, Denmark |

**Key Features:**
- Schedule creation and sharing
- Mobile clock-in/out
- Shift swapping and handovers
- Leave management with TOIL/overtime policies
- Compliance warnings for labor regulations
- Payroll integrations
- ISO 27001 certified

**Strengths:**
- Strong Nordic presence and understanding
- Xero integration for accounting
- Multi-location support
- Robust compliance features

**Weaknesses vs Our Concept:**
- Danish company (less Norway-specific)
- General workforce tool, not restaurant-specific
- No temporary staffing marketplace component
- Per-user pricing can get expensive

---

### 1.3 International Competitors

#### Deputy
| Attribute | Details |
|-----------|---------|
| **Website** | https://www.deputy.com |
| **Pricing** | Lite: $5/user/mo, Core: $6.50/user/mo, Pro: $9/user/mo |
| **Free Trial** | Yes |
| **Target** | All shift-based industries |

**Key Features:**
- AI-powered schedule optimization
- Demand forecasting
- Biometric time clocking
- Labor law compliance
- Micro-scheduling (multiple areas per shift)
- Payroll & HR integrations
- Mobile apps (iOS/Android)
- Add-ons: HR ($2/user), Messaging+ ($1.95/user), Analytics+ ($1.50/user)

**Strengths:**
- Very feature-rich
- AI/ML for scheduling optimization
- Strong compliance tools
- Multi-location hierarchies

**Weaknesses vs Our Concept:**
- Expensive at scale ($9+/user/month)
- Not restaurant-specific
- Complex pricing with many add-ons
- US/Australian company (less EU-focused)

---

#### 7shifts (Canada - Restaurant-Specific)
| Attribute | Details |
|-----------|---------|
| **Website** | https://www.7shifts.com |
| **Pricing** | Comp (Free): 1 location, 30 employees; Entrée: $34.99/mo; The Works: $76.99/mo |
| **Target** | Restaurants specifically (bars, cafes, franchises) |

**Key Features:**
- Restaurant-specific scheduling
- Time clocking (7punches)
- Tip management (pooling & payouts)
- Payroll processing
- Team communication
- Labor compliance
- Task management
- Manager log book
- POS integrations (Toast, Square, etc.)

**Strengths:**
- Built specifically for restaurants
- Free plan for small operations
- Per-location pricing (not per-user)
- Strong POS integrations
- 14-day free trial on paid plans

**Weaknesses vs Our Concept:**
- Canadian company (less EU/Norway focus)
- No Norwegian language support mentioned
- No temporary staffing component
- Limited local compliance features for Norway

---

#### Homebase
| Attribute | Details |
|-----------|---------|
| **Website** | https://www.joinhomebase.com |
| **Pricing** | Basic: FREE (1 location, up to 10-20 employees); Essentials: $24-30/mo; Plus: $56-70/mo; All-in-One: $96-120/mo |
| **Free Tier** | Generous free plan |

**Key Features:**
- Scheduling & time tracking
- Team communication
- POS integration
- Payroll add-on ($39/mo + $6/employee)
- AI-powered scheduling (Plus plan)
- PTO & time-off controls
- Labor cost management
- HR & compliance

**Strengths:**
- Excellent free tier
- Per-location pricing (not per-user)
- 20% discount for annual billing
- Strong for small businesses

**Weaknesses vs Our Concept:**
- Limited to 10 employees on free plan
- US-focused company
- No Norwegian language/labor law support
- No staffing marketplace features

---

#### Connecteam
| Attribute | Details |
|-----------|---------|
| **Website** | https://connecteam.com |
| **Pricing** | Basic: $29/mo (first 30 users); Advanced: $49/mo; Expert: $99/mo |
| **Addtl Users** | $0.80-$4.20 per user depending on plan |
| **Free Tier** | Up to 10 users |

**Key Features:**
- Operations Hub: Time Clock, Job Scheduling, Forms, Tasks
- Communications Hub: Chat, Updates, Directory, Surveys
- HR Hub: Time Off, Courses, Documents, Recognition
- Geofencing (up to unlimited sites)
- Auto-scheduling
- API access (Expert+)
- SSO, 2FA (Enterprise)

**Strengths:**
- All-in-one platform
- Fixed price for first 30 users
- 14-day free trial
- Very customizable

**Weaknesses vs Our Concept:**
- Israeli/US company
- Not restaurant-specific
- Complex hub-based pricing
- No temporary staffing marketplace

---

### 1.4 Traditional Staffing Agencies (Norway)

| Company | Type | Digital Platform |
|---------|------|------------------|
| Manpower | Global staffing agency | Basic web portal |
| Adecco | Global staffing agency | Basic web portal |
| Jobzone | Norwegian recruitment | Traditional |
| ARPI Bemanning | Norwegian staffing | Limited digital |
| Bemlo | Healthcare staffing | Digital/AI-driven |
| NH Bemanning | Construction staffing | Limited digital |

**Observation:** Traditional staffing agencies rely heavily on manual processes. Staffers.no is the only modern digital platform specifically for restaurants.

---

## 2. Competitor Comparison Table

| Feature | Staffers | Planday | Deputy | 7shifts | Homebase | Connecteam |
|---------|----------|---------|--------|---------|----------|------------|
| **Scheduling** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Time Clock** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Staffing Marketplace** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Restaurant-Specific** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Norwegian Focus** | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **Free Tier** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ (10 users) |
| **Pricing Model** | Commission | Per user | Per user | Per location | Per location | Per hub |
| **Mobile App** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **POS Integration** | ❌ | Limited | Limited | ✅ | ✅ | Limited |
| **AI Scheduling** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **GDPR/EU Focus** | ✅ | ✅ | ⚠️ | ❌ | ❌ | ⚠️ |

**Pricing Comparison (50 employees, 1 location):**

| Solution | Monthly Cost |
|----------|--------------|
| Staffers | Unknown (likely %) |
| Planday | ~$100 ($2 x 50) |
| Deputy (Core) | ~$325 ($6.50 x 50) |
| 7shifts (The Works) | ~$77 |
| Homebase (Plus) | ~$56-70 |
| Connecteam (Advanced) | ~$99 + $50 = ~$149 |

---

## 3. System Architecture Research

### 3.1 Recommended Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Next.js 16 │  │  React 19    │  │  Tailwind + shadcn   │   │
│  │   (App Dir)  │  │  Server      │  │  UI Components       │   │
│  │              │  │  Components  │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                         API LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Next.js API │  │  tRPC        │  │  Webhooks (Stripe,   │   │
│  │  Routes      │  │  (optional)  │  │  integrations)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    SUPABASE PLATFORM                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │    │
│  │  │  PostgreSQL  │  │  Auth        │  │  Realtime    │    │    │
│  │  │  (Multi-ten) │  │  (RLS)       │  │  (WebSockets)│    │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │    │
│  │  ┌──────────────┐  ┌──────────────┐                      │    │
│  │  │  Storage     │  │  Edge        │                      │    │
│  │  │  (Files)     │  │  Functions   │                      │    │
│  │  └──────────────┘  └──────────────┘                      │    │
│  └──────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Vercel      │  │  Upstash     │  │  Monitoring          │   │
│  │  (Hosting)   │  │  (Redis)     │  │  (Vercel/Sentry)     │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Database Schema for Multi-Tenant SaaS

#### Row Level Security (RLS) Approach

```sql
-- Tenant isolation using RLS policies
-- Each table has a 'tenant_id' column

-- Example: shifts table
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    employee_id UUID REFERENCES employees(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location_id UUID REFERENCES locations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Users can only see their tenant's data
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON shifts
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Set tenant context per request
SET LOCAL app.current_tenant = 'tenant-uuid-here';
```

#### Recommended Schema Structure

```sql
-- Core tenant table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- subdomain
    plan TEXT DEFAULT 'free', -- free, basic, pro, enterprise
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User accounts (can belong to multiple tenants)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant memberships (junction table)
CREATE TABLE tenant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- owner, admin, manager, member
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Restaurant locations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    timezone TEXT DEFAULT 'Europe/Oslo',
    opening_hours JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id), -- optional: if employee has login
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT, -- server, bartender, cook, etc.
    hourly_rate DECIMAL(10,2),
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    break_duration_minutes INTEGER DEFAULT 30,
    status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_until DATE
);

-- Time-off requests
CREATE TABLE time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
```

### 3.3 Tenant Isolation Strategies

| Strategy | Pros | Cons | Best For |
|----------|------|------|----------|
| **RLS (Recommended)** | Single schema, easy backups, scale efficiently | Requires careful policy management | Most SaaS applications |
| **Schema per tenant** | Complete isolation, easier GDPR deletion | Complex migrations, resource overhead | High compliance requirements |
| **Database per tenant** | Maximum isolation | Expensive, harder to maintain | Enterprise/very large tenants |

**Recommendation:** Start with RLS approach. It provides excellent isolation while maintaining operational simplicity.

### 3.4 Real-Time Sync Architecture

```
Client (React) ←→ Supabase Realtime ←→ PostgreSQL
                          ↓
                   WebSocket Connection
                          ↓
    ┌─────────────────────┼─────────────────────┐
    ↓                     ↓                     ↓
 Shift Updates      Availability Changes    Notifications
```

**Implementation:**
```typescript
// Supabase Realtime subscription
const subscription = supabase
  .channel('shifts')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'shifts',
      filter: `tenant_id=eq.${tenantId}`
    },
    (payload) => {
      // Handle real-time updates
      updateShiftInUI(payload.new);
    }
  )
  .subscribe();
```

**When to use Realtime vs Polling:**
- **Realtime (WebSockets):** Shift swaps, notifications, live schedule updates
- **Polling (30-60s):** Less critical data like reports, analytics
- **SWR/React Query:** Standard data fetching with caching

### 3.5 File Storage Architecture

| Option | Use Case | Cost |
|--------|----------|------|
| **Supabase Storage** | Default choice, integrated | Included in plan |
| **AWS S3 + CloudFront** | High volume, CDN needed | ~$0.023/GB |
| **Cloudflare R2** | S3-compatible, no egress fees | $0.015/GB |

**Recommendation:** Start with Supabase Storage. It's included in the price and well-integrated. Consider migrating to R2 at very high scale (1000+ tenants with heavy file usage).

---

## 4. Cost Analysis

### 4.1 Supabase Pricing (2025)

| Plan | Price | Database | Storage | Bandwidth | Best For |
|------|-------|----------|---------|-----------|----------|
| **Free** | $0 | 500 MB | 1 GB | 2 GB | Development, testing |
| **Pro** | $25/mo | 8 GB | 100 GB | 250 GB | Production startup |
| **Team** | $599/mo | Unlimited | 1 TB | 5 TB | Growing business |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited | Large scale |

**Add-ons:**
- Additional compute: $0.01344/hour (~$10/mo per add-on)
- Additional storage: $0.021/GB/month
- Additional bandwidth: $0.09/GB
- Real-time connections: 200 (free), 1000 (pro), 10,000 (team)

### 4.2 Vercel Pricing (2025)

| Plan | Price | Bandwidth | Function Execution | Best For |
|------|-------|-----------|-------------------|----------|
| **Hobby** | $0 | 100 GB | 125k/ea ( Hobby ) | Development |
| **Pro** | $20/mo | 1 TB | 1M | Small production |
| **Enterprise** | Custom | Custom | Custom | Large scale |

**Add-ons:**
- Additional bandwidth: $40 per 100 GB
- Additional function execution: $0.15 per million

### 4.3 Authentication Costs

| Provider | Cost | Notes |
|----------|------|-------|
| **Supabase Auth** | Included | 50,000 monthly active users on Pro |
| **Auth0** | $23/mo + $0.035/MAU | Enterprise features |
| **Clerk** | $25/mo + $0.02/MAU | Great React integration |
| **WorkOS** | Custom | Enterprise SSO focus |

**Recommendation:** Supabase Auth is sufficient to start. Consider Clerk for better UX or WorkOS for enterprise SSO later.

### 4.4 Monitoring & Logging

| Service | Cost | Best For |
|---------|------|----------|
| **Vercel Analytics** | Included in Pro | Basic monitoring |
| **Sentry** | $26/mo (5k errors) | Error tracking |
| **LogRocket** | $99/mo | Session replay |
| **Datadog** | $15/host/mo | Full observability |

**Recommendation:** Start with Vercel Analytics + Sentry free tier. Upgrade as needed.

### 4.5 Total Cost Estimates by Scale

#### Scenario A: 10 Restaurants (Startup Phase)

| Service | Monthly Cost |
|---------|--------------|
| Supabase Pro | $25 |
| Vercel Pro | $20 |
| Sentry | $0 (free tier) |
| Email (Resend) | $0 (3,000 free/mo) |
| **Total** | **~$45-75/mo** |

#### Scenario B: 100 Restaurants (Growth Phase)

| Service | Monthly Cost |
|---------|--------------|
| Supabase Pro + compute add-on | $50 |
| Vercel Pro | $20 |
| Sentry | $26 |
| Email (Resend) | $20 |
| Additional storage/bandwidth | $30 |
| **Total** | **~$150-200/mo** |

#### Scenario C: 1,000 Restaurants (Scale Phase)

| Service | Monthly Cost |
|---------|--------------|
| Supabase Team | $599 |
| Vercel Enterprise | $200+ |
| Sentry | $80 |
| Email (Resend) | $100 |
| CDN/Storage overages | $200 |
| Monitoring (Datadog) | $150 |
| **Total** | **~$1,500-2,000/mo** |

### 4.6 Cost Per Restaurant

| Scale | Monthly Cost | Cost/Restaurant |
|-------|--------------|-----------------|
| 10 restaurants | $75 | $7.50 |
| 100 restaurants | $200 | $2.00 |
| 1,000 restaurants | $2,000 | $2.00 |
| 10,000 restaurants | $12,000 | $1.20 |

**Key Insight:** Marginal costs decrease significantly with scale due to shared infrastructure.

---

## 5. Multi-Tenant Best Practices

### 5.1 Database Design Patterns

**1. Shared Database with RLS (Recommended)**
- All tenants in same tables
- RLS policies enforce isolation
- Easiest to maintain and backup
- Best for 99% of SaaS applications

**2. Schema-per-Tenant**
```sql
-- Create schema for each tenant
CREATE SCHEMA tenant_123;
SET search_path TO tenant_123, public;
```
- Better isolation than RLS alone
- More complex migrations
- Consider for high-compliance industries

**3. Database-per-Tenant**
- Maximum isolation
- Most expensive
- Only for enterprise customers requiring it

### 5.2 Data Backup Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    BACKUP LAYERS                           │
├────────────────────────────────────────────────────────────┤
│ Layer 1: Supabase Automated Backups                        │
│ - Daily backups (retention: 7 days on Pro)                 │
│ - Point-in-time recovery (PITR) available                  │
│ - Stored in same region                                    │
├────────────────────────────────────────────────────────────┤
│ Layer 2: Self-Managed Backups                              │
│ - Weekly full dumps to S3/R2                               │
│ - 90-day retention minimum                                 │
│ - Cross-region storage recommended                         │
├────────────────────────────────────────────────────────────┤
│ Layer 3: Per-Tenant Exports (GDPR compliance)              │
│ - On-demand data export capability                         │
│ - Automated deletion workflows                             │
│ - Audit trail for all exports                              │
└────────────────────────────────────────────────────────────┘
```

**Backup Automation:**
```bash
# Weekly backup script (run via GitHub Actions or similar)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
gzip backup_*.sql
aws s3 cp backup_*.sql.gz s3://backups-bucket/
```

### 5.3 GDPR Compliance for Norway/EU

**Key Requirements:**

| Requirement | Implementation |
|-------------|----------------|
| **Data Processing Agreement (DPA)** | Sign DPA with Supabase (available) |
| **Data Residency** | Use EU region (Frankfurt) for Supabase |
| **Right to Access** | Build data export feature |
| **Right to Deletion** | Automated tenant deletion workflow |
| **Consent Management** | Track consent in database |
| **Breach Notification** | 72-hour notification process |
| **Privacy by Design** | Minimize data collection |

**Technical Implementation:**

```typescript
// GDPR-compliant data export
async function exportTenantData(tenantId: string) {
  const tables = ['employees', 'shifts', 'time_off_requests'];
  const export_data = {};
  
  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .select('*')
      .eq('tenant_id', tenantId);
    export_data[table] = data;
  }
  
  return JSON.stringify(export_data, null, 2);
}

// GDPR-compliant deletion (right to be forgotten)
async function deleteTenantData(tenantId: string) {
  // Use CASCADE deletes in schema
  await supabase
    .from('tenants')
    .delete()
    .eq('id', tenantId);
  
  // Log deletion for audit
  await logDeletion(tenantId, new Date());
}
```

**Norway-Specific:**
- Datatilsynet is the supervisory authority
- Norwegian Personal Data Act supplements GDPR
- Fines up to 4% of global revenue or €20M
- Required to have a data protection officer if processing sensitive data at scale

---

## 6. Implementation Recommendations

### 6.1 MVP Feature Priority

**Phase 1: Core Scheduling (Months 1-2)**
- [ ] Multi-tenant setup with RLS
- [ ] Employee management
- [ ] Basic shift scheduling (drag-and-drop)
- [ ] Simple mobile view
- [ ] Norwegian language support

**Phase 2: Essential Features (Months 3-4)**
- [ ] Availability management
- [ ] Time-off requests
- [ ] Shift swapping
- [ ] Email/SMS notifications
- [ ] Basic reporting

**Phase 3: Advanced Features (Months 5-6)**
- [ ] Mobile apps (PWA or native)
- [ ] POS integrations (Deluxe, Trivec)
- [ ] AI scheduling suggestions
- [ ] Payroll export
- [ ] Multi-location support

### 6.2 Technical Decisions

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| **Frontend** | Next.js 16 App Router | Server components, streaming, SEO |
| **Database** | Supabase PostgreSQL | Managed, RLS, real-time |
| **Auth** | Supabase Auth | Integrated, Norwegian ID support |
| **Styling** | Tailwind + shadcn/ui | Rapid development, accessible |
| **State Management** | TanStack Query + Zustand | Server state + client state |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Testing** | Vitest + Playwright | Fast unit + E2E tests |
| **CI/CD** | GitHub Actions | Free, integrated |

### 6.3 Scaling Considerations

**Database:**
- Use connection pooling (PgBouncer built into Supabase)
- Implement read replicas when hitting limits
- Consider partitioning large tables by tenant_id

**Frontend:**
- Use React Server Components for reduced JS
- Implement proper caching strategies
- Lazy load non-critical features

**Infrastructure:**
- Enable Vercel Edge Network
- Use ISR for public pages
- Implement rate limiting at edge

---

## 7. Risk Assessment

### 7.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Supabase downtime** | Low | High | Implement read replicas; have backup DB provider identified |
| **Data breach** | Low | Critical | RLS policies, regular audits, encryption at rest |
| **Scaling issues** | Medium | Medium | Monitor early; plan for sharding at 10K+ tenants |
| **Vercel limits** | Low | Medium | Monitor bandwidth; plan for CDN if needed |
| **GDPR violation** | Low | Critical | Privacy by design; regular compliance audits |

### 7.2 Market Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Planday dominates** | Medium | High | Differentiate with temporary staffing marketplace |
| **Staffers expands** | Medium | Medium | Focus on pure scheduling; superior UX |
| **Price war** | High | Medium | Freemium model; focus on value, not price |
| **Slow adoption** | Medium | High | Strong onboarding; free tier; sales-led growth |

### 7.3 Mitigation Strategies

**Technical:**
1. Regular penetration testing
2. Automated backup verification
3. Load testing before major releases
4. Multi-region disaster recovery plan

**Business:**
1. Strong differentiation from competitors
2. Focus on Norwegian market first
3. Build network effects (marketplace component)
4. Excellent customer support

---

## 8. Key Takeaways

### Market Opportunity
- **Staffers** is the only Norway-focused solution but lacks pure scheduling features
- **Planday** (Danish) is the closest competitor but not restaurant-specific
- Opportunity exists for a modern, Norway-focused restaurant scheduling SaaS

### Technical Architecture
- **Supabase + Next.js + Vercel** is an excellent modern stack
- **RLS-based multi-tenancy** provides best balance of isolation and simplicity
- **GDPR compliance** is straightforward with proper planning

### Cost Projections
- **$45-75/month** to start (10 restaurants)
- **$150-200/month** at growth stage (100 restaurants)
- **$1,500-2,000/month** at scale (1,000 restaurants)

### Competitive Positioning
- Target small-to-medium restaurants (5-50 employees)
- Offer freemium model to compete with Homebase/7shifts
- Differentiate with Norwegian labor law compliance
- Consider adding temporary staffing marketplace later

---

## Sources

- Supabase Pricing: https://supabase.com/pricing
- Vercel Pricing: https://vercel.com/pricing
- Staffers: https://www.staffers.no
- Planday: https://www.planday.com
- Deputy: https://www.deputy.com/pricing
- 7shifts: https://www.7shifts.com
- Homebase: https://www.joinhomebase.com/pricing
- Connecteam: https://connecteam.com/pricing
- Horeca Nytt (Staffers article): https://www.horecanytt.no
- Datatilsynet (Norwegian DPA): https://www.datatilsynet.no

---

*Document created: February 13, 2026*  
*Next review: Quarterly or when major competitor changes occur*
