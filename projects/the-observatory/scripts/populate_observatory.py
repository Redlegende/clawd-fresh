#!/usr/bin/env python3
"""
Populate Observatory tables with current projects and tasks
"""
import requests
import json

TOKEN = "sbp_2b1f19d25ca514fb6bc03e77ec225c682e836d66"
PROJECT_ID = "vhrmxtolrrcrhrxljemp"
BASE_URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def insert_data(table, data, description=""):
    """Insert data via REST API"""
    url = f"https://{PROJECT_ID}.supabase.co/rest/v1/{table}"
    api_headers = {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NDAwNCwiZXhwIjoyMDg1NTUwMDA0fQ.jnZEhrFl823cgQHubVZv_-qRwvS8aO90Yosp_jxY2cs",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NDAwNCwiZXhwIjoyMDg1NTUwMDA0fQ.jnZEhrFl823cgQHubVZv_-qRwvS8aO90Yosp_jxY2cs",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    try:
        resp = requests.post(url, headers=api_headers, json=data, timeout=30)
        if resp.status_code in [200, 201, 204]:
            print(f"  ✓ {description}")
            return True
        else:
            print(f"  ✗ {description}: {resp.status_code} - {resp.text[:100]}")
            return False
    except Exception as e:
        print(f"  ✗ {description}: {e}")
        return False

print("🚀 Populating Observatory Database\n")

# Insert Projects
print("1. Adding projects...")
projects = [
    {
        "name": "Kvitfjellhytter Dashboard",
        "description": "Airbnb/vacation rental business dashboard with iGMS integration, booking calendar, and financial tracking",
        "status": "active",
        "health_score": 80,
        "priority": 7,
        "folder_path": "projects/Kvitfjellhytter/"
    },
    {
        "name": "3dje Boligsektor",
        "description": "Real estate development for social housing. Pipeline towards 10,000+ boliger. Collaboration with Henrik.",
        "status": "active",
        "health_score": 90,
        "priority": 10,
        "folder_path": "projects/3dje-boligsektor/"
    },
    {
        "name": "Hour Management System",
        "description": "Text-based hour reporting via Telegram with automatic pay calculation for Fåvang Varetaxi and Treffen",
        "status": "active",
        "health_score": 85,
        "priority": 5,
        "folder_path": "hours/"
    },
    {
        "name": "Freddy Research Agent",
        "description": "Deep research system with Kimi K2.5 + Crawl4AI + Brave Search. 70% cost savings vs Gemini Deep Research.",
        "status": "active",
        "health_score": 95,
        "priority": 6,
        "folder_path": "projects/freddy-research-agent/"
    },
    {
        "name": "The Observatory",
        "description": "Personal command center: Mission Control + Kanban + Fitness Lab + Research Reader + Finance",
        "status": "active",
        "health_score": 70,
        "priority": 8,
        "folder_path": "projects/the-observatory/"
    },
    {
        "name": "Gut Health Lab",
        "description": "Personal gut healing protocol based on Dr. William Davis's work. L. reuteri yogurt, Knut bread, beef stock.",
        "status": "active",
        "health_score": 95,
        "priority": 4,
        "folder_path": "projects/gut-health-lab/"
    },
    {
        "name": "YouTube Content System",
        "description": "Content creation system for gut health, fitness transformation, and AI automation topics",
        "status": "paused",
        "health_score": 30,
        "priority": 3,
        "folder_path": "projects/youtube/"
    }
]

for p in projects:
    insert_data("projects", p, f"Project: {p['name']}")

# Get project IDs for task linking
print("\n2. Fetching project IDs...")
url = f"https://{PROJECT_ID}.supabase.co/rest/v1/projects?select=id,name"
headers_rest = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NDAwNCwiZXhwIjoyMDg1NTUwMDA0fQ.jnZEhrFl823cgQHubVZv_-qRwvS8aO90Yosp_jxY2cs",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NDAwNCwiZXhwIjoyMDg1NTUwMDA0fQ.jnZEhrFl823cgQHubVZv_-qRwvS8aO90Yosp_jxY2cs"
}
resp = requests.get(url, headers=headers_rest)
project_map = {p['name']: p['id'] for p in resp.json()} if resp.status_code == 200 else {}
print(f"  Found {len(project_map)} projects")

# Insert Tasks
print("\n3. Adding tasks...")

# Get project IDs
kvitfjell_id = project_map.get("Kvitfjellhytter Dashboard")
bilig_id = project_map.get("3dje Boligsektor")
obs_id = project_map.get("The Observatory")
hours_id = project_map.get("Hour Management System")

tasks = [
    # HIGH PRIORITY
    {
        "title": "Apply for Kartverket Matrikkel agreement",
        "description": "BLOCKER for owner lookup in 3dje Boligsektor Phase 2",
        "status": "todo",
        "priority": "urgent",
        "project_id": bilig_id,
        "source": "TODO.md"
    },
    {
        "title": "Connect iGMS OAuth",
        "description": "Click 'Connect iGMS' on dashboard and authorize. Code ready, needs your auth.",
        "status": "todo",
        "priority": "high",
        "project_id": kvitfjell_id,
        "source": "TODO.md"
    },
    {
        "title": "Test iGMS API with real data",
        "description": "After OAuth is connected, test API endpoints with real booking data",
        "status": "backlog",
        "priority": "high",
        "project_id": kvitfjell_id,
        "source": "TODO.md"
    },
    # 3DJE BOLIGSEKTOR - DAY 1
    {
        "title": "3dje: Read MVP-SCOPE-AND-PLAN.md",
        "description": "Understand the 5-day build plan for tomte-sourcing system",
        "status": "todo",
        "priority": "high",
        "project_id": bilig_id,
        "source": "TODO.md"
    },
    {
        "title": "3dje: Select 2 pilot municipalities",
        "description": "Choose from Phase 1 list of 126 kommuner with clay analysis",
        "status": "todo",
        "priority": "high",
        "project_id": bilig_id,
        "source": "TODO.md"
    },
    {
        "title": "3dje: Set up Python environment",
        "description": "Install geopandas, shapely, requests for geospatial processing",
        "status": "todo",
        "priority": "high",
        "project_id": bilig_id,
        "source": "TODO.md"
    },
    {
        "title": "3dje: Test Arealplaner.no WFS connection",
        "description": "Verify access to zoning plan data",
        "status": "todo",
        "priority": "high",
        "project_id": bilig_id,
        "source": "TODO.md"
    },
    # MEDIUM PRIORITY
    {
        "title": "Fix Supabase RLS policy recursion error",
        "description": "Bookings query has RLS recursion issue in Kvitfjellhytter dashboard",
        "status": "backlog",
        "priority": "medium",
        "project_id": kvitfjell_id,
        "source": "TODO.md"
    },
    {
        "title": "Hour Tracking Phase 1B: Install PDF tools",
        "description": "brew install poppler for PDF parsing of driving schedules",
        "status": "backlog",
        "priority": "medium",
        "project_id": hours_id,
        "source": "TODO.md"
    },
    {
        "title": "Add property images to dashboard cards",
        "description": "Visual enhancement for Kvitfjellhytter dashboard",
        "status": "backlog",
        "priority": "medium",
        "project_id": kvitfjell_id,
        "source": "TODO.md"
    },
    {
        "title": "Implement booking calendar view",
        "description": "Calendar component for viewing bookings in Kvitfjellhytter dashboard",
        "status": "backlog",
        "priority": "medium",
        "project_id": kvitfjell_id,
        "source": "TODO.md"
    },
    # OBSERVATORY
    {
        "title": "Observatory: Provide Garmin credentials",
        "description": "Fitness Lab module needs Garmin Connect credentials for Body Battery, VO2 Max sync",
        "status": "done",
        "priority": "medium",
        "project_id": obs_id,
        "source": "TODO.md"
    },
    {
        "title": "Observatory: Create Supabase tables",
        "description": "Database schema for projects, tasks, fitness, finance, research",
        "status": "done",
        "priority": "high",
        "project_id": obs_id,
        "source": "TODO.md"
    },
]

for t in tasks:
    if t.get("project_id"):
        insert_data("tasks", t, f"Task: {t['title'][:40]}...")

print("\n✅ Observatory database populated!")
print(f"\n📊 Summary:")
print(f"  - {len(projects)} projects added")
print(f"  - {len(tasks)} tasks added")
print(f"\n🔗 Dashboard: https://observatory-dashboard-two.vercel.app")
