---
name: browser-autonomy
description: Full browser automation for logged-in sessions and autonomous web operation. Chrome is the dedicated agent browser — you log into services there (iGMS, banks, etc.), I access via Peekaboo + Extension hybrid. Safari remains your personal browser.
version: 1.1.0
---

# Browser Autonomy Skill

**ARCHITECTURE:** Chrome = Agent Browser | Safari = Personal Browser

Enable Fred to operate autonomously in web browsers, especially for logged-in sessions like iGMS, banks, and financial services.

## Browser Architecture

```
SAFARI (Your Personal)          CHROME (Agent Browser)
├── Personal banking            ├── iGMS (logged in)
├── Private browsing            ├── Sbanken business
└── Your stuff                  ├── Financial services
                                └── Everything I access
```

**Why this separation:**
- ✅ Clean privacy boundary — your personal browser stays yours
- ✅ Chrome has OpenClaw extension (Safari doesn't support it)
- ✅ You control what I access by what you log into in Chrome
- ✅ I can launch/operate Chrome anytime via Peekaboo

---

## Two Methods Combined (Hybrid)

### 1. Chrome Extension Relay — PRIMARY

**Best for:** All logged-in sites (iGMS, banks, utilities)

**Prerequisites:**
- Chrome browser (dedicated agent browser)
- OpenClaw Browser Relay extension installed and **pinned to toolbar**
- You logged into target sites in Chrome

**Hybrid Workflow:**
```
Peekaboo          Chrome Extension         Browser Tool
   │                      │                      │
   ├─ Launch Chrome ──────┤                      │
   ├─ Navigate to site ───┤                      │
   ├─ Click extension ────┤                      │
   │                      ├─ Attach to tab ──────┤
   │                      │                      ├─ Full DOM access
   │                      │                      ├─ Debug/interact
```

**Usage:**
```yaml
# Step 1: Peekaboo gets us there
peekaboo app launch "Google Chrome"
peekaboo type "https://app.igms.com/dashboard"
peekaboo click --coords 1200,100  # Extension icon

# Step 2: Browser tool takes over
browser action: snapshot
profile: chrome
# Now I can see full DOM, console, network
```

**Capabilities:**
- ✅ Full page snapshots with element references
- ✅ Click, type, fill forms
- ✅ Access Chrome DevTools (console, network)
- ✅ Navigate, screenshots, PDFs
- ✅ Access to Chrome cookies/session

**Limitation:** Extension click required — automated via Peekaboo

---

### 2. Peekaboo — Universal macOS UI Automation

**Best for:** Any browser, any app, when extension isn't available

**Prerequisites:**
- `peekaboo` CLI installed (`brew install steipete/tap/peekaboo`)
- Screen Recording permission granted
- Accessibility permission granted

**Usage:**
```bash
# See and analyze screen
peekaboo see --annotate

# Click element by ID from snapshot
peekaboo click --on B3

# Type text
peekaboo type "Hello" --return
```

**Capabilities:**
- Screenshot + vision analysis
- Click any visible element
- Type, scroll, hotkeys
- Any app, any browser

**Limitation:** Vision-based (slightly slower than DOM access)

---

## Quick Decision Guide

| Situation | Use This |
|-----------|----------|
| iGMS, banks, any logged-in site | **Hybrid** — Peekaboo launches Chrome + Extension |
| Chrome already open with extension ON | Browser tool directly |
| Safari-only site | Peekaboo only (fallback) |
| Desktop app | Peekaboo only |
| New site, no login needed | OpenClaw managed browser |

---

## Example Workflows

### Debug iGMS OAuth Error

1. User opens iGMS in Chrome, clicks OpenClaw extension
2. Fred: `browser snapshot` → sees error message
3. Fred: `browser click --ref e12` → clicks error details
4. Fred: Documents error in memory file

### Check iGMS Booking Data

```bash
# Chrome approach
peekaboo app launch "Google Chrome"
peekaboo type "https://app.igms.com" --return
peekaboo sleep 2
peekaboo see --annotate
# Analyze screenshot, click bookings tab
```

---

## Setup Commands

### One-Time Setup

```bash
# 1. Install Peekaboo
brew install steipete/tap/peekaboo

# 2. Check permissions (must grant both)
peekaboo permissions

# 3. Install Chrome Extension
# Go to: https://chrome.google.com/webstore/detail/openclaw-browser-relay

# 4. Pin extension to Chrome toolbar (right-click → Pin)

# 5. Grant Peekaboo permissions in System Settings
#    System Settings → Privacy & Security → Screen Recording → Add Terminal
#    System Settings → Privacy & Security → Accessibility → Add Terminal
```

### Chrome Setup (Agent Browser)

```bash
# 6. Log into services in Chrome (one-time)
#    - iGMS: https://app.igms.com
#    - Sbanken: https://sbanken.no
#    - Any other services you want me to access
#    
# 7. Keep Chrome logged in — I can launch/access anytime
```

**After setup:** I can autonomously access any logged-in service without you micromanaging.

---

## Troubleshooting

**"No tab connected" error**
→ Click OpenClaw extension icon on target tab

**Peekaboo permission denied**
→ System Settings → Privacy → Screen Recording → Add Terminal/iTerm
→ System Settings → Privacy → Accessibility → Add Terminal/iTerm

**Can't find element to click**
→ Use `peekaboo see --annotate` to get element IDs

---

*Created: 2026-02-03 to solve iGMS autonomous debugging*
