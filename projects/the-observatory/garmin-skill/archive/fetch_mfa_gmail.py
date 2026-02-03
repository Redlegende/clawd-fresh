#!/usr/bin/env python3
"""Fetch MFA code from Gmail API"""
import os
import json
import base64
import re
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
CREDENTIALS_PATH = os.path.expanduser('~/Library/Application Support/gogcli/client_secrets.json')
TOKEN_PATH = os.path.expanduser('~/Library/Application Support/gogcli/token.json')

def get_service():
    creds = None
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_PATH):
                print(f"Credentials not found at {CREDENTIALS_PATH}")
                return None
            
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save token
        with open(TOKEN_PATH, 'w') as token:
            token.write(creds.to_json())
    
    return build('gmail', 'v1', credentials=creds)

def get_mfa_code():
    service = get_service()
    if not service:
        return None
    
    # Search for latest Garmin MFA email
    results = service.users().messages().list(
        userId='me',
        q='from:garmin.com subject:"Your Security Passcode"',
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
    
    # Extract body from payload
    payload = msg['payload']
    body_text = ""
    
    def get_body(parts):
        for part in parts:
            if part.get('parts'):
                result = get_body(part['parts'])
                if result:
                    return result
            if part.get('mimeType') == 'text/plain':
                data = part.get('body', {}).get('data', '')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8')
        return None
    
    if 'parts' in payload:
        body_text = get_body(payload['parts']) or ""
    else:
        data = payload.get('body', {}).get('data', '')
        if data:
            body_text = base64.urlsafe_b64decode(data).decode('utf-8')
    
    # Extract 6-digit MFA code
    match = re.search(r'\b(\d{6})\b', body_text)
    if match:
        return match.group(1)
    
    return None

if __name__ == '__main__':
    mfa = get_mfa_code()
    if mfa:
        print(mfa)
    else:
        print("Could not fetch MFA code", file=os.sys.stderr)
        exit(1)
