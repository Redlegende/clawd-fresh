#!/bin/bash
# Workspace Health Check Script
# Run daily via cron to verify file system organization

WORKSPACE="/Users/jakobbakken/clawd-fresh"
ISSUES=0

echo "🔍 Workspace Health Check"
echo "========================="
echo "Date: $(date)"
echo ""

# Check 1: Project count (max 7)
PROJECT_COUNT=$(ls -1 $WORKSPACE/projects/ 2>/dev/null | wc -l)
if [ $PROJECT_COUNT -gt 7 ]; then
    echo "⚠️  WARNING: Too many projects ($PROJECT_COUNT, max 7)"
    echo "   Projects: $(ls $WORKSPACE/projects/ | tr '\n' ', ')"
    ISSUES=$((ISSUES + 1))
else
    echo "✅ Projects: $PROJECT_COUNT (limit: 7)"
fi

# Check 2: Research files in correct locations
echo ""
echo "📁 Research File Check:"
WRONG_RESEARCH=$(find $WORKSPACE/research -maxdepth 1 -name "*3dje*" -o -name "*youtube*" -o -name "*kvitfjell*" 2>/dev/null)
if [ ! -z "$WRONG_RESEARCH" ]; then
    echo "⚠️  Research files that should be in project folders:"
    echo "$WRONG_RESEARCH" | sed 's/^/   /'
    ISSUES=$((ISSUES + 1))
else
    echo "✅ No orphaned research files"
fi

# Check 3: Empty folders
echo ""
echo "📂 Empty Folder Check:"
EMPTY_FOLDERS=$(find $WORKSPACE -type d -empty 2>/dev/null | grep -v ".git")
if [ ! -z "$EMPTY_FOLDERS" ]; then
    echo "⚠️  Empty folders found:"
    echo "$EMPTY_FOLDERS" | sed 's/^/   /'
    ISSUES=$((ISSUES + 1))
else
    echo "✅ No empty folders"
fi

# Check 4: Core files exist
echo ""
echo "📄 Core Files Check:"
CORE_FILES=("SOUL.md" "USER.md" "TODO.md" "PROJECTS.md" "MEMORY.md" "AGENTS.md" "WORKFLOW.md" "ORGANIZATION.md")
for file in "${CORE_FILES[@]}"; do
    if [ -f "$WORKSPACE/$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (MISSING)"
        ISSUES=$((ISSUES + 1))
    fi
done

# Check 5: Duplicate folder names (case variations)
echo ""
echo "🔤 Duplicate Check:"
DUPLICATES=$(ls $WORKSPACE/projects/ | sort -f | uniq -di)
if [ ! -z "$DUPLICATES" ]; then
    echo "⚠️  Potential duplicates (case mismatch):"
    echo "$DUPLICATES" | sed 's/^/   /'
    ISSUES=$((ISSUES + 1))
else
    echo "✅ No duplicates found"
fi

# Summary
echo ""
echo "========================="
if [ $ISSUES -eq 0 ]; then
    echo "✅ Workspace health: CLEAN"
    exit 0
else
    echo "⚠️  Issues found: $ISSUES"
    echo "   Run 'openclaw agent --message "Fix workspace issues"' to resolve"
    exit 1
fi
