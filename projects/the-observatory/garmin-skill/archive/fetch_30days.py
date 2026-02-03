#!/usr/bin/env python3
"""Fetch 30 days of Garmin historical data"""
from garminconnect import Garmin
import json
from datetime import datetime, timedelta
import garth.sso as sso_module

EMAIL = "kontakt@kvitfjellhytter.no"
PASSWORD = "Gladiator12!"

# Patch MFA handling
original_login = sso_module.login
def patched_login(username, password, client=None, prompt_mfa=None):
    return original_login(username, password, client=client, prompt_mfa=lambda: "MFA_WILL_BE_PROVIDED")
sso_module.login = patched_login

print(f"🔄 Logging in as {EMAIL}...")

client = Garmin(EMAIL, PASSWORD)

try:
    client.login()
    print("✅ Login successful (no MFA needed)")
except Exception as e:
    print(f"🔐 MFA required: {e}")
    # For manual MFA entry
    import sys
    sys.exit(1)

print(f"👤 Authenticated as: {client.get_full_name()}")

# Fetch 30 days
days = 30
print(f"\n📊 Fetching last {days} days of data...")

data = []
for i in range(days):
    date = datetime.now() - timedelta(days=i)
    date_str = date.strftime('%Y-%m-%d')
    
    daily = {
        'date': date_str,
        'body_battery': None,
        'vo2_max': None,
        'hrv': None,
        'sleep_score': None,
        'sleep_hours': None,
        'resting_hr': None,
        'steps': None,
        'calories_burned': None
    }
    
    try:
        hr = client.get_heart_rates(date_str)
        daily['resting_hr'] = hr.get('restingHeartRate')
    except:
        pass
    
    try:
        sleep = client.get_sleep_data(date_str)
        if sleep and 'dailySleepDTO' in sleep:
            dto = sleep['dailySleepDTO']
            daily['sleep_score'] = dto.get('sleepScore')
            if 'sleepTimeSeconds' in dto:
                daily['sleep_hours'] = round(dto['sleepTimeSeconds'] / 3600, 2)
    except:
        pass
    
    try:
        bb = client.get_body_battery(date_str)
        if bb and isinstance(bb, list) and len(bb) > 0:
            daily['body_battery'] = bb[-1].get('charged')
    except:
        pass
    
    try:
        if i == 0:  # VO2 max doesn't change daily
            vo2 = client.get_max_metrics(date_str)
            if vo2 and isinstance(vo2, list) and len(vo2) > 0:
                daily['vo2_max'] = vo2[0].get('vo2Max')
    except:
        pass
    
    try:
        steps_data = client.get_steps_data(date_str)
        if steps_data and isinstance(steps_data, list) and len(steps_data) > 0:
            daily['steps'] = steps_data[0].get('steps')
    except:
        pass
    
    data.append(daily)
    if i < 5 or i % 5 == 0:  # Print progress
        print(f"  ✓ {date_str}: Sleep={daily['sleep_score']}, BB={daily['body_battery']}, HR={daily['resting_hr']}, VO2={daily['vo2_max']}")

# Save JSON
output_file = f"garmin_data_30days_{datetime.now().strftime('%Y%m%d')}.json"
with open(output_file, 'w') as f:
    json.dump(data, f, indent=2)
print(f"\n💾 Saved to: {output_file}")

# Generate SQL
print("\n📝 SQL INSERT statements generated.")
print("Run these in Supabase SQL Editor:")
print("-" * 60)

sql_lines = []
for d in data:
    if any([d['body_battery'], d['sleep_hours'], d['resting_hr'], d['steps']]):
        sql = f"('{d['date']}', {d['body_battery'] or 'NULL'}, {d['vo2_max'] or 'NULL'}, {d['sleep_score'] or 'NULL'}, {d['sleep_hours'] or 'NULL'}, {d['resting_hr'] or 'NULL'}, {d['steps'] or 'NULL'})"
        sql_lines.append(sql)

print(f"INSERT INTO fitness_metrics (date, body_battery, vo2_max, sleep_score, sleep_hours, resting_hr, steps) VALUES")
print(",\n".join(sql_lines[:10]))  # Show first 10
if len(sql_lines) > 10:
    print(f"... and {len(sql_lines) - 10} more rows")

print("\nON CONFLICT (date) DO UPDATE SET")
print("    body_battery = EXCLUDED.body_battery,")
print("    vo2_max = EXCLUDED.vo2_max,")
print("    sleep_score = EXCLUDED.sleep_score,")
print("    sleep_hours = EXCLUDED.sleep_hours,")
print("    resting_hr = EXCLUDED.resting_hr,")
print("    steps = EXCLUDED.steps,")
print("    updated_at = NOW();")

print(f"\n🎉 Fetched {len(data)} days of data")
print(f"   Days with data: {len(sql_lines)}")