#!/usr/bin/env python3
"""Check Garmin login status and request MFA if needed"""
from garminconnect import Garmin
import json
import os
import sys

EMAIL = "kontakt@kvitfjellhytter.no"
PASSWORD = "Gladiator12!"
TOKEN_FILE = ".garmin_tokens.json"
MFA_SIGNAL_FILE = ".mfa_needed"

print(f"🔄 Checking Garmin login for {EMAIL}...")

client = Garmin(EMAIL, PASSWORD)

try:
    # Try login without MFA first
    client.login()
    print("✅ Login successful (no MFA required)!")
    print(f"👤 User: {client.get_full_name()}")
    
    # Save tokens for future use
    tokens = {
        'oauth1_token': str(client.garth.oauth1_token) if client.garth.oauth1_token else None,
        'oauth2_token': str(client.garth.oauth2_token) if client.garth.oauth2_token else None,
        'saved_at': datetime.now().isoformat()
    }
    with open(TOKEN_FILE, 'w') as f:
        json.dump(tokens, f, indent=2)
    print(f"💾 Tokens saved to {TOKEN_FILE}")
    sys.exit(0)  # Success - no MFA needed
    
except Exception as e:
    error_msg = str(e).lower()
    # Check if MFA is required
    if 'mfa' in error_msg or 'two' in error_msg or 'factor' in error_msg or 'authentic' in error_msg:
        print("🔐 MFA_REQUIRED")
        # Create signal file
        with open(MFA_SIGNAL_FILE, 'w') as f:
            f.write("MFA required for Garmin login\n")
            f.write(f"Email: {EMAIL}\n")
            f.write("Check email for 6-digit code\n")
        sys.exit(2)  # Signal that MFA is needed
    else:
        print(f"❌ Login error: {e}")
        sys.exit(1)

from datetime import datetime
