"""
Freddy Research Agent - Moonshot-Only MVP
Custom Deep Research Agent using Kimi models + Brave Search

This version uses ONLY Moonshot/Kimi models for unified ecosystem.
"""

import asyncio
import os
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
import json

# Core dependencies
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
from crawl4ai.content_filter_strategy import PruningContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator

# Moonshot API (OpenAI-compatible)
from openai import AsyncOpenAI

# HTTP client for Brave Search
import aiohttp


# =============================================================================
# CONFIGURATION
# =============================================================================

@dataclass
class ResearchConfig:
    """Configuration for the research agent - Moonshot Only"""
    
    # API Keys
    moonshot_api_key: Optional[str] = None
    brave_api_key: Optional[str] = None
    
    # Model Selection (Moonshot Only)
    fast_model: str = "kimi-k2-turbo-preview"       # For analysis, keywords
    strong_model: str = "kimi-k2.5"                 # For synthesis
    
    # Research Limits
    max_search_queries: int = 10
    max_crawl_urls: int = 20
    max_concurrent_crawls: int = 5
    crawl_timeout: int = 30
    
    # Cost Controls
    max_cost_usd: float = 1.00
    enable_cost_tracking: bool = True


# =============================================================================
# BRAVE SEARCH MODULE
# =============================================================================

class BraveSearchClient:
    """Brave Search API client - free tier: 2,000 queries/month"""
    
    BASE_URL = "https://api.search.brave.com/res/v1/web/search"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": api_key
        }
    
    async def search(self, query: str, count: int = 10) -> List[Dict[str, Any]]:
        """
        Search using Brave Search API
        Returns list of results with title, url, description
        """
        params = {
            "q": query,
            "count": min(count, 20),  # Brave max is 20
            "offset": 0,
            "mkt": "en-US",
            "safesearch": "moderate",
            "freshness": "all",
            "text_decorations": "0",
            "text_snippets": "1"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                self.BASE_URL, 
                headers=self.headers, 
                params=params
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Brave Search failed: {response.status} - {error_text}")
                
                data = await response.json()
                
                # Extract web results
                results = []
                web_results = data.get("web", {}).get("results", [])
                
                for result in web_results:
                    results.append({
                        "title": result.get("title", ""),
                        "url": result.get("url", ""),
                        "description": result.get("description", ""),
                        "age": result.get("age", "")
                    })
                
                return results
    
    async def search_multiple(self, queries: List[str]) -> List[str]:
        """Search multiple queries and aggregate unique URLs"""
        all_urls = []
        
        for i, query in enumerate(queries):
            try:
                # Rate limit: 1 req/sec on free tier
                if i > 0:
                    await asyncio.sleep(1.1)
                results = await self.search(query, count=10)
                urls = [r["url"] for r in results if r["url"]]
                all_urls.extend(urls)
            except Exception as e:
                print(f"   ⚠️  Search failed for '{query[:30]}...': {e}")
                continue
        
        # Remove duplicates while preserving order
        seen = set()
        unique_urls = []
        for url in all_urls:
            if url and url not in seen:
                seen.add(url)
                unique_urls.append(url)
        
        return unique_urls


# =============================================================================
# MOONSHOT LLM PROVIDER
# =============================================================================

class MoonshotProvider:
    """Moonshot/Kimi API provider - OpenAI-compatible"""
    
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.moonshot.ai/v1"
        )
        self.token_usage = {
            "input_tokens": 0,
            "output_tokens": 0,
            "cost_usd": 0.0
        }
    
    def _calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost based on model pricing"""
        pricing = {
            "kimi-k2-turbo-preview": {"input": 0.10, "output": 0.50},      # $ per million tokens
            "kimi-k2-0905-preview": {"input": 0.50, "output": 2.00},
            "kimi-k2.5": {"input": 0.50, "output": 2.00},
            "kimi-k2-thinking": {"input": 0.50, "output": 2.00},
        }
        
        p = pricing.get(model, pricing["kimi-k2-0905-preview"])
        input_cost = (input_tokens / 1_000_000) * p["input"]
        output_cost = (output_tokens / 1_000_000) * p["output"]
        return input_cost + output_cost
    
    async def generate(
        self, 
        prompt: str, 
        model: str = "kimi-k2-0905-preview",
        temperature: float = 0.3
    ) -> str:
        """Generate text using Moonshot API"""
        # Some models (like k2.5) only support temperature=1
        models_no_temp = ["kimi-k2.5"]
        
        kwargs = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}]
        }
        if model not in models_no_temp:
            kwargs["temperature"] = temperature
            
        response = await self.client.chat.completions.create(**kwargs)
        
        # Track usage
        usage = response.usage
        if usage:
            self.token_usage["input_tokens"] += usage.prompt_tokens
            self.token_usage["output_tokens"] += usage.completion_tokens
            cost = self._calculate_cost(model, usage.prompt_tokens, usage.completion_tokens)
            self.token_usage["cost_usd"] += cost
        
        return response.choices[0].message.content
    
    def get_usage_report(self) -> Dict[str, Any]:
        """Get token usage and cost report"""
        return self.token_usage.copy()


# =============================================================================
# RESEARCH MODULES
# =============================================================================

class QueryAnalyzer:
    """Analyzes research queries and generates search keywords"""
    
    def __init__(self, llm: MoonshotProvider, model: str):
        self.llm = llm
        self.model = model
    
    async def analyze(self, query: str) -> dict:
        """Break down query into research plan"""
        prompt = f"""Analyze this research query and break it down:

Query: "{query}"

Provide:
1. Main topic
2. Key sub-topics to research (3-5 items)
3. What the user really wants to know
4. Suggested search angles

Format as concise bullet points."""
        
        analysis = await self.llm.generate(prompt, model=self.model)
        return {
            'original_query': query,
            'analysis': analysis
        }
    
    async def generate_keywords(self, query: str, count: int = 10) -> List[str]:
        """Generate multiple search queries from original query"""
        prompt = f"""Generate {count} different search queries for this research topic.
Make them diverse - cover different angles, time periods, and specificity levels.

Research Topic: "{query}"

Return ONLY the search queries, one per line. No numbering, no explanations."""
        
        response = await self.llm.generate(prompt, model=self.model)
        keywords = [k.strip() for k in response.strip().split('\n') if k.strip()]
        return keywords[:count]


class ContentCrawler:
    """Crawls URLs and extracts content using Crawl4AI"""
    
    def __init__(self, max_concurrent: int = 5, timeout: int = 30):
        self.max_concurrent = max_concurrent
        self.timeout = timeout
    
    async def crawl_single(self, crawler: AsyncWebCrawler, url: str) -> dict:
        """Crawl a single URL"""
        try:
            # Configure content filter for clean output
            md_generator = DefaultMarkdownGenerator(
                content_filter=PruningContentFilter(threshold=0.4, threshold_type="fixed")
            )
            
            run_config = CrawlerRunConfig(
                markdown_generator=md_generator,
                cache_mode=True
            )
            
            result = await crawler.arun(url, config=run_config)
            
            return {
                'url': url,
                'title': result.metadata.get('title', 'Unknown'),
                'content': result.markdown.fit_markdown if hasattr(result.markdown, 'fit_markdown') else result.markdown,
                'success': True
            }
        except Exception as e:
            return {
                'url': url,
                'title': 'Error',
                'content': f"Failed to crawl: {str(e)}",
                'success': False
            }
    
    async def crawl_urls(self, urls: List[str], max_urls: int = 20) -> List[dict]:
        """Crawl multiple URLs in parallel"""
        urls = urls[:max_urls]  # Limit URLs
        
        browser_config = BrowserConfig(headless=True)
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            # Create semaphore to limit concurrent crawls
            semaphore = asyncio.Semaphore(self.max_concurrent)
            
            async def crawl_with_limit(url):
                async with semaphore:
                    return await self.crawl_single(crawler, url)
            
            # Run all crawls concurrently
            results = await asyncio.gather(*[crawl_with_limit(url) for url in urls])
        
        # Filter to successful crawls only
        return [r for r in results if r['success']]


class SynthesisEngine:
    """Synthesizes crawled content into a research report"""
    
    def __init__(self, llm: MoonshotProvider, model: str):
        self.llm = llm
        self.model = model
    
    async def synthesize(self, query: str, sources: List[dict]) -> str:
        """Create synthesized report from sources"""
        
        # Create source summaries
        source_texts = []
        for i, source in enumerate(sources, 1):
            content_preview = source['content'][:1000]  # First 1000 chars to save tokens
            source_texts.append(f"""Source {i}: {source['title']}
URL: {source['url']}
{content_preview}""")
        
        all_sources = "\n---\n".join(source_texts)
        
        prompt = f"""You are a research assistant. Synthesize the following sources into a comprehensive report.

ORIGINAL RESEARCH QUESTION:
{query}

SOURCES FOUND ({len(sources)} total):
{all_sources}

INSTRUCTIONS:
1. Write an executive summary (3-5 bullet points)
2. Provide detailed findings organized by themes
3. Include specific facts, data points, and quotes from sources
4. Add a "Sources" section listing all URLs referenced
5. Highlight any contradictions or gaps in the information

Format in clean Markdown."""
        
        report = await self.llm.generate(prompt, model=self.model)
        return report


# =============================================================================
# MAIN RESEARCH AGENT
# =============================================================================

@dataclass
class ResearchReport:
    """Output from research agent"""
    query: str
    markdown: str
    sources: List[dict]
    search_queries: List[str]
    crawled_urls: List[str]
    token_usage: Dict[str, Any]
    cost_estimate_usd: float


class ResearchAgent:
    """Main research agent - Moonshot Only"""
    
    def __init__(self, config: ResearchConfig = None):
        self.config = config or ResearchConfig()
        
        # Validate API keys
        if not self.config.moonshot_api_key:
            raise ValueError("MOONSHOT_API_KEY is required")
        if not self.config.brave_api_key:
            raise ValueError("BRAVE_API_KEY is required for search (free tier available)")
        
        # Initialize providers
        self.llm = MoonshotProvider(self.config.moonshot_api_key)
        self.search = BraveSearchClient(self.config.brave_api_key)
        
        # Initialize modules with appropriate models
        self.analyzer = QueryAnalyzer(self.llm, self.config.fast_model)
        self.crawler = ContentCrawler(
            max_concurrent=self.config.max_concurrent_crawls,
            timeout=self.config.crawl_timeout
        )
        self.synthesizer = SynthesisEngine(self.llm, self.config.strong_model)
    
    async def research(self, query: str) -> ResearchReport:
        """
        Main research pipeline:
        1. Analyze query
        2. Generate search keywords
        3. Search web (Brave)
        4. Crawl URLs
        5. Synthesize report
        """
        print(f"🔍 Starting research: {query[:60]}...")
        print("🌙 Using Moonshot-only ecosystem\n")
        
        # Step 1: Analyze query
        print("📊 Analyzing query...")
        analysis = await self.analyzer.analyze(query)
        
        # Step 2: Generate search keywords
        print("🎯 Generating search queries...")
        keywords = await self.analyzer.generate_keywords(
            query, 
            count=self.config.max_search_queries
        )
        print(f"   Generated {len(keywords)} search queries")
        
        # Step 3: Search web (Brave)
        print("🌐 Searching web (Brave)...")
        urls = await self.search.search_multiple(keywords)
        print(f"   Found {len(urls)} unique URLs")
        
        # Step 4: Crawl URLs
        print("🕷️  Crawling content...", flush=True)
        sources = await self.crawler.crawl_urls(
            urls, 
            max_urls=self.config.max_crawl_urls
        )
        print(f"   Successfully crawled {len(sources)} pages", flush=True)
        
        # Step 5: Synthesize report
        print("📝 Synthesizing report...")
        report_text = await self.synthesizer.synthesize(query, sources)
        
        # Get usage stats
        usage = self.llm.get_usage_report()
        
        print(f"✅ Research complete!")
        print(f"   Tokens used: {usage['input_tokens']:,} in / {usage['output_tokens']:,} out")
        print(f"   Est. cost: ${usage['cost_usd']:.3f}")
        
        return ResearchReport(
            query=query,
            markdown=report_text,
            sources=sources,
            search_queries=keywords,
            crawled_urls=[s['url'] for s in sources],
            token_usage=usage,
            cost_estimate_usd=usage['cost_usd']
        )


# =============================================================================
# CLI INTERFACE
# =============================================================================

async def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Freddy Research Agent - Moonshot Only")
    parser.add_argument("query", help="Research query")
    parser.add_argument("--output", "-o", help="Output file (default: print to stdout)")
    parser.add_argument("--max-queries", type=int, default=10, help="Max search queries")
    parser.add_argument("--max-pages", type=int, default=20, help="Max pages to crawl")
    parser.add_argument("--fast-model", default="kimi-k2-turbo-preview", help="Model for analysis")
    parser.add_argument("--strong-model", default="kimi-k2.5", help="Model for synthesis")
    
    args = parser.parse_args()
    
    # Load config from environment
    config = ResearchConfig(
        moonshot_api_key=os.getenv("MOONSHOT_API_KEY"),
        brave_api_key=os.getenv("BRAVE_API_KEY"),
        max_search_queries=args.max_queries,
        max_crawl_urls=args.max_pages,
        fast_model=args.fast_model,
        strong_model=args.strong_model
    )
    
    if not config.moonshot_api_key:
        print("❌ Error: Set MOONSHOT_API_KEY environment variable")
        print("   Get key from: https://platform.moonshot.cn/")
        return
    
    if not config.brave_api_key:
        print("❌ Error: Set BRAVE_API_KEY environment variable")
        print("   Get free key from: https://api.search.brave.com/")
        print("   (2,000 free queries per month)")
        return
    
    # Run research
    agent = ResearchAgent(config)
    report = await agent.research(args.query)
    
    # Output
    if args.output:
        with open(args.output, 'w') as f:
            f.write(report.markdown)
        print(f"\n📄 Report saved to: {args.output}")
    else:
        print("\n" + "="*80)
        print(report.markdown)
        print("="*80)
    
    print(f"\n📊 Summary:")
    print(f"   Sources: {len(report.sources)}")
    print(f"   Search queries: {len(report.search_queries)}")
    print(f"   Tokens: {report.token_usage['input_tokens']:,} in / {report.token_usage['output_tokens']:,} out")
    print(f"   Total cost: ${report.cost_estimate_usd:.3f} USD")


if __name__ == "__main__":
    asyncio.run(main())
