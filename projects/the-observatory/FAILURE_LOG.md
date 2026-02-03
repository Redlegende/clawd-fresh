# FAILURE LOG — Attempt Tracking System

**Purpose:** Never try the same fix twice without understanding why it failed.

---

## 📝 Log Format

| Date | Problem | What I Tried | Why It Failed | Next Attempt Should... |
|------|---------|--------------|---------------|------------------------|
| 2026-02-03 | iGMS OAuth | Fixed schema, env vars | User never tested it | Verify with user before marking "done" |
| 2026-02-03 | Google Calendar OAuth | Multiple patches | Schema mismatch, didn't diagnose first | Deep research BEFORE attempting fixes |
| 2026-02-03 | Garmin MFA | Manual code entry | Codes expire in 30s | Auto-fetch from Gmail or use saved tokens |

---

## 🛑 Before Attempting Any Fix

**Mandatory checklist:**
- [ ] Have I seen this exact error before? (Check this log)
- [ ] Do I understand the root cause?
- [ ] Have I verified the current state?
- [ ] Is there a simpler workaround?

**If any answer is NO → Research first, fix second**

---

## 🔍 Current Active Issues

| Issue | Status | Last Attempt | Next Action |
|-------|--------|--------------|-------------|
| Garmin 30-day fetch | 🟡 Data Agent on it | 2026-02-03 12:30 | Agent will request MFA if needed |
| iGMS OAuth | 🔴 Not tested | 2026-02-03 11:00 | User needs to click "Connect" and test |
| Observatory mobile UI | 🟡 Pending | — | Review after current fixes |
| Sub-agent setup | 🟡 In progress | 2026-02-03 12:30 | Data Agent + QA Agent spawning |

## 📝 Recent Failures

| Date | Problem | Attempted Fix | Why It Failed | Lesson |
|------|---------|---------------|---------------|--------|
| 2026-02-03 | Garmin MFA | Manual code entry | Codes expire in 30s, back-and-forth too slow | Implement auto-fetch from Gmail or token persistence |
| 2026-02-03 | OAuth fixes | Multiple patches without diagnosis | Didn't understand root cause first | Research BEFORE patching |
| 2026-02-03 | Sub-agent MFA | Agent couldn't extract from email | Gmail API limitations | Orchestrator needs to handle MFA extraction |

## ✅ QA Findings (2026-02-03)

| Page | Status | Issue | Fix In Progress |
|------|--------|-------|-----------------|
| Mission Control | ✅ Working | — | — |
| Fitness | ✅ Working | Real Garmin data showing | — |
| Research | ✅ Working | — | — |
| Kanban | ✅ Fixed | Now rendering tasks | Code Agent |
| Finance | ✅ Fixed | Now showing hour entries | Code Agent |
| Settings | ✅ Fixed | Now rendering content | Code Agent |

## ✅ Garmin 30-Day Fetch (2026-02-03)

| Metric | Status |
|--------|--------|
| Days fetched | 30 (Jan 9 - Feb 3) |
| Supabase rows | 30 ✅ |
| Tokens saved | ✅ Yes |
| MFA needed again | ❌ No (tokens last weeks) |

**Solution implemented:** Token persistence system. Daily sync at 8:30 AM will use saved tokens.

---

## ✅ Rules

1. **Log every fix attempt** — Even "quick" ones
2. **Wait for verification** — "It should work" ≠ "It works"
3. **Research before patch** — 5 min research saves 30 min debugging
4. **Never assume** — Always verify state before acting
