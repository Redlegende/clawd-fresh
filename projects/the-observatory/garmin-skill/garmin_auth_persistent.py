#!/usr/bin/env python3
"""Garmin login with persistent session tokens"""
from garminconnect import Garmin
import json
import os
from datetime import datetime

EMAIL = "kontakt@kvitfjellhytter.no"
PASSWORD = "Gladiator12!"
TOKEN_FILE = ".garmin_tokens.json"

def save_tokens(client):
    """Save OAuth tokens to file for reuse"""
    tokens = {
        'oauth1_token': client.garth.oauth1_token,
        'oauth2_token': client.garth.oauth2_token,
        'saved_at': datetime.now().isoformat()
    }
    with open(TOKEN_FILE, 'w') as f:
        json.dump(tokens, f, indent=2)
    print(f"💾 Tokens saved to {TOKEN_FILE}")

def load_tokens():
    """Load saved tokens if they exist"""
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'r') as f:
            return json.load(f)
    return None

def login_with_saved_tokens():
    """Try to login with saved tokens first"""
    tokens = load_tokens()
    if tokens:
        print("🔄 Trying saved tokens...")
        client = Garmin(EMAIL, PASSWORD)
        try:
            # Restore tokens
            client.garth.oauth1_token = tokens['oauth1_token']
            client.garth.oauth2_token = tokens['oauth2_token']
            # Test with a simple API call
            client.get_full_name()
            print("✅ Saved tokens worked!")
            return client
        except Exception as e:
            print(f"⚠️ Saved tokens failed: {e}")
            print("🔐 Need fresh login with MFA")
            return None
    return None

def get_mfa_from_email():
    """Fetch MFA code from Gmail"""
    import subprocess
    try:
        # Search for latest Garmin MFA email
        result = subprocess.run(
            ['gog', 'gmail', 'messages', 'search', 
             'from:garmin.com newer_than:5m', '--max', '1', '--json'],
            capture_output=True, text=True, timeout=30
        )
        # This gets the email ID but not the body
        # We'd need to fetch the email content
        print("📧 Found MFA email, but need to extract code...")
        return None
    except Exception as e:
        print(f"⚠️ Could not fetch MFA from email: {e}")
        return None

def main():
    # Try saved tokens first
    client = login_with_saved_tokens()
    
    if not client:
        # Fresh login required
        print("🔄 Fresh login required")
        
        # Try to get MFA from email
        mfa = get_mfa_from_email()
        
        if not mfa:
            # Fall back to manual entry
            mfa = input("🔐 Enter MFA code (or check your email): ").strip()
        
        # Login with MFA
        import garth.sso as sso_module
        original_login = sso_module.login
        def patched_login(username, password, client=None, prompt_mfa=None):
            return original_login(username, password, client=client, prompt_mfa=lambda: mfa)
        sso_module.login = patched_login
        
        client = Garmin(EMAIL, PASSWORD)
        client.login()
        print("✅ Login successful!")
        
        # Save tokens for next time
        save_tokens(client)
    
    return client

if __name__ == '__main__':
    client = main()
    print(f"👤 Authenticated as: {client.get_full_name()}")