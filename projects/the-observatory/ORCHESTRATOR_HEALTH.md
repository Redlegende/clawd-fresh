# ORCHESTRATOR HEALTH SYSTEM

**Purpose:** Monitor my own performance and catch failures before they cascade.

---

## 🩺 Vital Signs

| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| Context Usage | N/A | >80% | Check before each major task |
| Active Tasks | N/A | >10 | Alert user, prioritize |
| Error Rate (1h) | N/A | >3 | Pause, investigate |
| Unverified "Done" | N/A | >0 | Verify before reporting |

---

## ⚠️ Self-Checks

### Before Delegating
- [ ] Task is clear (SMART criteria)
- [ ] Right agent assigned
- [ ] No conflicts with active tasks
- [ ] Success criteria defined
- [ ] Timeout set

### After Delegating
- [ ] Agent acknowledged
- [ ] Monitoring timeout
- [ ] Verification plan ready

### Before Reporting "Done"
- [ ] Result is visible (URL/file/data)
- [ ] Matches original goal
- [ ] No side effects
- [ ] Failure log updated

### End of Session
- [ ] TODO.md updated
- [ ] Incomplete tasks noted
- [ ] Decisions documented
- [ ] Failure log updated

---

## 🚨 Escalation Triggers

| Scenario | Action |
|----------|--------|
| Same error twice in one session | Stop, research, ask user |
| Agent fails 3x in a row | Pause agent, escalate |
| Contradictory instructions | Ask for clarification |
| Confidence < 70% | Ask user before acting |
| Task takes >30 min | Status update to user |

---

## 📊 Decision Log

| Date | Decision | Context | Why |
|------|----------|---------|-----|
| 2026-02-03 | Use Kimi 2.5 for all agents | User preference | Quality over cost |
| 2026-02-03 | Sub-agent architecture | Scale, robustness | Delegate coding/DevOps/data |
| 2026-02-03 | Token persistence for Garmin | MFA too manual | Auto-fetch from Gmail |

---

## 🔧 Agent Architecture

| Agent | Model | Tasks | Status |
|-------|-------|-------|--------|
| Code Agent | Kimi 2.5 | TypeScript, React, fixes | Active |
| DevOps Agent | Kimi 2.5 | Vercel, deployments | Active |
| Data Agent | Kimi 2.5 | SQL, imports, reports | Spawning |
| QA Agent | Kimi 2.5 | Testing, verification | Spawning |
| Research Agent | Kimi 2.5 | Summaries, transcription | Active |

---

## 📝 Current Session State

**Started:** 2026-02-03  
**Active Tasks:**
1. 🟡 Garmin 30-day fetch — MFA needed
2. 🟡 Sub-agent setup — In progress
3. 🟡 Orchestrator improvements — In progress

**Decisions Made:**
- Use Kimi 2.5 exclusively
- Implement failure logging
- Daily sync at 8:30 AM
- Token persistence for Garmin

**Next Actions:**
1. Complete Garmin fetch with MFA
2. Spawn Data and QA agents
3. Update all documentation
