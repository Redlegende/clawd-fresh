---
name: links
description: Quick access to important URLs and bookmarks for Jakob's projects and tools.
metadata:
  clawdbot:
    category: productivity
    emoji: 🔗
---

# Links Skill

Fast access to frequently used URLs without hunting through files.

## Usage

```bash
# List all links
links

# Get a specific link
links observatory
links kvitfjell
links folio

# Open in browser (if supported)
links open observatory
```

## Available Links

| Name | URL | Description |
|------|-----|-------------|
| **observatory** | https://the-observatory-beta.vercel.app | Personal dashboard |
| **observatory-old** | https://the-observatory-lxb444gor-redlegendes-projects.vercel.app | Observatory legacy URL |
| **kvitfjell** | https://app-pink-eight-65.vercel.app | Kvitfjellhytter dashboard |
| **folio** | https://app.folio.no | Accounting/bookkeeping |
| **supabase** | https://supabase.com/dashboard/project/vhrmxtolrrcrhrxljemp | Database dashboard |
| **vercel** | https://vercel.com/redlegendes | Deployments |
| **github** | https://github.com/jakobbakken | Repositories |
| **clawhub** | https://clawhub.com | OpenClaw skills |

## Adding New Links

Edit `skills/links/links.json` to add more bookmarks.