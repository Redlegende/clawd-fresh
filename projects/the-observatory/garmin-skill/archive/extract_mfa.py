#!/usr/bin/env python3
"""Extract MFA code from Gmail using Gmail API"""
import os
import base64
import json
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def get_gmail_service():
    """Get authenticated Gmail service"""
    creds = None
    token_path = os.path.expanduser('~/.config/gog/tokens/gmail.json')
    
    if os.path.exists(token_path):
        with open(token_path, 'r') as f:
            token_data = json.load(f)
            creds = Credentials.from_authorized_user_info(token_data, SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            print("No valid credentials found")
            return None
    
    return build('gmail', 'v1', credentials=creds)

def get_latest_mfa():
    """Get MFA code from latest Garmin email"""
    service = get_gmail_service()
    if not service:
        return None
    
    # Search for Garmin MFA emails
    results = service.users().messages().list(
        userId='me',
        q='from:garmin.com subject:"Security Passcode"',
        maxResults=1
    ).execute()
    
    messages = results.get('messages', [])
    if not messages:
        print("No MFA emails found")
        return None
    
    msg = service.users().messages().get(
        userId='me',
        id=messages[0]['id'],
        format='full'
    ).execute()
    
    # Extract body
    payload = msg['payload']
    body = ""
    
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body'].get('data', '')
                if data:
                    body = base64.urlsafe_b64decode(data).decode('utf-8')
                break
    else:
        data = payload['body'].get('data', '')
        if data:
            body = base64.urlsafe_b64decode(data).decode('utf-8')
    
    # Extract 6-digit code
    import re
    match = re.search(r'\b(\d{6})\b', body)
    if match:
        return match.group(1)
    
    return None

if __name__ == '__main__':
    mfa = get_latest_mfa()
    if mfa:
        print(mfa)
    else:
        print("Could not extract MFA code")
        exit(1)
