# ORGANIZATION.md - Workspace Structure Rules

*Keep it clean. Keep it hierarchical. No scatterbrain.*

---

## 🎯 Core Principle

**Project-specific research lives IN the project. General research lives in research/. No exceptions.**

---

## 📁 Folder Hierarchy Rules

### `/projects/` — Main Projects ONLY

**Rule:** Keep as many active projects as you're actually working on. Archive only when truly dead/complete.

**The real goal:** Prevent project sprawl (one project per domain, use sub-folders for variations).

**Structure per project:**
```
projects/
├── youtube/                    ← Main project
│   ├── README.md              # Project overview + current status
│   ├── video-ideas/           # Sub-project: Video concepts
│   ├── scripts/               # Sub-project: Written scripts
│   ├── research/              # ← YouTube-specific research HERE
│   ├── assets/                # Thumbnails, graphics
│   ├── notes/                 # Meeting notes, ideas
│   └── analytics/             # Performance data
│
├── 3dje-boligsektor/          ← Main project
│   ├── README.md
│   ├── PHASE2-TOMTESOURCING/  # Sub-project
│   ├── research/              # ← Boligsektor research HERE
│   ├── scripts/               # Automation scripts
│   └── references/            # External docs
│
└── freddy-research-agent/     ← Tool project (minimal)
    ├── README.md
    └── src/
```

**Forbidden:**
- ❌ `projects/youtube-video-1/`
- ❌ `projects/youtube-video-2/`
- ❌ `projects/youtube-thumbnails/`

**Correct:**
- ✅ `projects/youtube/video-ideas/video-1.md`
- ✅ `projects/youtube/assets/thumbnails/`

---

### `/research/` — General Research ONLY

**Rule:** Only cross-cutting topics not tied to one project.

**Allowed:**
- AI orchestration patterns (applies to multiple projects)
- AI company management (general knowledge)
- Morning brief research (system-wide)

**Forbidden:**
- ❌ 3dje-boligsektor API docs → Belongs in `projects/3dje-boligsektor/research/`
- ❌ YouTube algorithm research → Belongs in `projects/youtube/research/`

---

### `/memory/` — Daily Logs ONLY

**Rule:** Raw session logs. No project work here.

```
memory/
├── 2026-02-01.md              # What happened today
├── 2026-02-02.md
└── ...
```

---

### `/skills/` — Reusable Tools ONLY

**Rule:** Things that work across projects.

```
skills/
├── auto-updater/
├── byterover/
└── clawddocs/
```

---

## 🔬 Deep Research Rules

### When Research is Requested:

**Step 1: Identify the project**
```
"Research YouTube algorithm changes" → Project: youtube
"Research Kartverket API" → Project: 3dje-boligsektor
"Research AI orchestration" → General → research/
```

**Step 2: Store in correct location**
```
# Project-specific:
projects/youtube/research/algorithm-changes-2026.md
projects/3dje-boligsektor/research/kartverket-api-deep-dive.md

# General:
research/ai-orchestration-patterns/RESEARCH-SUMMARY.md
```

**Step 3: Update project README**
```markdown
## Research
- [algorithm-changes-2026.md](research/algorithm-changes-2026.md) — Deep research on YouTube algo
```

---

## 🎬 Video Projects (YouTube Specific)

**Rule:** One main `youtube/` project. Videos are sub-folders or files.

**Option A: Files for simple videos**
```
youtube/
├── video-ideas/
│   ├── depression-cured-gut-health.md
│   ├── fitness-transformation.md
│   └── cabin-business-ai.md
```

**Option B: Folders for complex videos**
```
youtube/
├── video-ideas/
│   └── depression-cured-gut-health/
│       ├── script.md
│       ├── research/
│       ├── b-roll-list.md
│       └── thumbnail-notes.md
```

**Decision criteria:**
- Simple talking head video → File
- Documentary with B-roll, multiple sources → Folder

---

## 📊 Project Limits

**Guidelines (not hard limits):**
- Keep sub-folders **organized** per project (use sub-folders for variations, not new projects)
- Max **10 files** per folder before creating sub-folders (keeps things scannable)
- Archive **completed/dead** projects to `archive/` when truly done

**When things feel cluttered:**
1. Check if "projects" are actually sub-folders of existing projects
2. Archive completed/abandoned projects to `archive/`
3. Ensure research lives in project folders, not scattered

---

## 🧹 Workspace Hygiene

### What Triggers Auto-Cleanup:

| Situation | Action |
|-----------|--------|
| Research file created | Ensure it's in correct project folder |
| New project idea | Check if it fits existing project first |
| Duplicate folders found | Merge and redirect |
| Empty folders exist | Delete or flag |
| Dead/abandoned projects | Move to archive/ |

### Weekly Health Check (via cron):
```
1. Check for empty folders (delete)
2. Check for duplicate names (merge)
3. Verify research files are in project folders
4. Flag abandoned projects (no activity in 30+ days)
5. Report: "Workspace health: ✅ Clean" or "⚠️ Issues found"
```

---

## 🚨 Anti-Patterns (FORBIDDEN)

❌ **Project sprawl:** `youtube-video-1/`, `youtube-video-2/`, `youtube-video-3/`  
✅ **Correct:** `youtube/video-ideas/video-1.md`, `video-2.md`, `video-3.md`

❌ **Research orphan:** `research/kartverket-api.md` (belongs to 3dje-boligsektor)  
✅ **Correct:** `projects/3dje-boligsektor/research/kartverket-api.md`

❌ **Duplicate info:** Same research in both `research/` and `projects/x/research/`  
✅ **Correct:** One source of truth in project folder, link from elsewhere

❌ **Deep nesting:** `projects/youtube/videos/series-1/episodes/episode-1/notes/`  
✅ **Correct:** `projects/youtube/scripts/series-1-episode-1.md`

---

## 📝 File Naming Conventions

**Projects:** kebab-case, descriptive
```
youtube/
3dje-boligsektor/
freddy-research-agent/  ✓
FreddyResearchAgent/    ✗
```

**Research files:** DATE-topic.md or topic-DATE.md
```
2026-02-01-youtube-algorithm.md
youtube-algorithm-2026-02-01.md
```

**Video ideas:** descriptive-kebab-case.md
```
how-i-cured-depression-gut-health.md
cabin-business-ai-automation.md
```

---

## 🎯 Summary

**One sentence:** Every file has one home. Project files in projects. Research in project folders. General research in research/. No exceptions.

**Check before creating:**
1. Does this belong to an existing project? → Put it there
2. Is this general knowledge? → research/
3. Is this a new main project? → Create it (don't force-fit into wrong project)
4. Is this a sub-task? → Create sub-folder, not new project

---

*This keeps the workspace clean, context rich, and scatterbrain-free.*
