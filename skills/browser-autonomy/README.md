# Browser Autonomy Skill

**Status:** IMPLEMENTED ✅  
**Created:** 2026-02-03  
**Updated:** 2026-02-03 — Chrome-dedicated architecture  
**Purpose:** Enable Fred to operate autonomously in web browsers using Chrome as the dedicated agent browser

---

## Architecture: Chrome = Agent, Safari = Personal

**Key Principle:** Clean separation between your browsing and my automation.

```
┌─────────────────────┐      ┌─────────────────────┐
│   SAFARI (YOURS)    │      │   CHROME (AGENT)    │
├─────────────────────┤      ├─────────────────────┤
│ • Personal banking  │      │ • iGMS              │
│ • Private browsing  │      │ • Sbanken business  │
│ • Your stuff        │      │ • Financial tools   │
│ • Everything else   │      │ • Services I access │
└─────────────────────┘      └─────────────────────┘
         │                              │
         │                              │
         └──────── YOU CONTROL ─────────┘
                what I can access
```

**Why Chrome:**
- OpenClaw extension only works with Chrome (not Safari/Firefox)
- You log into services once, I access anytime
- Clean privacy boundary — your personal Safari stays private

---

## Two-Pronged Approach

### Option 1: Chrome Extension Relay (RECOMMENDED for logged-in sites)

**Best for:** iGMS, Google Calendar, any site you're already logged into

**How it works:**
1. You open Chrome and navigate to the site
2. Click the OpenClaw Browser Relay toolbar icon (badge turns ON)
3. I can now see the page, click elements, type, navigate

**Usage:**
```
# User says: "Connect to my iGMS tab"
→ User clicks OpenClaw extension on iGMS tab
→ I use browser tool with profile="chrome"
```

**Capabilities:**
- ✅ See full page structure (snapshot)
- ✅ Click buttons/links by reference
- ✅ Type into forms
- ✅ Navigate, screenshots, PDFs
- ❌ Requires you to attach the tab first

---

### Option 2: Peekaboo macOS UI Automation (Universal fallback)

**Best for:** Any app, any browser, when extension relay isn't available

**How it works:**
- Uses macOS Accessibility + Screen Recording permissions
- I take screenshots, analyze UI, click, type, scroll
- Works with Safari, Chrome, Firefox, desktop apps

**Usage:**
```bash
# Check permissions first
peekaboo permissions

# See the screen
peekaboo see --annotate --path /tmp/screen.png

# Click an element
peekaboo click --on B3

# Type text
peekaboo type "Hello" --return
```

**Capabilities:**
- ✅ Any browser, any app
- ✅ Vision-based (works with any UI)
- ✅ No extension needed
- ❌ Requires Screen Recording + Accessibility permissions
- ❌ Slightly slower (screenshot → analyze → act)

---

## When to Use What

| Scenario | Tool | Why |
|----------|------|-----|
| iGMS, already logged in | Chrome Extension | Fastest, most reliable |
| New site, no login needed | OpenClaw Managed | Clean slate, no cookies |
| Safari-only site | Peekaboo | Extension only works with Chrome |
| Desktop app (not browser) | Peekaboo | Only option |
| Error debugging iGMS | BOTH | Extension to start, Peekaboo if stuck |

---

## Setup Checklist

### Phase 1: Tools
- [x] Chrome installed (you have it)
- [x] OpenClaw extension installed (you have it)
- [ ] Pin extension to Chrome toolbar (right-click → Pin)
- [ ] Install Peekaboo: `brew install steipete/tap/peekaboo`
- [ ] Grant Screen Recording permission (System Settings → Privacy)
- [ ] Grant Accessibility permission (System Settings → Privacy)
- [ ] Test: `peekaboo see --annotate`

### Phase 2: Chrome (Agent Browser)
- [ ] Log into iGMS in Chrome (keep logged in)
- [ ] Log into Sbanken in Chrome (keep logged in)
- [ ] Log into any other services I should access

### Phase 3: Test
- [ ] Run hybrid workflow test on iGMS
- [ ] Verify I can snapshot → click → debug autonomously
- [ ] Document any edge cases

---

## Usage Examples

### Debug iGMS Connection Error (Autonomous)

**Before hybrid:** You had to manually click extension every time  
**After hybrid:** I do it all

```
1. User: "Debug iGMS connection"
2. Me (Peekaboo): Launch Chrome, navigate to iGMS
3. Me (Peekaboo): Click OpenClaw extension icon
4. Me (Browser tool): snapshot → see error message
5. Me (Browser tool): Check Network tab, capture API errors
6. Document in memory/YYYY-MM-DD.md + propose fix
```

**You do:** Nothing after step 1  
**I do:** Everything else

### Fill out a form autonomously
```
# Chrome Extension approach
browser open https://example.com/form
browser type --ref e12 "John Doe"
browser click --ref e15  # Submit button
```

### Check iGMS booking data
```
# Peekaboo approach (if extension fails)
peekaboo app launch "Google Chrome"
peekaboo type "https://app.igms.com/dashboard" --return
peekaboo sleep 3
peekaboo see --annotate
peekaboo click --on B5  # Bookings tab
```

---

## Troubleshooting

**Extension says "No tab connected"**
→ You need to click the extension icon on the target tab

**Peekaboo says "Permission denied"**
→ System Settings → Privacy & Security → Screen Recording → Add Peekaboo
→ Same for Accessibility

**Can't see iGMS data in snapshot**
→ Page might be in an iframe or shadow DOM
→ Try Peekaboo screenshot + analyze instead

---

## Related Skills

- `peekaboo` — macOS UI automation (already installed)
- `browser` — Chrome/CDP control (built-in)
- `computer-use` — Linux desktop automation (for VPS)

---

## Decision Tree

```
Need to interact with a website?
├── Already logged in Chrome?
│   └── Use Chrome Extension Relay (fastest)
├── Using Safari/Firefox?
│   └── Use Peekaboo
├── Need to automate desktop app?
│   └── Use Peekaboo
└── Clean slate, no login needed?
    └── Use OpenClaw Managed Browser
```

---

*Last updated: 2026-02-03 — Created this skill to solve iGMS debugging*
