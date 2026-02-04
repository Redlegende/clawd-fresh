---
name: browser-autonomy
description: Full browser automation for logged-in sessions and autonomous web operation. Chrome is the dedicated agent browser — you log into services there (iGMS, banks, etc.), I access via Chrome Extension. Safari remains your personal browser.
version: 1.2.0
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

---

## Chrome Extension Relay — PRIMARY METHOD

**Best for:** All logged-in sites (iGMS, banks, utilities)

**Prerequisites:**
- Chrome browser (dedicated agent browser)
- OpenClaw Browser Relay extension installed and **pinned to toolbar**
- You logged into target sites in Chrome

**How it works:**
1. You open the target site in Chrome
2. You click the OpenClaw extension icon (badge turns ON)
3. I can now access the full DOM via the browser tool

**Usage:**
```yaml
# After you click the extension:
browser action: snapshot
profile: chrome
# Now I can see full DOM, interact with elements
```

**Capabilities:**
- ✅ Full page snapshots with element references
- ✅ Click, type, fill forms
- ✅ Access Chrome DevTools (console, network)
- ✅ Navigate, screenshots, PDFs
- ✅ Access to Chrome cookies/session

**Limitation:** You must click the extension icon to grant access

---

## Quick Decision Guide

| Situation | Use This |
|-----------|----------|
| iGMS, banks, any logged-in site | **Chrome Extension** — You click, I take over |
| New site, no login needed | OpenClaw managed browser |

---

## Example Workflows

### Debug iGMS OAuth Error

1. You open iGMS in Chrome, click OpenClaw extension
2. Fred: `browser snapshot` → sees error message
3. Fred: `browser click --ref e12` → clicks error details
4. Fred: Documents error in memory file

---

## Setup Commands

### One-Time Setup

```bash
# 1. Install Chrome Extension
# Go to: https://chrome.google.com/webstore/detail/openclaw-browser-relay

# 2. Pin extension to Chrome toolbar (right-click → Pin)

# 3. Log into services in Chrome (one-time)
#    - iGMS: https://app.igms.com
#    - Sbanken: https://sbanken.no
#    - Any other services you want me to access
```

**After setup:** You open Chrome, click the extension, and I can help debug/interact.

---

## Troubleshooting

**"No tab connected" error**
→ Click OpenClaw extension icon on target tab

---

*Updated: 2026-02-04 — Removed Peekaboo workflow per user request*
