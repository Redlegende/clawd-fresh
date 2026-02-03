#!/usr/bin/env python3
"""Fetch 30 days of Garmin historical data - INTERACTIVE"""
from garminconnect import Garmin
import json
from datetime import datetime, timedelta

EMAIL = "kontakt@kvitfjellhytter.no"
PASSWORD = "Gladiator12!"

print(f"🔄 Logging in as {EMAIL}...")

client = Garmin(EMAIL, PASSWORD)

try:
    client.login()
    print("✅ Login successful!")
except Exception as e:
    print(f"🔐 MFA required!")
    mfa = input("Enter MFA code: ").strip()
    client = Garmin(EMAIL, PASSWORD)
    # Need to patch for MFA
    import garth.sso as sso_module
    original_login = sso_module.login
    def patched_login(username, password, client=None, prompt_mfa=None):
        return original_login(username, password, client=client, prompt_mfa=lambda: mfa)
    sso_module.login = patched_login
    client.login()
    print("✅ Login successful with MFA!")

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
    if i < 3 or i % 3 == 0:
        print(f"  ✓ {date_str}: Sleep={daily['sleep_score']}, BB={daily['body_battery']}, HR={daily['resting_hr']}")

print(f"\n📊 Summary:")
print(f"   Total days: {len(data)}")
print(f"   Days with sleep data: {len([d for d in data if d['sleep_hours']])}")
print(f"   Days with body battery: {len([d for d in data if d['body_battery']])}")
print(f"   Days with HR data: {len([d for d in data if d['resting_hr']])}")

# Save JSON
output_file = f"garmin_data_30days_{datetime.now().strftime('%Y%m%d')}.json"
with open(output_file, 'w') as f:
    json.dump(data, f, indent=2)
print(f"\n💾 Saved to: {output_file}")

# Generate SQL for Supabase
sql_file = f"garmin_upload_30days_{datetime.now().strftime('%Y%m%d')}.sql"
with open(sql_file, 'w') as f:
    f.write("-- Upload 30 days of Garmin data to Supabase\n\n")
    f.write("INSERT INTO fitness_metrics (date, body_battery, vo2_max, sleep_score, sleep_hours, resting_hr, steps) VALUES\n")
    
    sql_lines = []
    for d in data:
        if any([d['body_battery'], d['sleep_hours'], d['resting_hr'], d['steps']]):
            sql = f"    ('{d['date']}', {d['body_battery'] or 'NULL'}, {d['vo2_max'] or 'NULL'}, {d['sleep_score'] or 'NULL'}, {d['sleep_hours'] or 'NULL'}, {d['resting_hr'] or 'NULL'}, {d['steps'] or 'NULL'})"
            sql_lines.append(sql)
    
    f.write(",\n".join(sql_lines))
    f.write("\nON CONFLICT (date) DO UPDATE SET\n")
    f.write("    body_battery = EXCLUDED.body_battery,\n")
    f.write("    vo2_max = EXCLUDED.vo2_max,\n")
    f.write("    sleep_score = EXCLUDED.sleep_score,\n")
    f.write("    sleep_hours = EXCLUDED.sleep_hours,\n")
    f.write("    resting_hr = EXCLUDED.resting_hr,\n")
    f.write("    steps = EXCLUDED.steps,\n")
    f.write("    updated_at = NOW();\n")

print(f"💾 SQL saved to: {sql_file}")
print("\n🎉 Ready to upload to Supabase!")