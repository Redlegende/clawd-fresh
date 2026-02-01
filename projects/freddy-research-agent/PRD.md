# PRD: Custom Deep Research Agent MVP

**Project:** Freddy Deep Research Agent v1.0  
**Status:** Draft  
**Created:** 2026-01-29  
**Owner:** Jakob Bakken  

---

## 1. Executive Summary

Build a cost-effective, customizable deep research agent using:
- **Crawl4AI** for web scraping (free)
- **Brave Search API** for search (free tier: 2,000 queries/month)
- **Moonshot/Kimi models ONLY** — unified ecosystem, better value

**Target Cost:** ~$0.20-$0.50 per research task (Moonshot-only)  
**Advantage:** 10x cheaper than enterprise solutions, unified ecosystem, no external dependencies

---

## 2. Goals & Objectives

### Primary Goals
1. Build MVP that takes a research query → returns synthesized report
2. Support multiple LLM providers (not locked to Gemini)
3. Keep costs predictable and low
4. Make it extensible for future features

### Success Metrics
- [ ] Can complete a research task end-to-end in <5 minutes
- [ ] Cost per task stays under $1.00 with default settings
- [ ] Output quality comparable to manual research
- [ ] Easy to switch between LLM providers

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEEP RESEARCH AGENT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   Input      │────▶│  Query       │────▶│  Keyword     │   │
│  │   Handler    │     │  Analyzer    │     │  Generator   │   │
│  └──────────────┘     └──────────────┘     └──────┬───────┘   │
│                                                   │            │
│                          ┌────────────────────────┘            │
│                          ▼                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │  Report      │◀────│  Synthesis   │◀────│  Content     │   │
│  │  Generator   │     │  Engine      │     │  Crawler     │   │
│  └──────────────┘     └──────────────┘     └──────┬───────┘   │
│                                                   │            │
│                          ┌────────────────────────┘            │
│                          ▼                                     │
│                   ┌──────────────┐                            │
│                   │  Search      │                            │
│                   │  Grounding   │                            │
│                   └──────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Core Modules

#### 3.1 Query Analyzer
- **Purpose:** Understand research intent and break down complex queries
- **Input:** Natural language research question
- **Output:** Structured research plan + search keywords
- **LLM:** Lightweight model (Flash, GPT-4o-mini, Kimi K2)

#### 3.2 Keyword Generator
- **Purpose:** Generate multiple search queries from research plan
- **Strategy:** 
  - Generate 5-10 varied search queries
  - Include broad + specific queries
  - Cover different angles of the topic
- **LLM:** Same lightweight model

#### 3.3 Search Module
- **Purpose:** Execute searches and extract URLs
- **Primary:** **Brave Search API** (free tier: 2,000 queries/month)
- **Fallback:** Tavily, Serper.dev (if Brave limits hit)
- **Output:** Ranked list of URLs with relevance scores
- **Why Brave:** Free tier sufficient for testing, no Google dependency

#### 3.4 Content Crawler
- **Purpose:** Fetch and extract content from URLs
- **Tool:** Crawl4AI (AsyncWebCrawler)
- **Features:**
  - Parallel crawling (configurable concurrency)
  - Markdown extraction (clean, LLM-friendly)
  - Content filtering (remove ads, nav, etc.)
  - Timeout handling (skip slow pages)
- **Output:** Clean markdown content per URL

#### 3.5 Synthesis Engine
- **Purpose:** Combine all crawled content into coherent report
- **Input:** Research query + multiple content chunks
- **Output:** Structured markdown report with citations
- **LLM:** Stronger model (Gemini Pro, Kimi K2.5, GPT-4o)
- **Process:**
  1. Chunk content to fit context window
  2. Summarize each source
  3. Synthesize cross-source insights
  4. Generate final report with structure

#### 3.6 Report Generator
- **Purpose:** Format and output final report
- **Features:**
  - Multiple formats (Markdown, JSON, HTML)
  - Automatic table of contents
  - Citations linking to sources
  - Executive summary
  - Key findings bullet points

---

## 4. LLM Provider Strategy (IMPORTANT)

### Moonshot-Only Strategy

**Unified ecosystem approach — everything runs on Kimi models.**

#### Available Kimi Models

| Model | Input | Output | Best For | Cost Level |
|-------|-------|--------|----------|------------|
| **kimi-k2-flash-preview** | $0.10/M tokens | $0.50/M tokens | Query analysis, keywords, summaries | ⭐ CHEAPEST |
| **kimi-k2-0905-preview** | $0.50/M tokens | $2.00/M tokens | Synthesis, final report | ⭐⭐ BALANCED |
| **kimi-k2-thinking** | $0.50/M tokens | $2.00/M tokens | Complex reasoning | ⭐⭐⭐ QUALITY |
| **kimi-k2.5** | $0.50/M tokens | $2.00/M tokens | Best overall quality | ⭐⭐⭐ PREMIUM |

#### Recommended Configurations

**OPTION 1: All K2.5 (Best Quality)**
```python
FAST_MODEL=kimi-k2-0905-preview
STRONG_MODEL=kimi-k2-0905-preview
# Cost: ~$0.50 per research task
```

**OPTION 2: Flash + K2.5 (Balanced)**
```python
FAST_MODEL=kimi-k2-flash-preview      # For analysis, keywords
STRONG_MODEL=kimi-k2-0905-preview     # For synthesis
# Cost: ~$0.30 per research task (40% savings)
```

**OPTION 3: All Flash (Most Economical)**
```python
FAST_MODEL=kimi-k2-flash-preview
STRONG_MODEL=kimi-k2-flash-preview
# Cost: ~$0.15 per research task (70% savings)
```

#### Why Moonshot-Only?

✅ **Unified billing** — one API key, one provider  
✅ **Better context** — 256K tokens on all models  
✅ **Cost transparency** — no hidden fees, clear pricing  
✅ **No vendor lock-in** — OpenAI-compatible API  
✅ **Consistent quality** — same training, same ecosystem

---

## 5. Technical Implementation

### 5.1 Tech Stack

```yaml
Language: Python 3.10+
Core Dependencies:
  - crawl4ai: Web scraping (free)
  - openai: Moonshot API (OpenAI-compatible)
  - aiohttp: Async HTTP requests
  - pydantic: Data validation
  - python-dotenv: Environment management
  - rich: CLI output formatting
  - loguru: Logging

Search:
  - brave-search: Brave Search API (free tier: 2k/month)
  - tavily-python: Alternative search (optional)
```

### 5.2 Project Structure

```
freddy-research-agent/
├── src/
│   ├── __init__.py
│   ├── config.py              # Configuration management
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py            # Base LLM interface
│   │   ├── gemini.py          # Gemini provider
│   │   ├── kimi.py            # Kimi/Moonshot provider
│   │   └── openai.py          # OpenAI compatible
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── query_analyzer.py  # Query understanding
│   │   ├── keyword_gen.py     # Search query generation
│   │   ├── search.py          # Search execution
│   │   ├── crawler.py         # Web crawling
│   │   ├── synthesizer.py     # Content synthesis
│   │   └── report.py          # Report generation
│   └── utils/
│       ├── __init__.py
│       ├── text.py            # Text processing
│       ├── token_counter.py   # Token management
│       └── cache.py           # Simple caching
├── tests/
├── examples/
├── .env.example
├── requirements.txt
└── README.md
```

### 5.3 Configuration (.env)

```bash
# REQUIRED: Moonshot API Key
MOONSHOT_API_KEY=your_moonshot_key_here
# Get your key: https://platform.moonshot.cn/

# REQUIRED: Brave Search API Key (free tier: 2,000 queries/month)
BRAVE_API_KEY=your_brave_key_here
# Get your key: https://api.search.brave.com/

# Alternative search (optional backup)
# TAVILY_API_KEY=your_tavily_key_here

# Moonshot Model Selection
FAST_MODEL=kimi-k2-flash-preview      # Cheap: analysis, keywords, summaries
STRONG_MODEL=kimi-k2-0905-preview     # Quality: synthesis, final report

# Research Settings
MAX_SEARCH_QUERIES=10
MAX_CRAWL_URLS=20
MAX_CONCURRENT_CRAWLS=5
CRAWL_TIMEOUT_SECONDS=30
MAX_CONTENT_LENGTH_PER_PAGE=10000     # Characters

# Cost Controls
MAX_COST_PER_TASK_USD=1.00
ENABLE_COST_TRACKING=true
```

---

## 6. Usage Examples

### Basic Usage

```python
import asyncio
from freddy_research import ResearchAgent

async def main():
    agent = ResearchAgent()
    
    report = await agent.research(
        query="Latest developments in AI safety regulations 2024",
        max_search_queries=10,
        max_pages=15
    )
    
    print(report.markdown)
    print(f"Cost: ${report.cost_usd:.2f}")
    print(f"Sources: {len(report.sources)}")

if __name__ == "__main__":
    asyncio.run(main())
```

### Advanced Usage with Custom Models

```python
from freddy_research import ResearchAgent, ModelConfig

# Configure custom models
config = ModelConfig(
    fast_model="gemini-2.5-flash",      # For keywords
    strong_model="kimi-k2-0905-preview", # For synthesis
    search_provider="brave"              # Use Brave instead of Google
)

agent = ResearchAgent(config=config)

report = await agent.research(
    query="Compare pricing strategies for SaaS businesses in 2024",
    output_format="json",                  # markdown, json, html
    include_executive_summary=True,
    max_cost_usd=0.50                      # Hard cost limit
)
```

### CLI Usage

```bash
# Basic research
python -m freddy_research "Latest AI safety regulations"

# With options
python -m freddy_research \
  "SaaS pricing strategies" \
  --max-queries 15 \
  --max-pages 20 \
  --model kimi-k2-0905-preview \
  --output report.md

# Cost estimate only (dry run)
python -m freddy_research \
  "Climate change mitigation technologies" \
  --estimate-cost
```

---

## 7. Cost Breakdown & Optimization

### Default Configuration Costs (Moonshot-Only)

| Component | Cost | Notes |
|-----------|------|-------|
| 10 Search Queries (Brave) | $0.00 | FREE (2,000/month limit) |
| Query Analysis (Flash) | ~$0.005 | 1k input tokens @ $0.10/M |
| Keyword Generation (Flash) | ~$0.005 | 1k tokens @ $0.10/M |
| Crawling | $0.00 | Crawl4AI is free |
| 15 Page Summaries (Flash) | ~$0.03 | ~500 tokens each @ $0.10/M |
| Final Synthesis (K2.5) | ~$0.15 | 10k input, 2k output |
| **TOTAL** | **~$0.19** | Per research task |

### Cost Optimization Strategies

1. **Use Flash for 70% of tasks** → Save 60% vs all K2.5
2. **Brave Search free tier** → $0 for first 2k searches
3. **Limit crawl pages** → Each page costs tokens to process
4. **Cache common queries** → Skip re-researching same topics
5. **All-Flash mode** → ~$0.08 per task (for simple research)

### Budget Tiers (Moonshot-Only)

| Tier | Search Queries | Pages | Model Mix | Est. Cost |
|------|---------------|-------|-----------|-----------|
| **Economy** | 5 | 10 | All Flash | ~$0.08 |
| **Standard** | 10 | 15 | Flash + K2.5 | ~$0.19 |
| **Premium** | 20 | 30 | All K2.5 | ~$0.75 |
| **Enterprise** | 50 | 50 | All K2.5 + Thinking | ~$2.00 |

---

## 8. Future Enhancements (v2.0)

- [ ] Recursive research (follow links within findings)
- [ ] Multi-language support
- [ ] PDF/DOCX export
- [ ] Web dashboard UI
- [ ] Scheduled research tasks
- [ ] Research history & caching
- [ ] Custom extraction schemas
- [ ] Integration with Kvitfjellhytter dashboard
- [ ] Sub-agent parallelization (use multiple LLMs simultaneously)
- [ ] Fact-checking module
- [ ] Source credibility scoring

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Search API costs spike | High | Set hard limits, use Brave free tier |
| Crawl4AI breaks on site changes | Medium | Multiple fallback crawlers |
| LLM rate limits | Medium | Implement exponential backoff |
| Content quality varies | Medium | Source ranking, credibility scores |
| Token limit exceeded | Low | Chunking strategy, summary cascading |

---

## 10. Acceptance Criteria

- [ ] Can research "Latest AI safety regulations 2024" end-to-end in <5 min
- [ ] Output includes: executive summary, key findings, detailed sections, citations
- [ ] Cost stays under $1.00 for standard queries
- [ ] Can switch between Kimi/Gemini/OpenAI with config change
- [ ] CLI tool works with simple command
- [ ] Reports are readable and well-structured
- [ ] Handles 80% of common research queries successfully

---

*Next Step: Create GitHub repo and start building MVP (ETA: 2-3 days)*
