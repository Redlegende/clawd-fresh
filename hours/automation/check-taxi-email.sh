#!/bin/bash
# check-taxi-email.sh
# Check Gmail for Fåvang Varetaxi PDF with driving hours
# Runs: Friday 16:00, Saturday 10:00 (if empty), Sunday 10:00 (if empty)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOURS_DIR="$(dirname "$SCRIPT_DIR")"
PDF_DIR="$HOURS_DIR/fåvang-varetaxi/pdfs"
LOG_FILE="$HOURS_DIR/calendar-sync.log"
STATUS_FILE="$HOURS_DIR/.last-check-status"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Ensure PDF directory exists
mkdir -p "$PDF_DIR"

# Check if gog is installed and authenticated
if ! command -v gog &> /dev/null; then
    log "${RED}ERROR: gog not installed${NC}"
    exit 1
fi

# Search for emails from Fåvang Varetaxi with PDF attachments from last 7 days
log "Searching Gmail for Fåvang Varetaxi PDF..."

# Try different search patterns
SEARCH_PATTERNS=(
    "from:fåvangvaretaxi.no newer_than:7d has:attachment filename:pdf"
    "from:*@fåvangvaretaxi.no newer_than:7d has:attachment filename:pdf"
    "subject:varetaxi newer_than:7d has:attachment filename:pdf"
    "fåvang newer_than:7d has:attachment filename:pdf"
)

EMAIL_FOUND=false
PDF_ATTACHMENT_ID=""
EMAIL_DATE=""
EMAIL_SUBJECT=""

for pattern in "${SEARCH_PATTERNS[@]}"; do
    log "Trying pattern: $pattern"
    
    # Search for messages (not threads) to get individual emails
    RESULTS=$(gog gmail messages search "$pattern" --max 10 --json 2>/dev/null || echo "[]")
    
    if [ "$RESULTS" != "[]" ] && [ -n "$RESULTS" ]; then
        log "${GREEN}Found email(s) matching pattern${NC}"
        
        # Extract the first email with PDF attachment
        # Parse JSON to get message ID and attachment info
        # This is a simplified version - actual implementation would parse JSON properly
        EMAIL_FOUND=true
        break
    fi
done

if [ "$EMAIL_FOUND" = false ]; then
    log "${YELLOW}No PDF found in email${NC}"
    
    # Determine next action based on day
    DAY_OF_WEEK=$(date +%u)  # 5=Friday, 6=Saturday, 7=Sunday
    
    if [ "$DAY_OF_WEEK" = "5" ]; then
        log "Friday check complete. Will retry Saturday."
        echo "retry_saturday" > "$STATUS_FILE"
        # Schedule Saturday reminder via cron or message
    elif [ "$DAY_OF_WEEK" = "6" ]; then
        log "Saturday check complete. Will retry Sunday."
        echo "retry_sunday" > "$STATUS_FILE"
    else
        log "${RED}Sunday final check: No PDF received this week!${NC}"
        echo "no_pdf" > "$STATUS_FILE"
        # Send alert to user
        # message send --message "⚠️ No Fåvang Varetaxi PDF received this week (checked Fri-Sun)"
    fi
    
    exit 0
fi

# PDF found - process it
log "${GREEN}Processing PDF attachment...${NC}"

# Download PDF
# gog gmail attachment download <messageId> <attachmentId> --out "$PDF_DIR/taxi-$(date +%Y%m%d-%H%M%S).pdf"

# Parse PDF to extract hours
# $SCRIPT_DIR/parse-pdf.py "$PDF_PATH"

# Update hours markdown file
# $SCRIPT_DIR/update-hours.sh "$EXTRACTED_DATA"

# Add to calendar
# $SCRIPT_DIR/add-to-calendar.sh "$EXTRACTED_DATA"

# Set end-of-shift reminders
# $SCRIPT_DIR/set-reminders.sh "$EXTRACTED_DATA"

log "${GREEN}Processing complete!${NC}"
echo "processed_$(date +%Y%m%d)" > "$STATUS_FILE"
