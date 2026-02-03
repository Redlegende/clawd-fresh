#!/usr/bin/env python3
"""Interactive Garmin Connect login with MFA support"""
import os
import sys

def main():
    try:
        from garminconnect import Garmin
    except ImportError:
        print("❌ garminconnect not installed")
        print("Run: pip install garminconnect")
        sys.exit(1)
    
    email = input("📧 Garmin email: ").strip()
    password = input("🔑 Garmin password: ").strip()
    
    print(f"\n🔄 Attempting login for {email}...")
    
    try:
        # Try login without MFA first
        client = Garmin(email, password)
        client.login()
        print("✅ Login successful (no MFA needed)")
    except Exception as e:
        error_str = str(e)
        if "MFA" in error_str or " Two" in error_str or "token" in error_str.lower():
            print("🔐 MFA required!")
            mfa_code = input("Enter 6-digit MFA code: ").strip()
            try:
                client = Garmin(email, password)
                client.login(mfa_code)
                print("✅ Login successful with MFA!")
            except Exception as e2:
                print(f"❌ MFA login failed: {e2}")
                sys.exit(1)
        else:
            print(f"❌ Login failed: {e}")
            sys.exit(1)
    
    # Test fetch
    print("\n🔄 Testing data fetch...")
    try:
        full_name = client.get_full_name()
        print(f"✅ Authenticated as: {full_name}")
        
        # Try to get today's stats
        from datetime import datetime
        today = datetime.now().strftime('%Y-%m-%d')
        
        try:
            hr = client.get_heart_rates(today)
            print(f"   Resting HR: {hr.get('restingHeartRate', 'N/A')}")
        except:
            pass
            
        try:
            sleep = client.get_sleep_data(today)
            if sleep and 'dailySleepDTO' in sleep:
                print(f"   Sleep Score: {sleep['dailySleepDTO'].get('sleepScore', 'N/A')}")
        except:
            pass
        
        print("\n🎉 Garmin Connect is working!")
        
    except Exception as e:
        print(f"⚠️ Authenticated but couldn't fetch data: {e}")

if __name__ == '__main__':
    main()