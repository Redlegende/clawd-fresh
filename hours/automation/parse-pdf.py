#!/usr/bin/env python3
"""
parse-pdf.py
Parse Fåvang Varetaxi PDF to extract driving hours

Usage: parse-pdf.py <pdf_path>
Output: JSON with extracted hours
"""

import sys
import json
import re
from datetime import datetime, timedelta

try:
    import pdfplumber
    PDF_LIB = "pdfplumber"
except ImportError:
    try:
        import PyPDF2
        PDF_LIB = "pypdf2"
    except ImportError:
        print("ERROR: No PDF library found. Install with: pip install pdfplumber", file=sys.stderr)
        sys.exit(1)

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using available library"""
    text = ""
    
    if PDF_LIB == "pdfplumber":
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
                text += "\n"
    else:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
                text += "\n"
    
    return text

def parse_hours(text):
    """Parse hours from taxi PDF text"""
    hours = []
    
    # Common patterns for Norwegian taxi hour formats
    patterns = [
        # Format: 2025-01-27  10:00   18:30   ...   8.5
        r'(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+.*?\s+([\d,]+)',
        # Format: 27.01.2025  10:00 - 18:30 (8.5t)
        r'(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*\(([\d,]+)',
        # Format: Dato: 27/01/25 Fra: 10:00 Til: 18:30
        r'Dato:\s*(\S+)\s+Fra:\s*(\d{2}:\d{2})\s+Til:\s*(\d{2}:\d{2})',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            date_str, start_time, end_time = match[0], match[1], match[2]
            
            # Normalize date format
            try:
                if '-' in date_str:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                elif '.' in date_str:
                    date_obj = datetime.strptime(date_str, '%d.%m.%Y')
                elif '/' in date_str:
                    # Try different formats
                    try:
                        date_obj = datetime.strptime(date_str, '%d/%m/%y')
                    except:
                        date_obj = datetime.strptime(date_str, '%d/%m/%Y')
                else:
                    continue
                    
                hours.append({
                    'date': date_obj.strftime('%Y-%m-%d'),
                    'start': start_time,
                    'end': end_time,
                    'day_of_week': date_obj.strftime('%A')
                })
            except ValueError as e:
                print(f"Warning: Could not parse date {date_str}: {e}", file=sys.stderr)
    
    return hours

def categorize_shifts(hours):
    """Categorize shifts as day or night"""
    for entry in hours:
        end_hour = int(entry['end'].split(':')[0])
        
        if end_hour >= 22:
            entry['type'] = 'night'
            entry['rate'] = 400
        else:
            entry['type'] = 'day'
            entry['rate'] = 300
            
        # Calculate duration
        start = datetime.strptime(entry['start'], '%H:%M')
        end = datetime.strptime(entry['end'], '%H:%M')
        
        if end < start:  # Crosses midnight
            end += timedelta(days=1)
            
        duration = (end - start).total_seconds() / 3600
        entry['hours'] = round(duration, 2)
        entry['amount'] = round(duration * entry['rate'], 2)
    
    return hours

def main():
    if len(sys.argv) < 2:
        print("Usage: parse-pdf.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    try:
        text = extract_text_from_pdf(pdf_path)
        hours = parse_hours(text)
        hours = categorize_shifts(hours)
        
        output = {
            'source': pdf_path,
            'extracted_at': datetime.now().isoformat(),
            'total_entries': len(hours),
            'total_day_hours': sum(h['hours'] for h in hours if h['type'] == 'day'),
            'total_night_hours': sum(h['hours'] for h in hours if h['type'] == 'night'),
            'total_amount': sum(h['amount'] for h in hours),
            'entries': hours
        }
        
        print(json.dumps(output, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
