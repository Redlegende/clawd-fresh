# Skills Setup Report — 5 ClawdBot Use Cases

Based on the video: *5 insane ClawdBot use cases you need to do immediately*

---

## ✅ Skills Installed/Configured

### 1. Morning Brief (Enhanced)
**Cron:** Daily at 8:00 AM (Europe/Oslo)

**What it does:**
- 🌤️ Weather for Fåvang
- 📋 Mission Control — active tasks from TODO.md + PROJECTS.md
- 🔥 Trending topics (AI, real estate, content creation)
- 💡 Proactive suggestions for the day

**Status:** ✅ Updated existing cron job

---

### 2. Daily Research Report (NEW)
**Cron:** Daily at 2:00 PM (Europe/Oslo)

**What it does:**
- Rotating deep-dive topics:
  1. AI/LLM developments for your businesses
  2. Real estate/utvikling trends in Norway
  3. Automation/tools for workflow
  4. Content ideas for YouTube/podcast
  5. Gut health/nutrition science

**Status:** ✅ Created

---

### 3. Things 3 Integration
**Skill:** `things-mac` (already installed)

**Capabilities:**
- Read inbox/today/upcoming from Things 3
- Add tasks via URL scheme
- Search projects/areas/tags

**Requirements:**
- `things` CLI installed (via Go)
- Grant Full Disk Access to Terminal/OpenClaw.app

**Install:**
```bash
GOBIN=/opt/homebrew/bin go install github.com/ossianhempel/things3-cli/cmd/things@latest
```

**Status:** ✅ Available

---

### 4. X/Reddit Research Skill — last30days
**Skill:** `last30days-skill` by Matt Van Horn

**What it does:**
- Researches any topic across Reddit + X from last 30 days
- Finds trending discussions and engagement
- Writes copy-paste-ready prompts

**Install location:** `~/.clawd/skills/last30days`

**Requirements:**
```bash
mkdir -p ~/.config/last30days
cat > ~/.config/last30days/.env << 'EOF'
OPENAI_API_KEY=sk-...
XAI_API_KEY=xai-...
EOF
chmod 600 ~/.config/last30days/.env
```

**Usage:**
```bash
/last30days [topic]
/last30days [topic] for [tool]
```

**Examples:**
- `/last30days prompting techniques for ChatGPT`
- `/last30days ClawdBot use cases`
- `/last30days iOS app mockups for Nano Banana Pro`

**Status:** ✅ Installed — **Needs API keys configured**

---

### 5. Weather Skill
**Skill:** `weather` (already installed)

**Capabilities:**
- Free weather via wttr.in (no API key)
- Current conditions + forecasts

**Status:** ✅ Available

---

## 🔧 Still To Set Up (Manual)

### 1. API Keys for last30days-skill
You need:
- **XAI_API_KEY** — Get from https://x.ai (for Grok/X search)
- **OPENAI_API_KEY** — Your existing OpenAI key

Create the config file:
```bash
mkdir -p ~/.config/last30days
echo 'OPENAI_API_KEY=sk-your-key' > ~/.config/last30days/.env
echo 'XAI_API_KEY=xai-your-key' >> ~/.config/last30days/.env
chmod 600 ~/.config/last30days/.env
```

### 2. Things 3 CLI (if not already installed)
```bash
GOBIN=/opt/homebrew/bin go install github.com/ossianhempel/things3-cli/cmd/things@latest
```
Then grant Full Disk Access to Terminal in System Settings.

### 3. Second Brain / Mission Control App
This is the Next.js app mentioned in the video for journaling and document viewing.

**Approach:**
- Can be built as a vibe-coded Next.js app
- Stores daily journal entries
- Document viewer for important concepts
- Auto-tags content (journal, newsletters, notes, scripts)

**Suggested workflow:**
- Create a `second-brain/` folder in workspace
- Have me (Fred) auto-generate daily journal entries in `memory/YYYY-MM-DD.md`
- Build a simple Next.js viewer when you're ready

---

## 📋 Summary

| Use Case | Status | Needs Action |
|----------|--------|--------------|
| Morning Brief | ✅ Active | None |
| Daily Research Report | ✅ Active | None |
| Things 3 Integration | ✅ Available | Install CLI if needed |
| X/Reddit Research (last30days) | ✅ Installed | Add API keys |
| Second Brain App | 🤔 Ready to build | Vibe code when ready |
| Proactive Vibe Coding | ✅ Partial | Can use existing coding-agent skill |

---

## 🚀 Next Steps

1. **Add API keys** for last30days-skill
2. **Test** the morning brief tomorrow at 8am
3. **Test** the research report today at 2pm
4. **Consider** building the Second Brain app when you have time

Want me to help with any of these steps?
