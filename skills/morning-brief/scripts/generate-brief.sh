#!/bin/bash
# Morning Brief Generator for Jakob
# Runs daily at 8:00 AM Europe/Oslo
# Generates comprehensive daily brief with calendar, tasks, and priorities

WORKSPACE="/Users/jakobbakken/clawd-fresh"
DATE=$(date +%Y-%m-%d)
DAY_NAME=$(date +%A)

cd "$WORKSPACE"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================${NC}"
echo -e "${CYAN}  MORNING BRIEF — ${DAY_NAME}, ${DATE}${NC}"
echo -e "${CYAN}====================================${NC}"
echo ""

# 1. TODAY'S CALENDAR CHECK
echo -e "${YELLOW}📅 TODAY'S SCHEDULE${NC}"
echo "-----------------------------------"

# Check if gog calendar is available and get today's events
if command -v gog &> /dev/null; then
    gog calendar today 2>/dev/null || echo "Calendar not configured — run 'gog auth' to set up"
else
    echo "⚠️  Google Calendar integration not available"
    echo "   Install with: npm install -g gog-cli"
fi

echo ""

# 2. CLEANING & CHECK-IN CHECK (from MEMORY.md rules)
echo -e "${YELLOW}🏠 CABIN OPERATIONS${NC}"
echo "-----------------------------------"

# Parse cabin events from memory or known schedule
# This will be populated by checking the calendar for:
# - 🧹 CLEAN events (red)
# - 🏠 CHECK-IN events (green)
# - NO DRIVING days

TODAY_CLEANING=$(grep -i "2026-02-05.*clean" memory/*.md 2>/dev/null | head -1)
TODAY_CHECKIN=$(grep -i "2026-02-05.*check-in" memory/*.md 2>/dev/null | head -1)

if [ -n "$TODAY_CLEANING" ]; then
    echo -e "${RED}🧹 CLEANING DAY${NC} — Cabins must be cleaned 11:00–15:00"
    echo -e "${RED}⚠️  NO DRIVING TODAY${NC} — Cleaning takes priority"
    echo ""
fi

if [ -n "$TODAY_CHECKIN" ]; then
    echo -e "${GREEN}🏠 CHECK-IN TODAY${NC} — Guest arrival"
    echo ""
fi

if [ -z "$TODAY_CLEANING" ] && [ -z "$TODAY_CHECKIN" ]; then
    echo -e "${GREEN}✅ No cabin operations today${NC}"
    echo ""
fi

# 3. ACTIVE TASKS FROM TODO.md
echo -e "${YELLOW}🔴 ACTIVE TASKS (NOW)${NC}"
echo "-----------------------------------"

# Extract tasks from 🔴 NOW section
if [ -f "TODO.md" ]; then
    # Get lines between "## 🔴 NOW" and "## 🟡 NEXT" or "## ✅ COMPLETED"
    awk '/## 🔴 NOW/{flag=1;next} /## [🟡✅]/{flag=0} flag' TODO.md | \
    grep -E "^\| [0-9]+" | \
    head -5 | \
    while IFS= read -r line; do
        echo "$line"
    done
else
    echo "⚠️  TODO.md not found"
fi

echo ""

# 4. HIGH PRIORITY BACKLOG
echo -e "${YELLOW}🟡 HIGH PRIORITY (Backlog)${NC}"
echo "-----------------------------------"

if [ -f "TODO.md" ]; then
    awk '/### High Priority/{flag=1;next} /### Medium Priority/{flag=0} flag' TODO.md | \
    grep "^- \[ \]" | \
    head -3
fi

echo ""

# 5. PROJECT STATUS OVERVIEW
echo -e "${YELLOW}📊 PROJECT STATUS${NC}"
echo "-----------------------------------"

if [ -f "PROJECTS.md" ]; then
    grep -E "^\*\*Status:\*\*|^### " PROJECTS.md | head -10 | while IFS= read -r line; do
        if [[ $line == "### "* ]]; then
            echo ""
            echo -e "${CYAN}${line:4}${NC}"
        elif [[ $line == *"Status:"* ]]; then
            echo "  $line"
        fi
    done
fi

echo ""
echo -e "${CYAN}====================================${NC}"
echo -e "${CYAN}  End of Morning Brief${NC}"
echo -e "${CYAN}====================================${NC}"

# Save to daily note
BRIEF_FILE="memory/${DATE}-morning-brief.md"
cat > "$BRIEF_FILE" << EOF
# Morning Brief — ${DAY_NAME}, ${DATE}

Generated: $(date)

## 🏠 Cabin Operations
$(if [ -n "$TODAY_CLEANING" ]; then echo "- 🧹 CLEANING DAY (11:00–15:00)"; echo "- ⚠️ NO DRIVING"; else echo "- ✅ No operations"; fi)

## 🔴 Today's Focus
$(awk '/## 🔴 NOW/{flag=1;next} /## [🟡✅]/{flag=0} flag' TODO.md | grep -E "^\| [0-9]+" | head -3)

## 📋 Notes
- 

## ✅ Completed Today
- 
EOF

echo ""
echo "📄 Brief saved to: $BRIEF_FILE"
