"""
Performance-Optimized HTTPX-First Crawler
- HTTPX primary crawler with connection pooling
- Playwright fallback with browser reuse
- Concurrent operations (robots.txt, sitemap, metadata)
- Smart page prioritization
- Efficient resource handling
"""
import asyncio
import random
import re
import logging
from dataclasses import dataclass, field
from typing import Optional, Set
from urllib.parse import urljoin, urlparse
from collections import deque

import httpx
from bs4 import BeautifulSoup

from app.modules.crawl_validator import CrawlValidator

logger = logging.getLogger(__name__)


@dataclass
class RawPage:
    url: str
    html: str
    status_code: int
    headers: dict
    metadata: dict = field(default_factory=dict)
    internal_links: list[str] = field(default_factory=list)
    external_links: list[str] = field(default_factory=list)
    images: list[dict] = field(default_factory=list)
    scripts: list[str] = field(default_factory=list)
    stylesheets: list[str] = field(default_factory=list)
    json_ld: list[dict] = field(default_factory=list)
    canonical: Optional[str] = None
    robots_meta: Optional[str] = None
    og_tags: dict = field(default_factory=dict)
    twitter_tags: dict = field(default_factory=dict)


@dataclass
class CrawlResult:
    pages: dict[str, dict]
    robots_txt: Optional[str]
    llms_txt: Optional[str]
    sitemap_urls: list[str]
    total_pages: int
    is_blocked: bool = False
    block_reason: Optional[str] = None
    block_type: Optional[str] = None
    block_details: Optional[str] = None


USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

# High-value page patterns
HIGH_VALUE_PATTERNS = [
    r"^/+$",  # Homepage
    r"about",
    r"service",
    r"product",
    r"contact",
    r"faq",
    r"blog",
    r"pricing",
    r"features",
]


class PerformanceOptimizedCrawler:
    """Performance-optimized HTTPX-first crawler."""

    def __init__(self, max_pages: int = 50, timeout: int = 30):
        self.max_pages = max_pages
        self.timeout = timeout
        self.validator = CrawlValidator()
        self.http_client = None

    async def crawl(self, start_url: str) -> CrawlResult:
        """Main crawl entry point."""
        try:
            logger.info(f"\n{'='*70}")
            logger.info(f"Starting Analysis")
            logger.info(f"URL: {start_url}")
            logger.info(f"Max Pages: {self.max_pages}")
            logger.info(f"{'='*70}")
            
            base = self._base_url(start_url)
            
            # Create persistent HTTP client
            self.http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(connect=10, read=30, write=10, pool=5),
                follow_redirects=True,
                verify=False,
                limits=httpx.Limits(max_connections=20, max_keepalive_connections=10)
            )
            
            # STEP 1: Fetch homepage
            logger.info("\n[STEP 1] Fetching Homepage...")
            homepage_html, status_code, used_playwright = await self._fetch_page_httpx_first(start_url)
            
            if not homepage_html:
                logger.error("✗ Failed to load homepage")
                return CrawlResult(
                    pages={},
                    robots_txt=None,
                    llms_txt=None,
                    sitemap_urls=[],
                    total_pages=0,
                    is_blocked=True,
                    block_reason="Failed to load homepage",
                    block_type="Connection Error",
                    block_details="Could not fetch the homepage",
                )
            
            logger.info(f"✓ HTML Retrieved")
            logger.info(f"  HTTP Status: {status_code}")
            logger.info(f"  HTML Size: {len(homepage_html)} bytes")
            logger.info(f"  Playwright Used: {used_playwright}")
            
            # STEP 2: Validate
            logger.info("\n[STEP 2] Validating Homepage...")
            validation = self.validator.validate(status_code, homepage_html, start_url)
            
            if not validation.is_valid:
                logger.warning(f"✗ BLOCKED: {validation.block_type}")
                logger.warning(f"  Reason: {validation.reason}")
                return CrawlResult(
                    pages={},
                    robots_txt=None,
                    llms_txt=None,
                    sitemap_urls=[],
                    total_pages=0,
                    is_blocked=True,
                    block_reason=validation.reason,
                    block_type=validation.block_type,
                    block_details=validation.details,
                )
            
            logger.info("✓ Validation Passed")
            
            # STEP 3: Concurrent metadata fetching
            logger.info("\n[STEP 3] Fetching Metadata (robots.txt, sitemap)...")
            robots_txt, llms_txt, sitemap_urls = await asyncio.gather(
                self._fetch_text(f"{base}/robots.txt"),
                self._fetch_text(f"{base}/llms.txt"),
                self._fetch_sitemap(base),
                return_exceptions=True
            )
            
            robots_txt = robots_txt if isinstance(robots_txt, str) else None
            llms_txt = llms_txt if isinstance(llms_txt, str) else None
            sitemap_urls = sitemap_urls if isinstance(sitemap_urls, list) else []
            
            logger.info(f"✓ Metadata Fetched")
            logger.info(f"  robots.txt: {'found' if robots_txt else 'not found'}")
            logger.info(f"  llms.txt: {'found' if llms_txt else 'not found'}")
            logger.info(f"  Sitemap URLs: {len(sitemap_urls)}")
            
            # STEP 4: Build crawl queue with smart prioritization
            logger.info("\n[STEP 4] Building Crawl Queue...")
            soup = BeautifulSoup(homepage_html, "lxml")
            internal_links = self._extract_links(soup, start_url, base, internal=True)
            
            # Prioritize high-value pages
            prioritized_urls = self._prioritize_urls([start_url] + internal_links + sitemap_urls, base)
            seed = prioritized_urls[:self.max_pages]
            
            logger.info(f"✓ Queue Built")
            logger.info(f"  Total URLs found: {len(internal_links) + len(sitemap_urls)}")
            logger.info(f"  Crawling: {len(seed)} pages")
            
            # STEP 5: Crawl pages concurrently
            logger.info(f"\n[STEP 5] Crawling Pages (Concurrent)...")
            pages = await self._crawl_pages_concurrent(seed, base)
            logger.info(f"✓ Crawl Complete: {len(pages)} pages fetched")
            
            logger.info(f"\n{'='*70}")
            logger.info(f"Analysis Complete")
            logger.info(f"Pages Crawled: {len(pages)}")
            logger.info(f"{'='*70}\n")
            
            return CrawlResult(
                pages={url: self._page_to_dict(p) for url, p in pages.items()},
                robots_txt=robots_txt,
                llms_txt=llms_txt,
                sitemap_urls=sitemap_urls,
                total_pages=len(pages),
                is_blocked=False,
            )
        
        except Exception as e:
            logger.error(f"✗ Unexpected Error: {type(e).__name__}: {str(e)}")
            logger.error(f"{'='*70}\n")
            return CrawlResult(
                pages={},
                robots_txt=None,
                llms_txt=None,
                sitemap_urls=[],
                total_pages=0,
                is_blocked=True,
                block_reason="Unexpected error",
                block_type="Error",
                block_details=f"{type(e).__name__}: {str(e)}",
            )
        
        finally:
            # Cleanup
            if self.http_client:
                await self.http_client.aclose()

    async def _fetch_page_httpx_first(self, url: str) -> tuple[str, int, bool]:
        """HTTPX fetch first; if content looks JS-rendered (no title/h1), try Playwright."""
        logger.info(f"  Sending HTTP request to {url}")

        html, status_code = "", 0
        for attempt in range(2):
            html, status_code = await self._fetch_with_httpx(url)
            if html and len(html) > 200:
                break
            if attempt == 0:
                logger.info(f"  Retrying {url}...")
                await asyncio.sleep(2)

        if html and len(html) > 200:
            # Check if page is JS-rendered (no title and no h1 in raw HTML)
            soup_check = BeautifulSoup(html, "lxml")
            has_title = bool(soup_check.title and soup_check.title.string and soup_check.title.string.strip())
            has_h1 = bool(soup_check.find("h1"))
            has_og_title = bool(soup_check.find("meta", property="og:title"))
            if has_title or has_h1 or has_og_title:
                logger.info(f"  HTTPX OK — {len(html)} bytes")
                return html, status_code, False
            # JS-rendered: try Playwright
            logger.info(f"  HTTPX got {len(html)} bytes but no title/h1 — trying Playwright")
            pw_html, pw_status = await self._fetch_with_playwright(url)
            if pw_html and len(pw_html) > len(html):
                logger.info(f"  Playwright OK — {len(pw_html)} bytes")
                return pw_html, pw_status, True
            logger.info(f"  Playwright unavailable — using HTTPX result")
            return html, status_code, False

        logger.warning(f"  HTTPX failed after 2 attempts ({len(html)} bytes)")
        return "", 0, False

    async def _fetch_with_httpx(self, url: str) -> tuple[str, int]:
        """Fetch with HTTPX using persistent client."""
        if not self.http_client:
            return "", 0
        
        try:
            resp = await self.http_client.get(
                url,
                headers={
                    "User-Agent": random.choice(USER_AGENTS),
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Accept-Encoding": "gzip, deflate, br",
                    "DNT": "1",
                    "Connection": "keep-alive",
                    "Upgrade-Insecure-Requests": "1",
                }
            )
            
            logger.debug(f"    HTTP Status: {resp.status_code}")
            
            if resp.status_code == 200 and len(resp.text) > 100:
                return resp.text, resp.status_code
            elif resp.status_code in [403, 429]:
                return resp.text, resp.status_code
            else:
                return "", resp.status_code
        
        except (asyncio.TimeoutError, httpx.TimeoutException):
            logger.debug(f"    Timeout fetching {url}")
            return "", 0
        except Exception as e:
            logger.debug(f"    {type(e).__name__}: {e}")
            return "", 0

    async def _fetch_with_playwright(self, url: str) -> tuple[str, int]:
        """Playwright fetch for JS-rendered pages using a thread pool to avoid FastAPI event loop deadlocks."""
        try:
            return await asyncio.to_thread(self._fetch_playwright_sync, url)
        except Exception as e:
            logger.warning(f"  Playwright thread error: {type(e).__name__}: {e}")
            return "", 0

    def _fetch_playwright_sync(self, url: str) -> tuple[str, int]:
        import time
        import asyncio
        from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
        
        # Ensure the thread has an event loop for Playwright's internals
        try:
            asyncio.get_event_loop()
        except RuntimeError:
            asyncio.set_event_loop(asyncio.new_event_loop())
            
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(user_agent=random.choice(USER_AGENTS))
                page = context.new_page()
                try:
                    resp = page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    time.sleep(2)  # let JS render
                    html = page.content()
                    status = resp.status if resp else 200
                    return html, status
                except PlaywrightTimeoutError:
                    logger.warning(f"  Playwright timeout for {url}")
                    return "", 0
                finally:
                    context.close()
                    browser.close()
        except Exception as e:
            logger.warning(f"  Playwright error: {type(e).__name__}: {e}")
            return "", 0

    async def _crawl_pages_concurrent(self, seeds: list[str], base: str) -> dict[str, RawPage]:
        """Crawl pages concurrently with semaphore."""
        visited: dict[str, RawPage] = {}
        semaphore = asyncio.Semaphore(5)  # Max 5 concurrent requests
        
        async def fetch_and_parse(url: str) -> Optional[RawPage]:
            async with semaphore:
                html, status_code, _ = await self._fetch_page_httpx_first(url)
                
                if not html:
                    return None
                
                soup = BeautifulSoup(html, "lxml")
                page = RawPage(
                    url=url,
                    html=html,
                    status_code=status_code,
                    headers={},
                    metadata=self._extract_metadata(soup),
                    internal_links=self._extract_links(soup, url, base, internal=True),
                    external_links=self._extract_links(soup, url, base, internal=False),
                    images=[],
                    scripts=[s.get("src", "") for s in soup.find_all("script", src=True)],
                    stylesheets=[l.get("href", "") for l in soup.find_all("link", rel="stylesheet")],
                    json_ld=self._extract_json_ld(soup),
                    canonical=self._get_attr(soup, "link[rel='canonical']", "href"),
                    robots_meta=self._get_attr(soup, "meta[name='robots']", "content"),
                    og_tags={t.get("property", "").replace("og:", ""): t.get("content", "")
                             for t in soup.find_all("meta", property=re.compile(r"^og:"))},
                    twitter_tags={t.get("name", "").replace("twitter:", ""): t.get("content", "")
                                  for t in soup.find_all("meta", attrs={"name": re.compile(r"^twitter:")})},
                )
                return page
        
        # Fetch all pages concurrently
        tasks = [fetch_and_parse(url) for url in seeds]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for url, page in zip(seeds, results):
            if isinstance(page, RawPage):
                visited[url] = page
        
        return visited

    async def _fetch_text(self, url: str) -> Optional[str]:
        """Fetch text file."""
        if not self.http_client:
            return None
        
        try:
            resp = await self.http_client.get(url, headers={"User-Agent": random.choice(USER_AGENTS)})
            if resp.status_code == 200:
                return resp.text
        except Exception:
            pass
        
        return None

    async def _fetch_sitemap(self, base: str) -> list[str]:
        """Fetch sitemap, recursively resolving sitemap index entries to get actual page URLs."""
        sitemap_url = f"{base}/sitemap.xml"
        xml = await self._fetch_text(sitemap_url)
        if not xml:
            return []
        return await self._parse_sitemap_recursive(xml, base, depth=0)

    async def _parse_sitemap_recursive(self, xml: str, base: str, depth: int = 0) -> list[str]:
        """Parse sitemap XML. If it's a sitemap index, fetch and parse each child sitemap."""
        if depth > 2:
            return []
        soup = BeautifulSoup(xml, "lxml")
        locs = [loc.text.strip() for loc in soup.find_all("loc") if loc.text.strip()]

        # Separate sub-sitemaps from actual page URLs
        sub_sitemaps = [u for u in locs if u.endswith(".xml") or "sitemap" in u.lower()]
        page_urls = [u for u in locs if u not in sub_sitemaps]

        # If we have page URLs already, return them
        if page_urls:
            return list(dict.fromkeys(page_urls))[:50]

        # Otherwise recurse into sub-sitemaps (fetch up to 3 to find real pages)
        all_pages = []
        for sub_url in sub_sitemaps[:3]:
            sub_xml = await self._fetch_text(sub_url)
            if sub_xml:
                pages = await self._parse_sitemap_recursive(sub_xml, base, depth + 1)
                all_pages.extend(pages)
            if len(all_pages) >= 20:
                break

        return list(dict.fromkeys(all_pages))[:50]

    def _prioritize_urls(self, urls: list[str], base: str) -> list[str]:
        """Prioritize high-value pages."""
        high_value = []
        medium_value = []
        low_value = []
        
        for url in urls:
            path = urlparse(url).path.lower()
            
            is_high = any(re.search(pattern, path) for pattern in HIGH_VALUE_PATTERNS)
            
            if is_high:
                high_value.append(url)
            elif len(path) < 50:
                medium_value.append(url)
            else:
                low_value.append(url)
        
        # Remove duplicates while preserving order
        seen: Set[str] = set()
        result = []
        for url in high_value + medium_value + low_value:
            if url not in seen:
                seen.add(url)
                result.append(url)
        
        return result

    def _extract_metadata(self, soup: BeautifulSoup) -> dict:
        """Extract page metadata."""
        return {
            "title": soup.title.string.strip() if soup.title and soup.title.string else None,
            "meta_description": self._get_attr(soup, "meta[name='description']", "content"),
            "meta_keywords": self._get_attr(soup, "meta[name='keywords']", "content"),
            "h1": [h.get_text(strip=True) for h in soup.find_all("h1")],
            "h2": [h.get_text(strip=True) for h in soup.find_all("h2")],
            "h3": [h.get_text(strip=True) for h in soup.find_all("h3")],
            "lang": soup.html.get("lang") if soup.html else None,
        }

    def _extract_links(self, soup: BeautifulSoup, page_url: str, base: str, internal: bool) -> list[str]:
        """Extract links from page."""
        links = []
        for a in soup.find_all("a", href=True):
            href = urljoin(page_url, a["href"]).split("#")[0].rstrip("/")
            if not href.startswith("http"):
                continue
            is_internal = urlparse(href).netloc == urlparse(base).netloc
            if is_internal == internal:
                links.append(href)
        return list(dict.fromkeys(links))

    def _extract_json_ld(self, soup: BeautifulSoup) -> list[dict]:
        """Extract JSON-LD from page."""
        import json
        results = []
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                results.append(json.loads(script.string))
            except Exception:
                pass
        return results

    def _get_attr(self, soup: BeautifulSoup, selector: str, attr: str) -> Optional[str]:
        """Get attribute from element."""
        el = soup.select_one(selector)
        return el.get(attr) if el else None

    def _page_to_dict(self, page: RawPage) -> dict:
        """Convert page to dict."""
        return page.__dict__

    def _base_url(self, url: str) -> str:
        """Extract base URL."""
        p = urlparse(url)
        return f"{p.scheme}://{p.netloc}"


# Aliases
CrawlerEngine = PerformanceOptimizedCrawler
AdvancedCrawler = PerformanceOptimizedCrawler
HybridCrawler = PerformanceOptimizedCrawler
SimpleCrawler = PerformanceOptimizedCrawler
SeleniumCrawler = PerformanceOptimizedCrawler
FastSeleniumCrawler = PerformanceOptimizedCrawler
FastCrawler = PerformanceOptimizedCrawler
