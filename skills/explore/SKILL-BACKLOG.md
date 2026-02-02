# Skill Backlog

Skills discovered from clawdhub that may enhance capabilities. Research up to 5 per night.

## Format
- 📝 Pending — Needs research
- 🔍 Researching — Currently evaluating
- ✅ INSTALL — Worth installing
- ❌ SKIP — Not useful or overlaps with existing tools
- 🤔 MAYBE — Unclear value, defer decision

---

## High Priority (Directly Relevant to Active Goals)

### google-calendar v0.1.0
- **Description:** Interact with Google Calendar via the Google Calendar API — list, add, update, delete events
- **Relevance:** Critical for Freddy autonomous calendar management (Active Goal #4)
- **Status:** ✅ INSTALL
- **Verdict:** Clean Python implementation with standard OAuth flow. Better than gog for dedicated calendar operations. Well-documented with clear env var setup. Install when ready to activate Freddy calendar features.
- **Location:** `skills/explore/google-calendar/`

### clawmail-skill v1.0.0
- **Description:** Email infrastructure for autonomous AI agents. Agent-specific @clawmail.to addresses, send/receive via REST API
- **Relevance:** Useful for Kvitfjellhytter guest communications automation
- **Status:** 🤔 MAYBE
- **Verdict:** Requires Twitter/X verification (anti-spam). Limited to 100 emails/day. Jakob already has gog for Gmail which is more established. Interesting for agent-specific identities but adds complexity. Defer until specific need for agent-only email arises.
- **Location:** `skills/explore/clawmail-skill/`

### google-sheet v1.0.0
- **Description:** Full Google Sheets management — read, write, append, format, resize, manage sheets via service account
- **Relevance:** Data management for 3dje Boligsektor, hour tracking exports
- **Status:** ✅ INSTALL
- **Verdict:** Service account auth is perfect for automation (no OAuth refresh token hassle). Comprehensive formatting capabilities. Ideal for 3dje Boligsektor CRM exports and hour tracking reports. Node.js implementation, requires `npm install`.
- **Location:** `skills/explore/google-sheet/`

### meta-tags v0.1.0
- **Description:** Generate HTML meta tags for SEO, Open Graph, Twitter Cards
- **Relevance:** Kvitfjellhytter website SEO optimization
- **Status:** 📝 Pending
- **Notes:** Check if overlaps with Next.js built-in metadata API

### docstrange v1.0.1
- **Description:** Document extraction API by Nanonets — OCR, invoice parsing, table extraction with confidence scores
- **Relevance:** Hour tracking system (Phase 1B: PDF → structured data)
- **Status:** 🤔 MAYBE
- **Verdict:** Powerful but requires API key + external service. Hour tracking system already planning pdfplumber (free, local). DocStrange excels at complex documents (invoices, forms) with confidence scoring. Keep as option for future complex extraction needs but pdfplumber is better fit for simple hour tracking PDFs.
- **Location:** `skills/explore/docstrange/`

---

## Medium Priority (Agent Enhancement)

### agent-builder v1.0.0
- **Description:** Generates OpenClaw workspace files (SOUL.md, IDENTITY.md, AGENTS.md, etc.) for new agents
- **Relevance:** Could improve Freddy Research Agent and future agent systems
- **Status:** ❌ SKIP
- **Verdict:** Just a template generator for new agents. Jakob already has established workspace structure (SOUL.md, USER.md, etc.). No value for existing workspace. Skip unless creating entirely new agent workspaces frequently.
- **Location:** `skills/explore/agent-builder/` (will delete)

### capability-evolver v1.0.29
- **Description:** Self-evolution engine for AI agents. Analyzes reflection logs and adapts
- **Relevance:** Interesting for autonomous agent improvement
- **Status:** 📝 Pending
- **Notes:** Might overlap with byterover memory system

### hybrid-memory v1.0.1
- **Description:** Hybrid memory strategy combining OpenClaw's built-in memory with external vector DB
- **Relevance:** Could enhance memory system beyond current MEMORY.md approach
- **Status:** 📝 Pending
- **Notes:** Compare to byterover skill already installed

### computer-use v1.1.0
- **Description:** Full desktop computer use for headless Linux servers (Ubuntu + Playwright)
- **Relevance:** Could enable GUI automation for tasks not available via API
- **Status:** 📝 Pending
- **Notes:** Heavy dependency; evaluate necessity

### prompt-optimizer v1.0.0
- **Description:** Evaluate, optimize, and enhance prompts using 58+ techniques
- **Relevance:** Could improve prompt quality across all systems
- **Status:** 📝 Pending
- **Notes:** Might be useful for Freddy Research Agent prompts

---

## Low Priority / Specialized

### ai-humanizer v2.1.0
- **Description:** Humanize AI-generated text by detecting and removing AI markers
- **Relevance:** Content creation for YouTube scripts
- **Status:** 📝 Pending
- **Notes:** Jakob prefers authentic voice; may not align with values

### xmtp-cli v1.0.0
- **Description:** Run and script the XMTP CLI for testing, debugging, and messaging
- **Relevance:** Web3 messaging protocol
- **Status:** 📝 Pending
- **Notes:** Not currently relevant to any active projects

### xmtp-agent v1.0.0
- **Description:** Building and extending XMTP agents with the Agent SDK
- **Relevance:** Web3 messaging
- **Status:** 📝 Pending
- **Notes:** Overlap with xmtp-cli

### clawshot v1.2.0
- **Description:** The visual network for AI agents. Capture, share, and explore screenshots
- **Relevance:** Visual documentation, browser automation
- **Status:** 📝 Pending
- **Notes:** Browser tool already has screenshot capability

### vestaboard v1.0.0
- **Description:** Read and write messages on a Vestaboard using the local network API
- **Relevance:** Physical display board integration
- **Status:** 📝 Pending
- **Notes:** No Vestaboard hardware; not relevant

### voidex-arena v1.0.3
- **Description:** Voidex Arena — galactic trading game for AI agents
- **Relevance:** Game/trading simulation
- **Status:** 📝 Pending
- **Notes:** Entertainment, not business utility

### reposit v1.0.0
- **Description:** Community knowledge sharing for AI agents - search agent memories
- **Relevance:** Knowledge sharing between agents
- **Status:** 📝 Pending
- **Notes:** Unclear value vs private memory system

### feishu-api-docs v1.0.0
- **Description:** Fetches Feishu (Lark) API documentation from the official website
- **Relevance:** Lark/Feishu integration (Chinese collaboration platform)
- **Status:** 📝 Pending
- **Notes:** No current Lark usage

### knowbster v1.0.0
- **Description:** AI Agent Knowledge Marketplace on Base L2. Buy, sell, and share knowledge
- **Relevance:** Web3 knowledge marketplace
- **Status:** 📝 Pending
- **Notes:** Interesting concept, not immediately useful

### flomo-notes v0.1.0
- **Description:** Save notes to Flomo via the Flomo inbox webhook
- **Relevance:** Note-taking app integration
- **Status:** 📝 Pending
- **Notes:** Uses Apple Notes via memo skill instead

### api-gateway v1.0.1
- **Description:** API gateway for calling third-party APIs with managed authentication
- **Relevance:** Generic API calling
- **Status:** 📝 Pending
- **Notes:** Similar to http_request tool already available

### prompts-workflow v1.0.0
- **Description:** Automated workflow for collecting, converting, and uploading prompts
- **Relevance:** Prompt management
- **Status:** 📝 Pending
- **Notes:** Unclear advantage over simple file storage

### warren-nft v1.0.0
- **Description:** Deploy NFT collections permanently on MegaETH blockchain
- **Relevance:** NFT deployment
- **Status:** 📝 Pending
- **Notes:** No current NFT projects

### opensea v1.0.1
- **Description:** OpenSea REST, Stream, and Seaport API workflows
- **Relevance:** NFT marketplace
- **Status:** 📝 Pending
- **Notes:** No current NFT projects

### crypto-agent-payments v0.1.7
- **Description:** (No description provided)
- **Relevance:** Crypto payments
- **Status:** 📝 Pending
- **Notes:** Unclear scope

### agent-directory v1.2.0
- **Description:** The directory for AI agent services. Discover tools, services, and agents
- **Relevance:** Agent discovery
- **Status:** 📝 Pending
- **Notes:** Similar to clawdhub explore

### qqmap v1.0.0
- **Description:** 腾讯地图Web服务API集成 (Tencent Maps Web Service API)
- **Relevance:** Chinese mapping service
- **Status:** 📝 Pending
- **Notes:** No China-focused projects

### progressive-memory v0.1.0
- **Description:** (No description provided)
- **Relevance:** Unknown
- **Status:** 📝 Pending
- **Notes:** Need to read SKILL.md to understand

---

## Already Evaluated / Installed

### garminexport (in skills/explore/)
- **Description:** Download/backup Garmin Connect activities
- **Status:** ❌ SKIP
- **Verdict:** Python library, not an OpenClaw skill. Useful for Garmin data export but requires manual installation. Jakob already has Garmin Epix Pro with Connect integration. Skip as formal skill — can use directly if needed.

---

## Installation Log

| Date | Skills Researched | Verdicts |
|------|-------------------|----------|
| 2026-02-02 | google-calendar, clawmail-skill, google-sheet, agent-builder, docstrange | 2 INSTALL, 2 MAYBE, 1 SKIP |

---

*Last updated: 2026-02-02 — Created backlog from clawdhub explore*
