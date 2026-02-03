#!/usr/bin/env python3
"""Extract MFA code from latest Garmin email"""
import subprocess
import json
import re

# Search for latest Garmin MFA email
result = subprocess.run(
    ['gog', 'gmail', 'messages', 'search', 'from:garmin.com subject:Security', '--max', '1', '--json'],
    capture_output=True, text=True
)

if result.returncode != 0:
    print(f"Error searching: {result.stderr}")
    exit(1)

data = json.loads(result.stdout)
if not data.get('messages'):
    print("No MFA emails found")
    exit(1)

msg = data['messages'][0]
print(f"Found email: {msg['subject']} at {msg['date']}")

# The gog CLI doesn't have a 'get' command for message content
# Let's use a workaround - we can parse the snippet or use gmail API directly
# For now, let's print the message ID so we can use it
print(f"Message ID: {msg['id']}")

# Try to get message via Gmail API using gog with different approach
# Unfortunately gog doesn't support getting full message content easily
# So we'll need to try another approach

# Let's check if there's a way to get the snippet
print("\nNote: gog CLI has limited message retrieval.")
print("You may need to check email manually or use Gmail API directly.")
