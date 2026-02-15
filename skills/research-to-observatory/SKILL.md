# Research to Observatory Skill

Automatically saves research notes to both local `.md` files AND the Observatory Supabase database for viewing in the web dashboard.

## When to Use

- After completing deep research on any topic
- When creating documentation that should be browsable in the Observatory
- When archiving important findings

## What It Does

1. Saves full markdown content to Supabase `research_notes` table
2. Keeps the local `.md` file as backup
3. Makes research immediately viewable at https://the-observatory-beta.vercel.app/research

## Usage

```bash
./research-to-observatory.sh "Title" "category" "path/to/file.md" "tag1,tag2" "Summary text"
```

### Parameters

- **Title**: Display title for the research note
- **Category**: One of: `api-research`, `project-docs`, `health-research`, `content`, `system-docs`
- **File Path**: Absolute or relative path to the `.md` file
- **Tags**: Comma-separated tags (e.g., "supabase,oauth,api")
- **Summary**: Short 1-2 sentence summary for preview

### Example

```bash
./research-to-observatory.sh \
  "iGMS OAuth Integration Guide" \
  "api-research" \
  "/Users/jakobbakken/clawd-fresh/projects/kvitfjellhytter/research/igms-oauth.md" \
  "igms,oauth,api,kvitfjellhytter" \
  "Complete guide to integrating iGMS OAuth 2.0 for booking management"
```

## Workflow for Fred

When Jakob asks you to research something:

1. Do the research (web search, API docs, etc.)
2. Write the full report to a `.md` file in the appropriate project folder
3. Run this skill to save it to the Observatory
4. Confirm to Jakob that he can view it in the dashboard

## Files

- `research-to-observatory.sh` — Main script
- Observatory env: `../../projects/the-observatory/.env.local`
- Database: `research_notes` table in Supabase

## Categories

- **api-research**: API documentation, integration guides
- **project-docs**: Project-specific documentation
- **health-research**: Gut health, fitness, wellness research
- **content**: YouTube scripts, blog posts, content ideas
- **system-docs**: OpenClaw, system architecture, workflows
