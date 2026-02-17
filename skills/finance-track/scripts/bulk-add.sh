#!/usr/bin/env bash
set -euo pipefail

# Bulk add finance entries with duplicate checking
# Usage: ./bulk-add.sh --source "Treffen" --rate 400 --hours 6 --dates "2026-02-17,2026-02-18,2026-02-20,2026-02-21" --description "Restaurant shift" [--update]

SOURCE=""
RATE=""
HOURS=""
DATES=""
DESCRIPTION=""
UPDATE_FLAG=""

# Parse named args
while [[ $# -gt 0 ]]; do
  case $1 in
    --source)
      SOURCE="$2"
      shift 2
      ;;
    --rate)
      RATE="$2"
      shift 2
      ;;
    --hours)
      HOURS="$2"
      shift 2
      ;;
    --dates)
      DATES="$2"
      shift 2
      ;;
    --description)
      DESCRIPTION="$2"
      shift 2
      ;;
    --update)
      UPDATE_FLAG="--update"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate required args
if [[ -z "$SOURCE" ]] || [[ -z "$RATE" ]] || [[ -z "$HOURS" ]] || [[ -z "$DATES" ]]; then
  echo "Usage: ./bulk-add.sh --source <source> --rate <rate> --hours <hours> --dates <comma-separated-dates> --description <desc> [--update]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADD_SCRIPT="$SCRIPT_DIR/add-hours.sh"

if [[ ! -f "$ADD_SCRIPT" ]]; then
  echo "Error: add-hours.sh not found at $ADD_SCRIPT"
  exit 1
fi

# Split dates and loop
IFS=',' read -ra DATE_ARRAY <<< "$DATES"
SUCCESS_COUNT=0
FAIL_COUNT=0
SKIPPED_COUNT=0

echo "🔄 Bulk adding $SOURCE shifts..."
echo "   Rate: $RATE kr/h | Hours: $HOURS | Dates: ${#DATE_ARRAY[@]}"
echo ""

for DATE in "${DATE_ARRAY[@]}"; do
  # Trim whitespace
  DATE=$(echo "$DATE" | xargs)

  # Call add-hours.sh
  if OUTPUT=$("$ADD_SCRIPT" "$DATE" "$SOURCE" "$HOURS" "$RATE" "$DESCRIPTION" $UPDATE_FLAG 2>&1); then
    if echo "$OUTPUT" | grep -q "Updated entry"; then
      echo "🔄 $DATE: Updated"
      ((SUCCESS_COUNT++))
    elif echo "$OUTPUT" | grep -q "Added entry"; then
      echo "✅ $DATE: Added"
      ((SUCCESS_COUNT++))
    else
      echo "⚠️  $DATE: Unknown result"
      echo "$OUTPUT"
      ((SKIPPED_COUNT++))
    fi
  else
    if echo "$OUTPUT" | grep -q "Duplicate entry detected"; then
      echo "⏭️  $DATE: Already exists (skipped)"
      ((SKIPPED_COUNT++))
    else
      echo "❌ $DATE: Failed"
      echo "$OUTPUT"
      ((FAIL_COUNT++))
    fi
  fi
done

echo ""
echo "📊 Summary: $SUCCESS_COUNT added/updated | $SKIPPED_COUNT skipped | $FAIL_COUNT failed"
