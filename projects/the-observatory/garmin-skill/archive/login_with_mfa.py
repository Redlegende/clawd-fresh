#!/usr/bin/env python3
"""Garmin login with MFA code"""
from garminconnect import Garmin

EMAIL = "kontakt@kvitfjellhytter.no"
PASSWORD = "Gladiator12!"
MFA_CODE = "555962"

print(f"🔄 Logging in as {EMAIL}...")

try:
    # Create client
    client = Garmin(EMAIL, PASSWORD)
    
    # Login with MFA callback
    def mfa_callback():
        return MFA_CODE
    
    client.login(mfa_callback)
    print("✅ Login successful!")
    
    # Test fetch
    full_name = client.get_full_name()
    print(f"👤 User: {full_name}")
    
    # Save session tokens for future use
    import json
    tokens = {
        'oauth1_token': str(client.garth.oauth1_token) if client.garth.oauth1_token else None,
        'oauth2_token': str(client.garth.oauth2_token) if client.garth.oauth2_token else None,
    }
    with open('.garmin_session.json', 'w') as f:
        json.dump(tokens, f, indent=2)
    print("💾 Session saved to .garmin_session.json")
    
    # Fetch today's data
    from datetime import datetime
    today = datetime.now().strftime('%Y-%m-%d')
    print(f"\n📊 Fetching data for {today}...")
    
    try:
        hr = client.get_heart_rates(today)
        print(f"   Resting HR: {hr.get('restingHeartRate', 'N/A')}")
    except Exception as e:
        print(f"   HR: Error - {e}")
    
    try:
        sleep = client.get_sleep_data(today)
        if sleep and 'dailySleepDTO' in sleep:
            print(f"   Sleep Score: {sleep['dailySleepDTO'].get('sleepScore', 'N/A')}")
    except Exception as e:
        print(f"   Sleep: Error - {e}")
    
    try:
        bb = client.get_body_battery(today)
        if bb and isinstance(bb, list) and len(bb) > 0:
            print(f"   Body Battery: {bb[-1].get('charged', 'N/A')}")
    except Exception as e:
        print(f"   Body Battery: Error - {e}")
    
    try:
        vo2 = client.get_max_metrics(today)
        if vo2 and isinstance(vo2, list) and len(vo2) > 0:
            print(f"   VO2 Max: {vo2[0].get('vo2Max', 'N/A')}")
    except Exception as e:
        print(f"   VO2 Max: Error - {e}")
    
    print("\n🎉 Garmin Connect is working!")
    
except Exception as e:
    print(f"❌ Login failed: {e}")
    import traceback
    traceback.print_exc()