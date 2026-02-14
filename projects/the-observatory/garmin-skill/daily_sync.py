#!/usr/bin/env python3
"""Garmin fetch with token persistence + Supabase upload"""
from garminconnect import Garmin
import json
import os
import sys
from datetime import datetime, timedelta

EMAIL = "kontakt@kvitfjellhytter.no"
PASSWORD = "Gladiator12!"
TOKEN_DIR = ".garth_tokens"
MFA_FILE = ".mfa_code.txt"

SUPABASE_URL = "https://vhrmxtolrrcrhrxljemp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NDAwNCwiZXhwIjoyMDg1NTUwMDA0fQ.jnZEhrFl823cgQHubVZv_-qRwvS8aO90Yosp_jxY2cs"

def get_mfa_code():
    """Get MFA from file or env"""
    mfa = os.environ.get('GARMIN_MFA')
    if mfa:
        return mfa
    if os.path.exists(MFA_FILE):
        with open(MFA_FILE, 'r') as f:
            return f.read().strip()
    return None

def save_tokens(client):
    """Save OAuth tokens using garth's built-in serialization"""
    try:
        client.garth.dump(TOKEN_DIR)
        print(f"💾 Tokens saved to {TOKEN_DIR}/")
    except Exception as e:
        print(f"⚠️ Could not save tokens: {e}")

def login_with_tokens():
    """Try to login with saved tokens first"""
    if not os.path.exists(TOKEN_DIR):
        print("ℹ️ No saved tokens found")
        return None
    
    print("🔄 Trying saved tokens...")
    try:
        client = Garmin(EMAIL, PASSWORD)
        client.garth.load(TOKEN_DIR)
        name = client.get_full_name()
        print(f"✅ Saved tokens worked! ({name})")
        save_tokens(client)  # Refresh saved tokens
        return client
    except Exception as e:
        print(f"⚠️ Saved tokens failed: {e}")
        return None

def login_with_mfa():
    """Login with MFA code"""
    mfa = get_mfa_code()
    if not mfa:
        return None
    
    print(f"🔐 Logging in with MFA code: {mfa}")
    client = Garmin(EMAIL, PASSWORD)
    
    import garth.sso as sso_module
    original_login = sso_module.login
    def patched_login(username, password, client=None, prompt_mfa=None):
        return original_login(username, password, client=client, prompt_mfa=lambda: mfa)
    sso_module.login = patched_login
    try:
        client.login()
        print("✅ Login successful with MFA!")
        save_tokens(client)
        # Cleanup MFA file
        if os.path.exists(MFA_FILE):
            os.remove(MFA_FILE)
        return client
    except Exception as e:
        print(f"❌ MFA login failed: {e}")
        return None
    finally:
        sso_module.login = original_login

def login_fresh():
    """Try direct login without MFA"""
    print("🔄 Trying direct login (no MFA)...")
    client = Garmin(EMAIL, PASSWORD)
    try:
        client.login()
        print("✅ Direct login successful!")
        save_tokens(client)
        return client
    except Exception as e:
        print(f"⚠️ Direct login failed: {e}")
        return None

def fetch_data(days=7):
    """Fetch fitness data from Garmin"""
    
    # Try methods in order: saved tokens → direct login → MFA
    client = login_with_tokens()
    if not client:
        client = login_fresh()
    if not client:
        client = login_with_mfa()
    if not client:
        print("❌ All login methods failed")
        print(f"📧 Create {MFA_FILE} with your 6-digit MFA code, then re-run")
        return None
    
    print(f"👤 Authenticated: {client.get_full_name()}")
    
    # Fetch data
    print(f"\n📊 Fetching last {days} days...")
    data = []
    
    for i in range(days):
        date = datetime.now() - timedelta(days=i)
        date_str = date.strftime('%Y-%m-%d')
        
        daily = {
            'date': date_str,
            'body_battery': None,
            'vo2_max': None,
            'sleep_score': None,
            'sleep_hours': None,
            'resting_hr': None,
            'steps': None
        }
        
        try:
            hr = client.get_heart_rates(date_str)
            daily['resting_hr'] = hr.get('restingHeartRate')
        except: pass
        
        try:
            sleep = client.get_sleep_data(date_str)
            if sleep and 'dailySleepDTO' in sleep:
                dto = sleep['dailySleepDTO']
                daily['sleep_score'] = dto.get('sleepScore')
                if 'sleepTimeSeconds' in dto:
                    daily['sleep_hours'] = round(dto['sleepTimeSeconds'] / 3600, 2)
        except: pass
        
        try:
            bb = client.get_body_battery(date_str)
            if bb and isinstance(bb, list) and len(bb) > 0:
                daily['body_battery'] = bb[-1].get('charged')
        except: pass
        
        try:
            if i == 0:
                vo2 = client.get_max_metrics(date_str)
                if vo2 and isinstance(vo2, list) and len(vo2) > 0:
                    daily['vo2_max'] = vo2[0].get('vo2Max')
        except: pass
        
        try:
            steps_data = client.get_steps_data(date_str)
            if steps_data and isinstance(steps_data, list) and len(steps_data) > 0:
                daily['steps'] = steps_data[0].get('steps')
        except: pass
        
        data.append(daily)
        if i % 5 == 0:
            print(f"  {date_str}: BB={daily['body_battery']}, Sleep={daily['sleep_hours']}, HR={daily['resting_hr']}")
    
    print(f"\n✅ Fetched {len(data)} days")
    
    # Save to file
    output_file = f"garmin_data_{datetime.now().strftime('%Y%m%d')}.json"
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"💾 Saved to {output_file}")
    
    return data

def upload_to_supabase(data):
    """Upload data to Supabase fitness_metrics table"""
    print(f"\n📤 Uploading {len(data)} days to Supabase...")
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        records = []
        for d in data:
            if any([d['body_battery'], d['sleep_hours'], d['resting_hr'], d['steps']]):
                records.append(d)
        
        if not records:
            print("⚠️ No records with data to upload")
            return 0
        
        result = supabase.table('fitness_metrics').upsert(records).execute()
        print(f"✅ Uploaded {len(records)} records to Supabase")
        return len(records)
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return 0

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--days', type=int, default=7, help='Number of days to fetch')
    args = parser.parse_args()
    
    data = fetch_data(days=args.days)
    
    if data:
        uploaded = upload_to_supabase(data)
        print(f"\n🎉 Daily sync complete! ({uploaded} records uploaded)")
        sys.exit(0)
    else:
        print("\n❌ Daily sync failed")
        print(f"🔧 Create {MFA_FILE} with your 6-digit code and re-run")
        sys.exit(1)