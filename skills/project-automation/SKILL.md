---
name: project-automation
description: Automate full-stack project creation with Supabase, Next.js, Vercel deploy, and browser verification. Use when user wants to create a new web project, set up a full-stack app, deploy to Vercel, or verify a deployment. Triggers on phrases like "create new project", "set up app", "deploy website", "create observatory", "new nextjs project", "full stack setup".
---

# Project Automation Skill

Complete automation for creating, deploying, and verifying full-stack web applications.

## Capabilities

1. **Supabase Setup**: Creates project, configures region, gets API keys
2. **Next.js Project**: Initializes with shadcn/ui, installs dependencies
3. **Vercel Deploy**: Links project, sets env vars, production deploy
4. **Browser Verification**: HTTP checks, error detection, performance metrics

## Prerequisites

Environment variables must be set (in `.project-automation.env`):
- `SUPABASE_TOKEN` - Personal access token
- `SUPABASE_ORG` - Organization ID/slug
- `SUPABASE_REGION` - Default: eu-north-1
- `VERCEL_TOKEN` - Vercel access token

## Usage

### Quick Start

```bash
# Set environment
source .project-automation.env

# Create and deploy project
./skills/project-automation/scripts/project-automation.sh my-app-name
```

### With Custom Template

```bash
./skills/project-automation/scripts/project-automation.sh my-app shadcn
```

Templates: `shadcn` (default), `nextjs`, `blank`

## Workflow

### Phase 1: Supabase (1-2 min)
- Creates project in specified org/region
- Waits for provisioning
- Extracts API keys

### Phase 2: Next.js Setup (2-3 min)
- Initializes with shadcn/ui template
- Installs @supabase/supabase-js
- Creates lib/supabase.ts client
- Sets up .env.local and .env.example

### Phase 3: Vercel Deploy (1-2 min)
- Links project to Vercel
- Sets environment variables
- Production deployment

### Phase 4: Verification (30 sec)
- HTTP 200 check
- Response time measurement
- Error pattern detection
- HTML element validation

## Browser Verification

The skill includes automated browser checks:
- Page loads (HTTP 200)
- Response time < 5s
- No error patterns in HTML
- Title tag present
- SSL/HSTS check

**Manual verification still needed for:**
- Interactive functionality
- JavaScript console errors
- Responsive design
- Cross-browser compatibility

## Project Structure Created

```
my-app/
├── app/
│   ├── page.tsx          # Landing page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── lib/
│   └── supabase.ts       # Supabase client
├── .env.local            # Local env (gitignored)
├── .env.example          # Example env
├── .deploy-url           # Deployment URL
└── vercel.json           # Vercel config
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Supabase project exists | Script uses existing project |
| Vercel link fails | Check VERCEL_TOKEN permissions |
| Deploy fails | Check build logs: `vercel --logs` |
| Slow response | First deploy cold start is normal |

## Integration with Browser Tool

After deployment, use the browser tool for visual verification:

```javascript
// Example browser verification flow
browser.open(deployUrl)
browser.snapshot()  // Check initial load
// Click links, verify navigation
// Check console for errors
```
