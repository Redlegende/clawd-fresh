#!/bin/bash
# Populate research_notes in Supabase with full .md content
# Uses the service_role key for direct insert/update

SUPABASE_URL="https://vhrmxtolrrcrhrxljemp.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NDAwNCwiZXhwIjoyMDg1NTUwMDA0fQ.jnZEhrFl823cgQHubVZv_-qRwvS8aO90Yosp_jxY2cs"
WORKSPACE="/Users/jakobbakken/clawd-fresh"

# Function to upsert a research note
upsert_note() {
  local title="$1"
  local slug="$2"
  local file_path="$3"
  local category="$4"
  local tags="$5"
  local project_id="$6"
  local full_path="${WORKSPACE}/${file_path}"

  if [ ! -f "$full_path" ]; then
    echo "SKIP: $full_path not found"
    return
  fi

  # Read file content and escape for JSON
  local content
  content=$(python3 -c "
import json, sys
with open(sys.argv[1], 'r') as f:
    print(json.dumps(f.read()))
" "$full_path")

  local file_size
  file_size=$(stat -f%z "$full_path" 2>/dev/null || stat -c%s "$full_path" 2>/dev/null)

  # Build JSON payload
  local payload
  payload=$(python3 -c "
import json
data = {
    'title': $(python3 -c "import json; print(json.dumps('$title'))"),
    'slug': $(python3 -c "import json; print(json.dumps('$slug'))"),
    'file_path': $(python3 -c "import json; print(json.dumps('$file_path'))"),
    'category': $(python3 -c "import json; print(json.dumps('$category'))"),
    'tags': $tags,
    'content': $content,
    'file_size_bytes': $file_size,
    'status': 'published',
    'synced_at': '$(date -u +%Y-%m-%dT%H:%M:%SZ)'
}
if '$project_id':
    data['project_id'] = '$project_id'
print(json.dumps(data))
")

  local response
  response=$(curl -s -w "\n%{http_code}" -X POST \
    "${SUPABASE_URL}/rest/v1/research_notes" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates" \
    -d "$payload")

  local http_code
  http_code=$(echo "$response" | tail -1)

  if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    echo "OK: $title ($file_size bytes)"
  else
    echo "ERR ($http_code): $title"
    echo "$response" | head -5
  fi
}

echo "=== Populating Research Notes ==="
echo ""

# --- 3dje Boligsektor research (project_id: 89789380-aeb1-4450-98bc-b36060e12430) ---
PROJECT_3DJE="89789380-aeb1-4450-98bc-b36060e12430"

upsert_note \
  "API Kartverket Deep Dive" \
  "api-kartverket-deep-dive" \
  "projects/3dje-boligsektor/research/API-KARTVERKET-DEEP-DIVE.md" \
  "api-research" \
  '["kartverket","property","cadastre","gis"]' \
  "$PROJECT_3DJE"

upsert_note \
  "API SSB Context Deep Dive" \
  "api-ssb-context-deep-dive" \
  "projects/3dje-boligsektor/research/API-SSB-CONTEXT-DEEP-DIVE.md" \
  "api-research" \
  '["ssb","statistics","grunnkrets","demographics"]' \
  "$PROJECT_3DJE"

upsert_note \
  "API Geonorge Plans Deep Dive" \
  "api-geonorge-plans-deep-dive" \
  "projects/3dje-boligsektor/research/API-GEONORGE-PLANS-DEEP-DIVE.md" \
  "api-research" \
  '["geonorge","kommuneplan","reguleringsplan","zoning"]' \
  "$PROJECT_3DJE"

upsert_note \
  "API Cost Analysis" \
  "api-cost-analysis" \
  "projects/3dje-boligsektor/research/API-COST-ANALYSIS.md" \
  "api-research" \
  '["cost","api","pricing","comparison"]' \
  "$PROJECT_3DJE"

upsert_note \
  "Research Summary - Data Sources" \
  "research-summary-data-sources" \
  "projects/3dje-boligsektor/research/RESEARCH-SUMMARY.md" \
  "project-docs" \
  '["summary","data-sources","architecture"]' \
  "$PROJECT_3DJE"

# --- General research (no project_id) ---

upsert_note \
  "Edge Case Analysis" \
  "edge-case-analysis" \
  "research/edge-case-analysis.md" \
  "system-docs" \
  '["edge-cases","testing","analysis"]' \
  ""

upsert_note \
  "iGMS OAuth Test Log" \
  "igms-oauth-test-log" \
  "research/igms-oauth-test-log-2026-02-03.md" \
  "api-research" \
  '["igms","oauth","testing","integration"]' \
  ""

upsert_note \
  "Life Orchestration Architecture" \
  "life-orchestration-architecture" \
  "research/life-orchestration-architecture.md" \
  "system-docs" \
  '["architecture","life-os","orchestration","automation"]' \
  ""

upsert_note \
  "Morning Brief - Antigravity & Remotion" \
  "morning-brief-antigravity-remotion" \
  "research/morning-brief-antigravity-remotion.md" \
  "content" \
  '["morning-brief","antigravity","remotion","video"]' \
  ""

upsert_note \
  "AI Company Management" \
  "ai-company-management" \
  "research/ai-company-management/README.md" \
  "project-docs" \
  '["ai","company","management","agents"]' \
  ""

upsert_note \
  "AI Company Management - Research Brief" \
  "ai-company-management-research-brief" \
  "research/ai-company-management/RESEARCH-BRIEF.md" \
  "project-docs" \
  '["ai","company","research","brief"]' \
  ""

upsert_note \
  "AI Orchestration Patterns" \
  "ai-orchestration-patterns" \
  "research/ai-orchestration-patterns/RESEARCH-SUMMARY.md" \
  "system-docs" \
  '["ai","orchestration","patterns","architecture"]' \
  ""

echo ""
echo "=== Done ==="
