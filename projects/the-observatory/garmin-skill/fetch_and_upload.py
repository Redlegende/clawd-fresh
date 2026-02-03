#!/usr/bin/env python3
"""
Complete 30-day Garmin fetch and upload to Supabase
Run this after creating .mfa_code.txt with the 6-digit code
"""
from garminconnect import Garmin
import json
import os
import sys
from datetime import datetime, timedelta

# Configuration
EMAIL = "kontakt@kvitfjellhytter.no"
PASSWORD = "Gladiator12!"
MFA_FILE = ".mfa_code.txt"
TOKEN_FILE = ".garmin_tokens.json"

# Supabase config
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

def login():
    """Login to Garmin with MFA support"""
    print(f"🔄 Logging in as {EMAIL}...")
    
    mfa = get_mfa_code()
    client = Garmin(EMAIL, PASSWORD)
    
    if mfa:
        print(f"🔐 Using MFA code: {mfa}")
        # Patch garth.sso.login for MFA
        import garth.sso as sso_module
        original_login = sso_module.login
        def patched_login(username, password, client=None, prompt_mfa=None):
            return original_login(username, password, client=client, prompt_mfa=lambda: mfa)
        sso_module.login = patched_login
        try:
            client.login()
            print("✅ Login successful with MFA!")
        except Exception as e:
            print(f"❌ Login failed: {e}")
            sys.exit(1)
        finally:
            sso_module.login = original_login
    else:
        try:
            client.login()
            print("✅ Login successful!")
        except Exception as e:
            print(f"🔐 MFA required! Please set GARMIN_MFA or create {MFA_FILE}")
            sys.exit(1)
    
    return client

def save_tokens(client):
    """Save OAuth tokens for future use"""
    tokens = {
        'oauth1_token': str(client.garth.oauth1_token) if client.garth.oauth1_token else None,
        'oauth2_token': str(client.garth.oauth2_token) if client.garth.oauth2_token else None,
        'saved_at': datetime.now().isoformat()
    }
    with open(TOKEN_FILE, 'w') as f:
        json.dump(tokens, f, indent=2)
    print(f"💾 Tokens saved to {TOKEN_FILE}")

def fetch_30_days(client):
    """Fetch 30 days of fitness data"""
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
            'sleep_score': None,
            'sleep_hours': None,
            'resting_hr': None,
            'steps': None
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
            if i == 0:  # VO2 max once
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
        if i < 3 or i % 5 == 0:
            print(f"  ✓ {date_str}: Sleep={daily['sleep_hours']}h, BB={daily['body_battery']}, HR={daily['resting_hr']}, Steps={daily['steps']}")
    
    return data

def save_json(data):
    """Save data to JSON file"""
    output_file = f"garmin_data_30days_{datetime.now().strftime('%Y%m%d')}.json"
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"\n💾 Saved to: {output_file}")
    return output_file

def generate_sql(data):
    """Generate SQL for Supabase upload"""
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
    return sql_file, len(sql_lines)

def upload_to_supabase(data):
    """Upload directly to Supabase using REST API"""
    print(f"\n📤 Uploading to Supabase...")
    
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Prepare records
        records = []
        for d in data:
            record = {
                'date': d['date'],
                'body_battery': d['body_battery'],
                'vo2_max': d['vo2_max'],
                'sleep_score': d['sleep_score'],
                'sleep_hours': d['sleep_hours'],
                'resting_hr': d['resting_hr'],
                'steps': d['steps']
            }
            records.append(record)
        
        # Upload in batches of 100 (safety rule)
        BATCH_SIZE = 100
        total_uploaded = 0
        
        for i in range(0, len(records), BATCH_SIZE):
            batch = records[i:i+BATCH_SIZE]
            # Use upsert for idempotency
            result = supabase.table('fitness_metrics').upsert(batch).execute()
            total_uploaded += len(batch)
            print(f"  ✓ Uploaded batch {i//BATCH_SIZE + 1}: {len(batch)} records")
        
        print(f"✅ Total uploaded: {total_uploaded} records")
        return total_uploaded
        
    except ImportError:
        print("⚠️ supabase-py not installed, skipping direct upload")
        print("   Use the SQL file to upload manually")
        return 0
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return 0

def verify_upload(expected_count):
    """Verify upload by counting rows"""
    print(f"\n🔍 Verifying upload...")
    
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Count total rows
        result = supabase.table('fitness_metrics').select('*', count='exact').execute()
        actual_count = result.count
        
        # Count rows from last 30 days
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        recent_result = supabase.table('fitness_metrics')\
            .select('*', count='exact')\
            .gte('date', thirty_days_ago)\
            .execute()
        recent_count = recent_result.count
        
        print(f"   Total rows in table: {actual_count}")
        print(f"   Rows from last 30 days: {recent_count}")
        
        if recent_count >= expected_count * 0.8:  # 80% threshold
            print(f"✅ Verification passed!")
            return True
        else:
            print(f"⚠️ Verification warning: expected ~{expected_count}, found {recent_count}")
            return False
            
    except Exception as e:
        print(f"⚠️ Could not verify: {e}")
        return False

def cleanup():
    """Remove MFA file for security"""
    if os.path.exists(MFA_FILE):
        os.remove(MFA_FILE)
        print(f"🗑️  Cleaned up {MFA_FILE}")

def main():
    print("="*60)
    print("🦅 DATA AGENT: Garmin 30-Day Fetch")
    print("="*60)
    
    # Check for MFA
    if not get_mfa_code():
        print(f"\n❌ No MFA code found!")
        print(f"   Create {MFA_FILE} with the 6-digit code from your email")
        print(f"   Or set GARMIN_MFA environment variable")
        sys.exit(1)
    
    # Login
    client = login()
    print(f"👤 Authenticated as: {client.get_full_name()}")
    
    # Save tokens
    save_tokens(client)
    
    # Fetch data
    data = fetch_30_days(client)
    
    # Summary
    print(f"\n📊 Summary:")
    print(f"   Total days: {len(data)}")
    print(f"   Days with sleep data: {len([d for d in data if d['sleep_hours']])}")
    print(f"   Days with body battery: {len([d for d in data if d['body_battery']])}")
    print(f"   Days with HR data: {len([d for d in data if d['resting_hr']])}")
    print(f"   Days with steps: {len([d for d in data if d['steps']])}")
    
    # Save files
    json_file = save_json(data)
    sql_file, sql_count = generate_sql(data)
    
    # Upload to Supabase
    uploaded = upload_to_supabase(data)
    
    # Verify
    if uploaded > 0:
        verify_upload(uploaded)
    
    # Cleanup
    cleanup()
    
    print("\n" + "="*60)
    print("🎉 COMPLETE!")
    print("="*60)
    print(f"   JSON: {json_file}")
    print(f"   SQL: {sql_file}")
    print(f"   Tokens: {TOKEN_FILE}")
    print(f"   Days fetched: {len(data)}")
    print(f"   Records with data: {sql_count}")
    if uploaded > 0:
        print(f"   Uploaded to Supabase: {uploaded} records")

if __name__ == '__main__':
    main()
