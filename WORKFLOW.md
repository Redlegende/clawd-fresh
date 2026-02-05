# WORKFLOW.md - How We Work Together

*Automatic tracking rules. No mental notes. Everything gets written down.*

---

## 🎯 The Golden Rule

**After EVERY significant action → Update files**

Don't wait to be asked. Don't say "I'll remember." Write it immediately.

## 🔄 CLOSE THE LOOP (CRITICAL)

**What this means:** When work is done, the loop isn't closed until files are updated.

**Close the loop on:**
- ✅ Code written → PROJECTS.md updated
- ✅ Task completed → TODO.md moved to DONE
- ✅ Lesson learned → MEMORY.md updated
- ✅ Bug fixed → FAILURE_LOG.md updated
- ✅ Decision made → decisions.md updated

**Never say:** "I'll update the files later" → Do it NOW.
**Never say:** "Should I update the files?" → You should have already done it.

**The test:** If you left now, would the files reflect reality? If not, the loop is open.

---

## 📋 Automatic File Updates (Triggers)

### When I Write Code → Update PROJECTS.md
**Trigger:** Any coding work, script, or implementation

**Action:**
1. Read current PROJECTS.md
2. Update the project status section
3. Mark what's now "Working" vs "Next"
4. Add any new next steps discovered

**Example:**
```
Before: "Status: Building login feature"
After: "Status: ✅ Login complete | Next: Password reset"
```

---

### When I Complete a Task → Update TODO.md
**Trigger:** Task is done, working, or no longer needed

**Action:**
1. Move task from 🔴 NOW → 🟢 DONE
2. Add date completed
3. Pull next task from 🟡 NEXT → 🔴 NOW if dependencies cleared
4. Add any new tasks discovered during work

**Example:**
```
BEFORE:
🔴 NOW: Build OAuth flow

AFTER:
🔴 NOW: Test OAuth connection (pulled from NEXT)
🟢 DONE:
- 2026-02-01: Build OAuth flow
```

---

### When I Learn Something Important → Update MEMORY.md + ByteRover
**Trigger:** New integration, discovered pattern, bug fix, lesson learned

**Action:**
1. Add to relevant section in MEMORY.md
2. Include context: what, why, how
3. If it replaces old info → update/remove old info
4. **Curate to ByteRover:** `brv curate "Summary" -f source-files`

**Example:**
```
## ⚠️ Lessons Learned

### 2026-02-01: OAuth Scopes Issue
**Problem:** iGMS OAuth failed with "invalid scope"
**Solution:** Use `read_bookings` not `bookings_read`
**Reference:** See `projects/Kvitfjellhytter/oauth-notes.md`
```

**ByteRover:**
```bash
brv curate "iGMS OAuth uses read_bookings scope not bookings_read" -f oauth-notes.md
```

---

### When We Discuss Plans → Update Both TODO + PROJECTS
**Trigger:** Planning conversations, decisions, priority changes

**Action:**
1. Add new tasks to TODO.md immediately
2. Update PROJECTS.md status/next-actions
3. If priorities shift → reorder TODO.md 🔴 NOW section

---

## 🔄 Session-End Ritual (Before Saying Goodbye)

**When you say:** "that's all for now" / "I'm done" / "let's stop here"

**I MUST:**
1. **Summarize what we did this session:**
   - Files changed
   - Tasks completed
   - New tasks discovered

2. **Update status files:**
   - TODO.md — move completed tasks to DONE
   - PROJECTS.md — update project statuses
   - MEMORY.md — any lessons learned

3. **Curate to ByteRover** (if brv is running):
   - `brv curate "Key decisions/learnings" -f relevant-files`
   - `printf 'y\n' | brv push` (if significant changes)

4. **Create daily note** in `memory/YYYY-MM-DD.md`:
   - Raw log of session
   - Links to files changed
   - Context for future me

5. **State what's next:**
   - Next task from TODO.md 🔴 NOW
   - Any blockers or dependencies

---

## 🧠 How I Track "What We Just Did"

### During Session:
- I remember recent context (current conversation)
- I check files to see previous state
- I compare before/after to understand progress

### Between Sessions:
- **Daily notes** (`memory/YYYY-MM-DD.md`) = raw session logs
- **TODO.md DONE section** = completed tasks with dates
- **PROJECTS.md** = current status of each project
- **MEMORY.md** = distilled lessons and context

### To Pick Up Where We Left Off:
1. Read TODO.md 🔴 NOW section
2. Read PROJECTS.md for project context
3. Check yesterday's memory note
4. Identify the next logical action

---

## 📊 Progress Tracking System

### For Each Project:
| Status | Meaning | Action |
|--------|---------|--------|
| 🔴 **Blocked** | Can't proceed | State blocker, what's needed |
| 🟡 **In Progress** | Actively working | Update % complete, next sub-task |
| 🟢 **Working** | Functional, needs polish | List what's working vs todo |
| ⏳ **Pending** | Not started | Dependencies? When to start? |
| ✅ **Complete** | Done | Archive, link to result |

### Automatic Status Updates:
- When I say "it's working" → Change status to 🟢
- When I hit an error I can't fix → Change to 🔴 + document blocker
- When I start work → Change to 🟡
- When you confirm it's done → Change to ✅ + move to DONE

---

## 🎯 Determining "What's Next"

### Decision Tree:
```
Is there a 🔴 NOW task in TODO.md?
├── Yes → That's next
│       └── Is it blocked?
│           ├── Yes → Pull from 🟡 NEXT or report blocker
│           └── No → Do it
└── No → 
    ├── Check PROJECTS.md for active projects
    │   └── Any with "Next:" items?
    │       ├── Yes → Add to TODO.md 🔴 NOW
    │       └── No → Ask you what's priority
    └── Ask: "What should we work on next?"
```

### Automatic Next-Step Detection:
When I finish something, I should:
1. See if it unblocks something in 🟡 NEXT
2. Move unblocked task → 🔴 NOW
3. Tell you: "X is done. Next up: Y"

---

## ✍️ File Update Checklist (Mental or Actual)

After every session or significant work:

- [ ] **TODO.md** — tasks moved, new tasks added
- [ ] **PROJECTS.md** — statuses updated, next-actions current
- [ ] **MEMORY.md** — lessons, new integrations, important context
- [ ] **ByteRover** — curate key learnings (`brv curate ...`)
- [ ] **Daily note** (`memory/YYYY-MM-DD.md`) — session log
- [ ] **SOUL.md** — if my identity/role changed
- [ ] **USER.md** — if your preferences/situation changed

---

## 🚨 Anti-Patterns (NEVER DO)

❌ **"I'll update that later"** → No. Do it now.  
❌ **"The user will remind me"** → No. Take initiative.  
❌ **Mental notes** → Write it or it didn't happen.  
❌ **"It's in the chat history"** → Chat history gets lost. Files persist.  

---

## 💡 Example Session Flow

**User:** "Build me a script to parse PDF hours"

**Me (during):**
1. Build script in `hours/automation/parse-pdf.py`
2. Test it
3. Say "it's working"

**Me (end of session):**
> "✅ Created `hours/automation/parse-pdf.py` — tested and working
> 
> **Updated:**
> - PROJECTS.md: Hour Tracking → Status: 🟢 Phase 1B started
> - TODO.md: Added 'Test PDF parsing with real file' to NEXT
> - MEMORY.md: Added poppler installation requirement
> - memory/2026-02-01.md: Session log with file links
> 
> **Next up:** Test with a real PDF from Fåvang Varetaxi"

---

## 🎬 Bottom Line

**You shouldn't have to ask me to update files. I should just do it.**

If I ever say "should I update the files?" — the answer is always yes, and I should have already done it.

---

*This is a living document. If it's not working, tell me and we'll fix the system.*
