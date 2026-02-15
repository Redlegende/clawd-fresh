# Research to Observatory — Workflow Guide

## Problem Solved

Jakob wanted a way to browse all research notes in a clean web interface instead of reading raw `.md` files. The Observatory already has a Research page with markdown rendering, search, and filtering — we just needed to pipe research into it.

## Solution

Two-part storage:
1. **Local `.md` files** — backup, version control, grep-searchable
2. **Supabase database** — web-accessible, searchable, renderable

## How It Works

### When Fred Does Research

1. **Write the research** to a `.md` file in the appropriate project folder
   ```bash
   /Users/jakobbakken/clawd-fresh/projects/kvitfjellhytter/research/igms-oauth-guide.md
   ```

2. **Run the skill** to save it to the Observatory
   ```bash
   ./skills/research-to-observatory/research-to-observatory.sh \
     "iGMS OAuth Integration Guide" \
     "api-research" \
     "projects/kvitfjellhytter/research/igms-oauth-guide.md" \
     "igms,oauth,api" \
     "Complete guide to integrating iGMS OAuth 2.0 for booking management"
   ```

3. **Confirm to Jakob** that it's viewable at https://the-observatory-beta.vercel.app/research

### What Jakob Sees

- **Research page** with all notes listed
- **Categories** for filtering (api-research, project-docs, health-research, content, system-docs)
- **Tags** for cross-cutting topics
- **Full markdown rendering** with syntax highlighting, tables, code blocks
- **Search** across titles, summaries, and tags
- **Read tracking** (read count, last read date)

## Categories

| Category | Use For |
|----------|---------|
| `api-research` | API docs, integration guides, OAuth flows |
| `project-docs` | Project-specific documentation |
| `health-research` | Gut health, fitness, wellness topics |
| `content` | YouTube scripts, blog posts, content ideas |
| `system-docs` | OpenClaw workflows, system architecture |

## Example: Full Research Workflow

```bash
# 1. Jakob asks Fred to research something
# "Fred, research how to integrate Stripe payments for Kvitfjellhytter"

# 2. Fred does the research (web search, API docs, etc.)
# - Reads Stripe API docs
# - Checks Next.js integration guides
# - Reviews Supabase Edge Functions for webhooks

# 3. Fred writes the research to a markdown file
vim projects/kvitfjellhytter/research/stripe-integration-guide.md

# 4. Fred runs the skill to save it to Observatory
./skills/research-to-observatory/research-to-observatory.sh \
  "Stripe Payment Integration for Kvitfjellhytter" \
  "api-research" \
  "projects/kvitfjellhytter/research/stripe-integration-guide.md" \
  "stripe,payments,kvitfjellhytter,nextjs" \
  "Complete guide to integrating Stripe for cabin booking payments, including webhooks and refund handling"

# 5. Fred confirms
# "✅ Research complete. View it at: https://the-observatory-beta.vercel.app/research"
```

## Benefits

- **No context switching** — Jakob stays in the browser, no need to open VSCode
- **Searchable** — full-text search across all research
- **Persistent** — Supabase backup + local files
- **Markdown rendering** — clean, readable, with syntax highlighting
- **Mobile-friendly** — view research notes on phone

## Files

- `research-to-observatory.sh` — Main script
- `SKILL.md` — OpenClaw skill definition
- `README.md` — This file

## Dependencies

- `jq` (for JSON escaping)
- Supabase credentials in `projects/the-observatory/.env.local`
- Observatory deployed at https://the-observatory-beta.vercel.app

## Future Enhancements

- Auto-extract key insights with AI
- Generate summaries automatically
- Link related research notes
- Version tracking for updated research
