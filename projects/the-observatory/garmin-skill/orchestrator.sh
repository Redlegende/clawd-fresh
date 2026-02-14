#!/bin/bash
# Garmin Sync Orchestrator
# Handles daily sync with automatic MFA code fetching

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Garmin Sync Orchestrator"
echo "======================================"
echo ""

# Activate virtual environment
source venv/bin/activate

# Step 1: Try to sync with existing tokens
echo "📊 Step 1: Attempting sync with saved tokens..."
python3 daily_sync.py > /tmp/garmin_sync.log 2>&1
SYNC_EXIT_CODE=$?

if [ $SYNC_EXIT_CODE -eq 0 ]; then
    echo "✅ Sync completed successfully!"
    cat /tmp/garmin_sync.log
    exit 0
fi

# Check if it's an MFA or login issue
echo ""
echo "⚠️  Sync failed, checking if MFA is needed..."

# Check for MFA-related messages OR login failures
if grep -qi "MFA\|Two-step\|verification code\|authenticator\|Login failed\|OAuth.*token\|All login methods failed" /tmp/garmin_sync.log 2>/dev/null; then
    echo "🔐 MFA required! Starting automated MFA handling..."
    echo ""
    
    # Step 2: Wait for and fetch MFA code from email
    echo "📧 Step 2: Fetching MFA code from Gmail..."
    python3 email_fetcher.py
    
    if [ ! -f ".mfa_code.txt" ]; then
        echo "❌ Failed to get MFA code from email"
        echo "📋 Last sync log:"
        cat /tmp/garmin_sync.log
        exit 1
    fi
    
    MFA_CODE=$(cat .mfa_code.txt)
    echo "✅ Got MFA code: $MFA_CODE"
    echo ""
    
    # Step 3: Retry sync with MFA code
    echo "📊 Step 3: Retrying sync with MFA code..."
    export GARMIN_MFA="$MFA_CODE"
    python3 daily_sync.py
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Sync completed successfully with MFA!"
        # Clean up MFA file
        rm -f .mfa_code.txt
        exit 0
    else
        echo "❌ Sync failed even with MFA code"
        exit 1
    fi
else
    echo "❌ Sync failed for non-MFA reason"
    echo "📋 Error log:"
    cat /tmp/garmin_sync.log
    exit 1
fi
