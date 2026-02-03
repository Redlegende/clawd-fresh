# Hybrid Browser Autonomy — Workflow Guide

**Created:** 2026-02-03  
**Purpose:** Step-by-step guide for autonomous browser control using Peekaboo + Chrome Extension

---

## Prerequisites (One-Time Setup)

```bash
# 1. Install Peekaboo
brew install steipete/tap/peekaboo

# 2. Grant permissions (System Settings → Privacy & Security)
#    - Screen Recording: Add /opt/homebrew/bin/node
#    - Accessibility: Add /opt/homebrew/bin/node

# 3. Install Chrome Extension
#    - Load unpacked from ~/.openclaw/browser/chrome-extension
#    - Pin to toolbar

# 4. Log into services in Chrome (keep logged in)
```

---

## Standard Workflow

### Step 1: Launch Chrome
```bash
open -a "Google Chrome" --args --new-window "<URL>"
```

### Step 2: Focus Chrome Window
```bash
peekaboo window focus --app "Google Chrome" --bring-to-current-space
```

### Step 3: Navigate (if needed)
```bash
peekaboo type "<URL>" --return
```

### Step 4: Click OpenClaw Extension
**IMPORTANT:** Find exact coordinates first!
```bash
# Get screenshot to see Chrome toolbar
peekaboo image --mode screen --path ~/Desktop/screenshots/toolbar.png

# Click extension icon (coordinates vary by screen setup)
peekaboo click --coords X,Y
```

### Step 5: Verify Extension Attached
```bash
# Check if browser tool can connect
browser action: status
profile: chrome
```

Should show: `running: true`, `cdpReady: true`

### Step 6: Use Browser Tool for Full Control
```bash
browser action: snapshot
profile: chrome
# Now I have full DOM access!
```

---

## iGMS Connection (Kvitfjellhytter Dashboard)

**⚠️ CRITICAL:** OAuth connection must go through YOUR dashboard, not directly to iGMS.

**URL:** `https://app-pink-eight-65.vercel.app/settings` (or your dashboard URL)

**Correct Flow:**
```
Dashboard Settings Page
    ↓
Click "Connect iGMS" button
    ↓
OAuth flow starts (popup or redirect)
    ↓
Extension already attached → I debug the OAuth
    ↓
Capture errors, document, fix
```

**WRONG:** Going directly to `https://www.igms.com/` — this won't trigger the OAuth connection flow from your dashboard.

**RIGHT:** Start at your dashboard, let it initiate the iGMS OAuth connection.

---

## Screenshot Organization

```bash
# Create dedicated folder
mkdir -p ~/Desktop/screenshots/$(date +%Y-%m-%d)

# Save all screenshots there
peekaboo image --mode screen --path ~/Desktop/screenshots/$(date +%Y-%m-%d)/step-01.png
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Extension not connecting | Click extension icon, check badge turns ON |
| Wrong window focused | Use `--bring-to-current-space` flag |
| Coordinates wrong | Take screenshot first, identify exact position |
| Permission denied | Restart OpenClaw gateway after granting permissions |

---

## Commands Reference

### Peekaboo
```bash
peekaboo permissions                    # Check permissions
peekaboo window focus --app "Google Chrome"  # Focus Chrome
peekaboo click --coords X,Y             # Click at coordinates
peekaboo type "text" --return           # Type + Enter
peekaboo image --mode screen --path     # Screenshot
```

### Browser Tool (after extension attached)
```bash
browser action: status
profile: chrome

browser action: snapshot
profile: chrome

browser action: click --ref e12
profile: chrome
```

---

## Today's Test Results

**Status:** ✅ Partially working
- ✅ Peekaboo permissions granted
- ✅ Chrome launched via Peekaboo
- ✅ Navigation working
- ⚠️ Extension click coordinates need calibration
- ⏳ Full workflow test pending

**Next test:** Kvitfjellhytter dashboard → iGMS OAuth

---

*Last updated: 2026-02-03*
