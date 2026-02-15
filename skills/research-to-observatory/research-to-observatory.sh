#!/usr/bin/env bash
# Save research note to Observatory Supabase + local .md file
# Usage:
#   ./research-to-observatory.sh "Title" "category" "path/to/file.md" "tag1,tag2" "summary text"

set -e

TITLE="$1"
CATEGORY="$2"
FILE_PATH="$3"
TAGS="$4"
SUMMARY="$5"

# Load Supabase credentials
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../../projects/the-observatory/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env.local not found at $ENV_FILE"
  exit 1
fi

source "$ENV_FILE"

# Read content from file
if [[ ! -f "$FILE_PATH" ]]; then
  echo "Error: File not found: $FILE_PATH"
  exit 1
fi

CONTENT=$(cat "$FILE_PATH")

# Convert comma-separated tags to JSON array
IFS=',' read -ra TAG_ARRAY <<< "$TAGS"
TAGS_JSON="["
for i in "${!TAG_ARRAY[@]}"; do
  TAG=$(echo "${TAG_ARRAY[$i]}" | xargs) # Trim whitespace
  TAGS_JSON+="\"$TAG\""
  if [[ $i -lt $((${#TAG_ARRAY[@]} - 1)) ]]; then
    TAGS_JSON+=","
  fi
done
TAGS_JSON+="]"

# Generate slug from title
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')

# Prepare JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "title": "$TITLE",
  "slug": "$SLUG",
  "file_path": "$FILE_PATH",
  "category": "$CATEGORY",
  "tags": $TAGS_JSON,
  "summary": "$SUMMARY",
  "content": $(echo "$CONTENT" | jq -Rs .),
  "status": "active",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)

# Insert into Supabase
curl -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/research_notes" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "$JSON_PAYLOAD" \
  --silent

echo "✅ Research note saved to Observatory: $TITLE"
echo "📁 Local file: $FILE_PATH"
echo "🔗 View at: https://the-observatory-beta.vercel.app/research"
