#!/bin/bash
# check-context-size
# Estimate current context size and warn if approaching limits

# This is a helper script for Fred to check context usage

echo "📊 Context Size Check"
echo "===================="
echo ""
echo "Model: moonshot/kimi-k2.5"
echo "Context Limit: ~128K tokens"
echo "Safe Threshold: 100K tokens"
echo ""
echo "⚠️  If you're seeing this, context monitoring is not yet implemented."
echo ""
echo "Manual checks:"
echo "  - Count messages in session"
echo "  - Estimate file sizes read"
echo "  - Check for large outputs"
echo ""
echo "Action if > 80K tokens:"
echo "  1. Summarize current state"
echo "  2. Spawn sub-agent to continue"
echo "  3. Report completion to user"
