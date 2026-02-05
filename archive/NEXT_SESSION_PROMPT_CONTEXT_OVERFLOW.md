# 🎯 NEXT SESSION PROMPT — Context Overflow Prevention

**Date:** 2026-02-03  
**Triggering User:** Jakob wants to investigate/fix context overflow issues  
**Goal:** Ensure sufficient context window for productive work

---

## Current State (Compressed)

**The Observatory:**
- URL: https://the-observatory-lxb444gor-redlegendes-projects.vercel.app
- Task Sync API: ✅ Working (webhook + notification system)
- Database: Supabase project vhrmxtolrrcrhrxljemp
- Tables: projects, tasks, fitness_metrics, finance_entries, research_notes, fred_notifications, task_sync_log

**Context Overflow Problem:**
- Error: "prompt too large for the model"
- Model: moonshot/kimi-k2.5 (~128K token limit)
- Current session likely > 80K tokens

**Prevention System Implemented:**
1. File size limits (>50KB → read sections)
2. Sub-agent delegation (>10 tool calls → delegate)
3. Output truncation (>500 lines → truncate)
4. Early warning triggers in ORCHESTRATOR_HEALTH.md

---

## What Jakob Wants

Investigate why context overflow keeps happening and ensure I have free context window for next session.

**Key Questions:**
1. What specific operations are eating context?
2. Are there hidden memory leaks in tool outputs?
3. Should we implement automatic session reset triggers?
4. Better compression strategies?

---

## Files to Reference

| File | Why |
|------|-----|
| `docs/CONTEXT_OVERFLOW_PREVENTION.md` | Prevention strategies |
| `projects/the-observatory/ORCHESTRATOR_HEALTH.md` | Vital signs tracking |
| `projects/the-observatory/FAILURE_LOG.md` | Error patterns |

---

## Actions to Take

1. Read the prevention doc and health system
2. Analyze recent failure patterns
3. Propose specific fixes
4. Implement monitoring if needed

---

**Start with:** "Jakob, I'm looking into the context overflow issue. Let me check our current prevention systems and identify what's causing the bloat..."
