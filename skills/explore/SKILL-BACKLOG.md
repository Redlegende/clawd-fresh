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
- **Description:** Generate HTML meta tags for SEO, Open Graph, Twitter Cards, JSON-LD
- **Relevance:** Kvitfjellhytter website SEO optimization
- **Status:** ❌ SKIP
- **Verdict:** Simple CLI tool with HTML/React/Vue output formats. However, Next.js has built-in metadata API (`export const metadata = {...}`) that handles this natively with better framework integration. No additional value over built-in capabilities.
- **Location:** `skills/explore/meta-tags/`

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
- **Status:** ❌ NOT FOUND
- **Verdict:** Skill not found in clawdhub. May have been removed or renamed.
- **Location:** N/A

### hybrid-memory v1.0.1
- **Description:** Hybrid memory combining OpenClaw's built-in vector memory with Graphiti temporal knowledge graph
- **Relevance:** Enhanced temporal memory ("when did X happen?")
- **Status:** 🤔 MAYBE
- **Verdict:** Graphiti adds temporal/entity tracking (when things happened, relationships) vs byterover's context tree. Requires Docker stack + embedding provider setup. Useful for long-running agent memory but adds significant infrastructure complexity. Defer until clear temporal query need emerges.
- **Location:** `skills/explore/hybrid-memory/`

### computer-use v1.1.0
- **Description:** Full desktop GUI control for headless Linux servers (Xvfb + XFCE + VNC)
- **Relevance:** VPS/desktop GUI automation
- **Status:** ❌ SKIP
- **Verdict:** Designed for headless Linux VPS (Ubuntu), not macOS. Jakob operates locally on Mac. Browser tool already handles web automation. 17 actions (click, type, scroll, etc.) but no current use case. Skip unless setting up Linux VPS agents.
- **Location:** `skills/explore/computer-use/`

### prompt-optimizer v1.0.0
- **Description:** Evaluate, optimize, and enhance prompts using 58 proven prompting techniques
- **Relevance:** Improve Freddy Research Agent and all prompt-based systems
- **Status:** ✅ INSTALL
- **Verdict:** Comprehensive framework with quality dimensions (clarity, specificity, structure), 58 techniques catalog (CoT, few-shot, role-play, etc.), and Python scripts for evaluation/optimization. Perfect for systematically improving Freddy Research Agent prompts and future agent systems.
- **Location:** `skills/explore/prompt-optimizer/`

---

## Low Priority / Specialized

### ai-humanizer v2.1.0
- **Description:** Humanize AI-generated text by detecting and removing AI markers
- **Relevance:** Content creation for YouTube scripts
- **Status:** 🤔 MAYBE
- **Verdict:** Comprehensive pattern detection (24 patterns, 500+ AI vocabulary terms, statistical analysis). CLI tools for scoring, analyzing, and humanizing text. Useful for making AI-generated content sound more natural. However, Jakob prefers authentic voice anyway — may not need a tool for this. Keep as option for bulk content processing but not priority.
- **Location:** `skills/explore/ai-humanizer/`

### xmtp-cli v1.0.0
- **Description:** Run and script the XMTP CLI for testing, debugging, and messaging
- **Relevance:** Web3 messaging protocol
- **Status:** ❌ SKIP
- **Verdict:** XMTP is a decentralized messaging protocol (Web3 "email"). Skill provides CLI for testing conversations, groups, messages. Complete Web3 focus with no overlap to Jakob's businesses (cabin rentals, real estate). No current or planned Web3 messaging needs. Skip.
- **Location:** `skills/explore/xmtp-cli/` (will delete)

### xmtp-agent v1.0.0
- **Description:** Building and extending XMTP agents with the Agent SDK
- **Relevance:** Web3 messaging
- **Status:** ❌ SKIP
- **Verdict:** Event-driven messaging agents on XMTP network. Same Web3/decentralized focus as xmtp-cli. Agent SDK for building bots that handle commands, attachments, reactions, crypto payments. No relevance to Kvitfjellhytter or 3dje Boligsektor operations. Skip.
- **Location:** `skills/explore/xmtp-agent/` (will delete)

### clawshot v1.2.0
- **Description:** "Instagram for AI agents" — social platform for sharing screenshots, building following, engaging with other agents
- **Relevance:** Visual documentation, agent social presence
- **Status:** ❌ SKIP
- **Verdict:** Requires Twitter/X verification (human claims agent). Social platform focused — like Instagram for AI agents. Interesting concept but completely misaligned with Jakob's business goals (Kvitfjellhytter, 3dje Boligsektor). No value for cabin management or real estate development. Skip.
- **Location:** `skills/explore/clawshot/` (will delete)

### vestaboard v1.0.0
- **Description:** Read and write messages on a Vestaboard using the local network API
- **Relevance:** Physical display board integration
- **Status:** ❌ SKIP
- **Verdict:** Controls Vestaboard hardware (6x22 character split-flap display). Requires physical device (~$3,000). Cloud API for updating displays remotely. Jakob doesn't own this hardware and has no use case for physical signage. Completely irrelevant unless acquiring Vestaboard. Skip.
- **Location:** `skills/explore/vestaboard/` (will delete)

### voidex-arena v1.0.3
- **Description:** Voidex Arena — galactic trading game for AI agents
- **Relevance:** Game/trading simulation
- **Status:** 📝 Pending
- **Notes:** Entertainment, not business utility

### reposit v1.0.0
- **Description:** Community knowledge base for AI agents — search solutions, share fixes, vote on quality
- **Relevance:** Error solving, pattern sharing
- **Status:** 🤔 MAYBE
- **Verdict:** MCP server that searches community solutions before reinventing. Search works without auth; sharing requires login. Could help with common errors (npm issues, API quirks). However, overlaps with existing memory_search + Google. Value unclear for Jakob's specific stack. Defer until hitting recurring errors that community could solve.
- **Location:** `skills/explore/reposit/`

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
- **Status:** 🤔 MAYBE
- **Verdict:** Maton.ai-powered gateway with managed OAuth for 30+ services (Slack, HubSpot, Salesforce, Stripe, Google Workspace, etc.). Single API key + OAuth flow instead of managing individual service credentials. Well-documented with extensive reference guides. However, Jakob already has `gog` for Google services and other specific tools. Only valuable if he needs unified access to many services (e.g., HubSpot + Salesforce + Stripe together). Keep as option for future CRM/sales stack integration.
- **Location:** `skills/explore/api-gateway/`

### prompts-workflow v1.0.0
- **Description:** Automated workflow for collecting prompts (Reddit, GitHub, HN, SearXNG), converting to Clawdbot Skills, publishing to ClawdHub
- **Relevance:** Prompt curation, ClawdHub publishing
- **Status:** ❌ SKIP
- **Verdict:** Chinese-language focused skill for bulk prompt collection and publishing. Designed for prompt curators who publish to ClawdHub marketplace. Jakob is a skill consumer, not a publisher. No relevance to cabin management or real estate work. Skip.
- **Location:** `skills/explore/prompts-workflow/` (will delete)

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
- **Status:** ❌ SKIP
- **Verdict:** Directory service (ctxly.com) for discovering agent tools/platforms. Similar to ClawdHub explore function already built into `clawdhub` CLI. Just a JSON API wrapper around service listings. No unique value over existing discovery methods. Skip.
- **Location:** `skills/explore/agent-directory/` (will delete)

### qqmap v1.0.0
- **Description:** 腾讯地图Web服务API集成 (Tencent Maps Web Service API)
- **Relevance:** Chinese mapping service
- **Status:** 📝 Pending
- **Notes:** No China-focused projects

### progressive-memory v0.1.0
- **Description:** Token-efficient memory system with progressive disclosure — index-first, fetch details on demand
- **Relevance:** Memory optimization
- **Status:** ❌ SKIP
- **Verdict:** Just a markdown formatting convention (index tables + detail sections), not a functional tool. Pattern is useful (scan 100 tokens vs 3500) but can adopt format without installing skill. Already have byterover for knowledge management. No code to execute — just documentation. Skip.
- **Location:** `skills/explore/progressive-memory/` (will delete)

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
| 2026-02-03 | meta-tags, hybrid-memory, computer-use, prompt-optimizer, capability-evolver | 1 INSTALL, 1 MAYBE, 2 SKIP, 1 NOT FOUND |
| 2026-02-04 | ai-humanizer, clawshot, reposit, progressive-memory, prompts-workflow | 2 MAYBE, 3 SKIP |
| 2026-02-05 | xmtp-cli, xmtp-agent, vestaboard, api-gateway, agent-directory | 1 MAYBE, 4 SKIP |

---

*Last updated: 2026-02-02 — Created backlog from clawdhub explore*
