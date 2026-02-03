#!/usr/bin/env python3
"""Login to Garmin and save tokens for future use"""
from garminconnect import Garmin
import json
import os
import sys

EMAIL = "kontakt@kvitfjellhytter.no"
PASSWORD = "Gladiator12!"
TOKEN_FILE = ".garmin_tokens.json"

def mfa_callback():
    """Request MFA from orchestrator"""
    print("MFA_REQUIRED")
    sys.exit(2)

print(f"🔄 Attempting login as {EMAIL}...")

try:
    client = Garmin(EMAIL, PASSWORD)
    client.login(mfa_callback)
    
    print("✅ Login successful (no MFA needed)!")
    print(f"👤 User: {client.get_full_name()}")
    
    # Save tokens
    tokens = {
        'oauth1_token': str(client.garth.oauth1_token) if client.garth.oauth1_token else None,
        'oauth2_token': str(client.garth.oauth2_token) if client.garth.oauth2_token else None,
        'saved_at': datetime.now().isoformat()
    }
    
    with open(TOKEN_FILE, 'w') as f:
        json.dump(tokens, f, indent=2)
    print(f"💾 Tokens saved to {TOKEN_FILE}")
    
except SystemExit as e:
    if e.code == 2:
        sys.exit(2)
except Exception as e:
    error_str = str(e).lower()
    if 'mfa' in error_str or 'two' in error_str or 'factor' in error_str:
        print("MFA_REQUIRED")
        sys.exit(2)
    print(f"❌ Login failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

from datetime import datetime
