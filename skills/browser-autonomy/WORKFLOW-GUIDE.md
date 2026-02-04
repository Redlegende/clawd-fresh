# Chrome Extension Browser Workflow

**Updated:** 2026-02-04  
**Purpose:** Simple guide for using Chrome Extension Relay for browser automation

---

## How It Works

1. **You** open the target website in Chrome
2. **You** click the OpenClaw Browser Relay extension icon (toolbar)
3. **I** can now see the full page and help debug/interact

That's it. No automation scripts, no coordinate clicking.

---

## Example: Debug iGMS OAuth

```
You: Opens https://app-pink-eight-65.vercel.app in Chrome
You: Clicks OpenClaw extension (badge turns ON)
You: "Fred, the OAuth is failing"

Me: browser snapshot → sees error message
Me: Documents the error → proposes fix
```

---

## Commands I Can Use (After You Click Extension)

```bash
# See full page structure
browser action: snapshot
profile: chrome

# Click an element
browser action: click --ref e12
profile: chrome

# Type in a field
browser action: type --ref e34 --text "hello"
profile: chrome
```

---

## Setup (One-Time)

1. Install OpenClaw Browser Relay from Chrome Web Store
2. Pin it to your toolbar (right-click → Pin)
3. Keep Chrome logged into services you want me to help with

---

*Previous Peekaboo workflow removed — 2026-02-04*
