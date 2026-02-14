#!/usr/bin/env python3
"""Fetch Garmin MFA code via IMAP"""
import imaplib
import email
import re
import time
import os

def fetch_garmin_mfa_code():
    """Fetch MFA code from Gmail via IMAP"""
    print("🔍 Checking Gmail via IMAP for Garmin MFA code...")
    
    # Get credentials from environment or prompt
    email_user = os.environ.get('GMAIL_USER', 'kontakt@kvitfjellhytter.no')
    # For app-specific password, we'd need to set this up
    email_pass = os.environ.get('GMAIL_APP_PASSWORD')
    
    if not email_pass:
        print("❌ GMAIL_APP_PASSWORD not set")
        print("💡 To enable: Google Account → Security → 2-Step Verification → App passwords")
        return None
    
    try:
        # Connect to Gmail IMAP
        mail = imaplib.IMAP4_SSL('imap.gmail.com')
        mail.login(email_user, email_pass)
        mail.select('inbox')
        
        # Search for recent Garmin emails
        # Look for unread emails from Garmin in last hour
        search_criteria = '(UNSEEN FROM "alerts@account.garmin.com" SUBJECT "Security Passcode")'
        _, search_data = mail.search(None, search_criteria)
        
        email_ids = search_data[0].split()
        
        if not email_ids:
            print("📭 No unread Garmin MFA emails found")
            return None
        
        print(f"📧 Found {len(email_ids)} MFA email(s)")
        
        # Get the most recent email
        latest_email_id = email_ids[-1]
        _, msg_data = mail.fetch(latest_email_id, '(RFC822)')
        
        # Parse email
        raw_email = msg_data[0][1]
        msg = email.message_from_bytes(raw_email)
        
        # Get body
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                if content_type == 'text/plain':
                    body = part.get_payload(decode=True).decode('utf-8')
                    break
        else:
            body = msg.get_payload(decode=True).decode('utf-8')
        
        # Look for 6-digit code
        code_match = re.search(r'\b(\d{6})\b', body)
        if code_match:
            code = code_match.group(1)
            print(f"✅ Found MFA code: {code}")
            
            # Mark as read
            mail.store(latest_email_id, '+FLAGS', '\\Seen')
            
            mail.close()
            mail.logout()
            return code
        
        mail.close()
        mail.logout()
        print("🔍 Could not find 6-digit code in email")
        return None
        
    except Exception as e:
        print(f"❌ IMAP error: {e}")
        return None

def wait_and_fetch_mfa(max_attempts=6, delay_seconds=10):
    """Wait for MFA email and fetch code"""
    print(f"⏳ Waiting for MFA email (max {max_attempts} attempts)...")
    
    for attempt in range(1, max_attempts + 1):
        print(f"🔄 Attempt {attempt}/{max_attempts}...")
        
        code = fetch_garmin_mfa_code()
        if code:
            return code
        
        if attempt < max_attempts:
            print(f"⏱️ Waiting {delay_seconds} seconds...")
            time.sleep(delay_seconds)
    
    print("❌ Could not find MFA code")
    return None

if __name__ == '__main__':
    code = wait_and_fetch_mfa()
    if code:
        print(f"\n🎉 MFA Code: {code}")
        with open('.mfa_code.txt', 'w') as f:
            f.write(code)
        print("💾 Saved to .mfa_code.txt")
    else:
        print("\n❌ Failed to get MFA code")
        exit(1)
