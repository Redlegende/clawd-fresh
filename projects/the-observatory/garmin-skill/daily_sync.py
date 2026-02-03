#!/usr/bin/env python3
"""Garmin fetch with token persistence - NO MFA NEEDED"""
from garminconnect import Garmin
import json
import os
from datetime import datetime, timedelta

EMAIL = "kontakt@kvitfjellhytter.no"
PASSWORD = "Gladiator12!"
TOKEN_FILE = ".garmin_tokens.json"

def load_tokens():
    """Load saved tokens if they exist"""
    if os.path.exists(TOKEN_FILE):
        try:
            with open(TOKEN_FILE, 'r') as f:
                return json.load(f)
        except:
            return None
    return None

def save_tokens(client):
    """Save OAuth tokens to file"""
    try:
        tokens = {
            'oauth1_token': str(client.garth.oauth1_token),
            'oauth2_token': str(client.garth.oauth2_token),
            'saved_at': datetime.now().isoformat()
        }
        with open(TOKEN_FILE, 'w') as f:
            json.dump(tokens, f, indent=2)
        print(f"💾 Tokens saved")
    except Exception as e:
        print(f"⚠️ Could not save tokens: {e}")

def login_with_tokens():
    """Try to login with saved tokens first"""
    tokens = load_tokens()
    if not tokens:
        print("ℹ️ No saved tokens found")
        return None
    
    print("🔄 Trying saved tokens...")
    client = Garmin(EMAIL, PASSWORD)
    
    try:
        # Restore tokens
        from garth.http import OAuth1Token, OAuth2Token
        
        # Parse the saved token strings
        oauth1_str = tokens['oauth1_token']
        oauth2_str = tokens['oauth2_token']
        
        # For now, just try a direct login test
        client.garth.oauth1_token = oauth1_str
        client.garth.oauth2_token = oauth2_str
        
        # Test if tokens work
        client.get_full_name()
        print("✅ Saved tokens worked!")
        return client
        
    except Exception as e:
        print(f"⚠️ Saved tokens failed: {e}")
        print("🔐 Will need MFA for fresh login")
        return None

def fetch_data(days=7):
    """Fetch fitness data from Garmin"""
    
    # Try tokens first
    client = login_with_tokens()
    
    if not client:
        # Need fresh login - but we should NEVER get here if tokens are working
        print("❌ No valid tokens and no MFA provided")
        print("📧 Check for MFA email, or tokens need refresh")
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

if __name__ == '__main__':
    # Daily sync - uses saved tokens, NO MFA
    data = fetch_data(days=7)  # Last 7 days for daily sync
    
    if data:
        print("\n🎉 Daily sync complete!")
        print("📤 Next: Upload to Supabase")
    else:
        print("\n❌ Daily sync failed")
        print("🔧 Manual intervention needed")