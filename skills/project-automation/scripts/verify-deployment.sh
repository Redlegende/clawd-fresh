#!/bin/bash
# verify-deployment.sh - Browser-based deployment verification
# Usage: ./verify-deployment.sh <deploy-url> [checks]

set -e

DEPLOY_URL="$1"
CHECKS="${2:-basic}"

if [ -z "$DEPLOY_URL" ]; then
    if [ -f .deploy-url ]; then
        DEPLOY_URL=$(cat .deploy-url)
    else
        echo "Usage: $0 <deploy-url>"
        exit 1
    fi
fi

echo "🔍 Verifying deployment: $DEPLOY_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Health check via curl
echo "📡 Testing HTTP response..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ HTTP 200 OK"
else
    echo "❌ HTTP $HTTP_STATUS"
    exit 1
fi

# Check response time
echo "⏱️  Testing response time..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$DEPLOY_URL" 2>/dev/null || echo "0")
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc 2>/dev/null | cut -d. -f1 || echo "0")

if [ "$RESPONSE_MS" -lt 5000 ]; then
    echo "✅ Response time: ${RESPONSE_MS}ms"
else
    echo "⚠️  Slow response: ${RESPONSE_MS}ms"
fi

# Check for common errors in HTML
echo "🧹 Checking for error patterns..."
HTML=$(curl -s "$DEPLOY_URL" 2>/dev/null || echo "")

if echo "$HTML" | grep -qi "error\|exception\|fail\|404\|500"; then
    echo "⚠️  Found potential error indicators in HTML"
else
    echo "✅ No obvious errors in HTML"
fi

# Check for key elements
echo "🔎 Checking for key elements..."
if echo "$HTML" | grep -q "<title>"; then
    TITLE=$(echo "$HTML" | grep -oP '(?<=<title>).*?(?=</title>)' | head -1)
    echo "✅ Page title: $TITLE"
else
    echo "⚠️  No title tag found"
fi

# SSL check
echo "🔒 Checking SSL..."
SSL_INFO=$(curl -s -I "$DEPLOY_URL" 2>/dev/null | grep -i "strict-transport-security" || echo "")
if [ -n "$SSL_INFO" ]; then
    echo "✅ HSTS enabled"
else
    echo "ℹ️  HSTS check skipped"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Basic verification complete!"
echo ""
echo "⚠️  Manual checks recommended:"
echo "   - Click all navigation links"
echo "   - Test interactive features"
echo "   - Check browser console for JS errors"
echo "   - Verify responsive design"
echo "   - Test dark mode toggle (if applicable)"
