#!/usr/bin/env python3
"""Garmin fetch with hardcoded MFA"""
from garminconnect import Garmin
import json
from datetime import datetime, timedelta
import garth.sso as sso_module

EMAIL = "kontakt@kvitfjellhytter.no"
PASSWORD = "Gladiator12!"
MFA_CODE = "359550"

print(f"🔄 Logging in as {EMAIL}...")

# Patch MFA
original_login = sso_module.login
def patched_login(username, password, client=None, prompt_mfa=None):
    return original_login(username, password, client=client, prompt_mfa=lambda: MFA_CODE)
sso_module.login = patched_login

client = Garmin(EMAIL, PASSWORD)
client.login()
print(f"✅ Authenticated as: {client.get_full_name()}")

# Fetch 7 days
days = 7
print(f"\n📊 Fetching last {days} days...")

data = []
for i in range(days):
    date = datetime.now() - timedelta(days=i)
    date_str = date.strftime('%Y-%m-%d')
    
    daily = {'date': date_str, 'body_battery': None, 'vo2_max': None, 'hrv': None, 
             'sleep_score': None, 'sleep_hours': None, 'resting_hr': None, 'steps': None}
    
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
    print(f"  ✓ {date_str}: Sleep={daily['sleep_score']}, HR={daily['resting_hr']}, VO2={daily['vo2_max']}")

# Save
with open(f'garmin_data_{datetime.now().strftime("%Y%m%d")}.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"\n💾 Saved {len(data)} days of data")
print(data)