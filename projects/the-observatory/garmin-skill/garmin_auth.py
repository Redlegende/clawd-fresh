#!/usr/bin/env python3
"""
Garmin Connect Authentication & Data Fetcher
For The Observatory Fitness Lab
"""
import os
import sys
import json
from datetime import datetime, timedelta
from getpass import getpass

def get_garmin_client():
    """Initialize Garmin Connect client with credentials."""
    try:
        from garminconnect import Garmin
    except ImportError:
        print("ERROR: garminconnect not installed. Run: pip install garminconnect")
        sys.exit(1)
    
    # Check for environment variables first
    username = os.environ.get('GARMIN_USERNAME')
    password = os.environ.get('GARMIN_PASSWORD')
    
    # If not in env, prompt (only for manual runs)
    if not username:
        username = input("Garmin Connect username (email): ").strip()
    if not password:
        password = getpass("Garmin Connect password: ")
    
    try:
        client = Garmin(username, password)
        client.login()
        print(f"✅ Authenticated as: {username}")
        return client
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        return None

def fetch_fitness_data(client, days=7):
    """Fetch fitness metrics from Garmin Connect."""
    if not client:
        print("ERROR: No authenticated client")
        return None
    
    data = {
        'fetched_at': datetime.now().isoformat(),
        'days': days,
        'metrics': []
    }
    
    try:
        # Get user summary
        user = client.get_full_name()
        print(f"📊 Fetching data for: {user}")
        
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            date_str = date.strftime('%Y-%m-%d')
            
            daily = {
                'date': date_str,
                'body_battery': None,
                'vo2_max': None,
                'hrv': None,
                'sleep_score': None,
                'resting_hr': None,
                'steps': None,
                'calories': None
            }
            
            try:
                # Body Battery
                bb = client.get_body_battery(date_str)
                if bb:
                    daily['body_battery'] = bb[-1].get('charged', bb[-1].get('bodyBatteryValues', [None])[0]) if isinstance(bb, list) else None
            except:
                pass
            
            try:
                # Sleep data
                sleep = client.get_sleep_data(date_str)
                if sleep and 'dailySleepDTO' in sleep:
                    daily['sleep_score'] = sleep['dailySleepDTO'].get('sleepScore')
            except:
                pass
            
            try:
                # Heart rate data
                hr = client.get_heart_rates(date_str)
                if hr:
                    daily['resting_hr'] = hr.get('restingHeartRate')
            except:
                pass
            
            try:
                # VO2 Max (last available)
                if i == 0:  # Only fetch once
                    vo2 = client.get_max_metrics(date_str)
                    if vo2:
                        daily['vo2_max'] = vo2[0].get('vo2Max') if isinstance(vo2, list) else None
            except:
                pass
            
            try:
                # HRV status
                hrv = client.get_hrv_data(date_str)
                if hrv and 'hrvSummary' in hrv:
                    daily['hrv'] = hrv['hrvSummary'].get('weeklyAvg')
            except:
                pass
            
            try:
                # Steps
                steps_data = client.get_steps_data(date_str)
                if steps_data:
                    daily['steps'] = steps_data[0].get('steps') if isinstance(steps_data, list) else None
            except:
                pass
            
            data['metrics'].append(daily)
            print(f"  ✓ {date_str}: Sleep={daily['sleep_score']}, BB={daily['body_battery']}, VO2={daily['vo2_max']}")
        
        return data
        
    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python garmin_auth.py <command>")
        print("Commands:")
        print("  login     - Test authentication")
        print("  fetch [n] - Fetch last n days of data (default: 7)")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'login':
        client = get_garmin_client()
        if client:
            print("\n✅ Garmin authentication SUCCESSFUL")
            # Try to fetch basic user info
            try:
                full_name = client.get_full_name()
                print(f"   User: {full_name}")
            except:
                pass
        else:
            print("\n❌ Garmin authentication FAILED")
            sys.exit(1)
    
    elif command == 'fetch':
        days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
        client = get_garmin_client()
        if client:
            data = fetch_fitness_data(client, days)
            if data:
                # Save to file
                output_file = f"garmin_data_{datetime.now().strftime('%Y%m%d')}.json"
                with open(output_file, 'w') as f:
                    json.dump(data, f, indent=2)
                print(f"\n💾 Data saved to: {output_file}")
        else:
            print("❌ Cannot fetch without authentication")
            sys.exit(1)
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == '__main__':
    main()
