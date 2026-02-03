# Context Overflow Prevention System

## The Problem

Error: `Context overflow: prompt too large for the model`

When the combined size of:
- Conversation history
- Tool outputs  
- File contents
- System prompts

...exceeds the model's context window (~128K tokens for Kimi K2.5), the API rejects the request.

---

## Prevention Strategies

### 1. File Size Limits (IMPLEMENTED)

**Before reading any file, check size:**
```bash
ls -lh <file> | awk '{print $5}'
```

**Limits:**
| File Type | Max Size | Action if Exceeds |
|-----------|----------|-------------------|
| Text files | 50KB | Read first/last 1000 lines only |
| JSON/CSV | 100KB | Stream or paginate |
| Logs | 20KB | Tail only |
| SQL dumps | 30KB | Read in sections |

### 2. Conversation Reset Triggers

**Auto-reset when:**
- Context > 100K tokens (estimated)
- > 50 tool calls in session
- > 20 file reads
- Any single output > 30KB

**Implementation:**
```typescript
// Check before expensive operations
if (estimatedTokens > 100000) {
  await sessions_spawn({
    task: "Continue from here...",
    cleanup: "keep"
  });
  return "Spawning sub-agent to continue...";
}
```

### 3. Sub-Agent Delegation (CRITICAL)

**Rule: Any task that requires > 10 tool calls → delegate to sub-agent**

| Task Type | Handle in Main? | Delegate to Sub-Agent? |
|-----------|-----------------|------------------------|
| Quick answer, 1-2 tools | ✅ | ❌ |
| File edit, 3-5 tools | ✅ | ❌ |
| Build + deploy + verify | ❌ | ✅ |
| Research > 5 sources | ❌ | ✅ |
| Large refactor | ❌ | ✅ |
| Debug + fix + test | ❌ | ✅ |

### 4. Output Truncation

**Always truncate large outputs:**
```
read(path) → auto-truncated to 2000 lines / 50KB
exec(cmd) → show first 50 lines, offer full log
web_fetch(url) → maxChars parameter
```

### 5. Summary-First Pattern

**Before deep work, get summary:**
```
❌ Bad: read 50KB file, then read 30KB file, then read 20KB file...
✅ Good: summarize directory first, then read only needed files
```

---

## Detection System

### Early Warning Signs

| Indicator | Risk Level | Action |
|-----------|------------|--------|
| File read returns > 1000 lines | 🟡 Medium | Note for summary |
| 5+ consecutive tool calls | 🟡 Medium | Consider sub-agent |
| Error output > 500 lines | 🔴 High | Truncate immediately |
| Conversation > 30 messages | 🟡 Medium | Prepare for reset |
| Multiple file edits in loop | 🔴 High | Delegate |

### Auto-Recovery on Overflow

When overflow occurs:

1. **Immediate:** Acknowledge the error to user
2. **Compress:** Summarize what we were doing in < 500 tokens
3. **Delegate:** Spawn sub-agent with compressed context
4. **Continue:** Sub-agent completes the task
5. **Report:** Sub-agent reports back

---

## Implementation Checklist

- [x] Add token estimation before large operations
- [x] Enforce sub-agent delegation for complex tasks
- [x] Truncate all large outputs automatically
- [x] Add overflow detection to error handler
- [ ] Create `/reset` command for manual context clearing
- [ ] Add context usage to status command

---

## Emergency Recovery

If overflow happens mid-task:

```
User: "You got context overflow"

Me: "Overflow caught. Spawning sub-agent to continue from where we left off..."

[Spawn sub-agent with:]
"We were [brief summary of task]. Last completed step: [X]. 
Next step: [Y]. Files involved: [list]. Continue from here."
```

---

## Metrics to Track

| Metric | Target | Alert If |
|--------|--------|----------|
| Avg tokens per session | < 50K | > 80K |
| Tool calls per task | < 10 | > 15 |
| File reads per session | < 20 | > 30 |
| Sub-agent spawn rate | 20% | < 10% |

---

## Related Files

- `ORCHESTRATOR_HEALTH.md` — Current health status
- `FAILURE_LOG.md` — Track overflow occurrences
- `sessions_spawn` — Delegation tool
