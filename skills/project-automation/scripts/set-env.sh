#!/bin/bash
# set-env.sh - Set environment variables for automation
# Run this to configure tokens

echo "🔧 Project Automation Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .project-automation.env exists
if [ -f ../../.project-automation.env ]; then
    source ../../.project-automation.env
    echo "✅ Loaded existing configuration"
else
    echo "⚠️  No .project-automation.env found"
fi

echo ""
echo "Current configuration:"
echo "  SUPABASE_ORG: ${SUPABASE_ORG:-not set}"
echo "  SUPABASE_REGION: ${SUPABASE_REGION:-not set}"
echo "  VERCEL_SCOPE: ${VERCEL_SCOPE:-not set}"
echo ""
echo "Tokens (masked):"
echo "  SUPABASE_TOKEN: ${SUPABASE_TOKEN:0:10}..."
echo "  VERCEL_TOKEN: ${VERCEL_TOKEN:0:10}..."
echo ""

if [ -z "$SUPABASE_TOKEN" ] || [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Missing tokens. Please set them in .project-automation.env"
    exit 1
fi

echo "✅ Environment configured"
