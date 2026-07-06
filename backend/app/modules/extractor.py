"""
Module 2: Content Extraction Engine
Input: CrawlData.pages (raw HTML per page)
Output: Structured content per page stored in WebsiteIntelligence.extracted_content
"""
import re
from bs4 import BeautifulSoup


class ContentExtractionEngine:
    def extract_all(self, pages: dict[str, dict]) -> dict[str, dict]:
        """Extract structured content from all crawled pages."""
        return {url: self._extract_page(page) for url, page in pages.items()}

    def _extract_page(self, page: dict) -> dict:
        html = page.get("html", "")
        if not html:
            return {}
        soup = BeautifulSoup(html, "lxml")
        self._remove_noise(soup)

        og = page.get("og_tags", {})
        title = page.get("metadata", {}).get("title") or og.get("title") or og.get("site_name")
        h1 = page.get("metadata", {}).get("h1", [])
        h2 = page.get("metadata", {}).get("h2", [])
        h3 = page.get("metadata", {}).get("h3", [])
        # For JS-rendered pages with no headings, synthesize from OG/title
        if not h1 and title:
            h1 = [title]
        return {
            "title": title,
            "meta_description": page.get("metadata", {}).get("meta_description") or og.get("description"),
            "h1": h1,
            "h2": h2,
            "h3": h3,
            "paragraphs": self._get_paragraphs(soup),
            "lists": self._get_lists(soup),
            "tables": self._get_tables(soup),
            "faqs": self._get_faqs(soup),
            "word_count": self._word_count(soup),
            "reading_level": self._reading_level(soup),
            "emails": self._find_emails(soup),
            "phones": self._find_phones(soup),
            "prices": self._find_prices(soup),
            "reviews": self._get_reviews(soup),
            "schema_types": [s.get("@type") for s in page.get("json_ld", []) if isinstance(s, dict)],
            "internal_links": page.get("internal_links", []),
            "external_links": page.get("external_links", []),
            "images": page.get("images", []),
            "og_tags": page.get("og_tags", {}),
            "twitter_tags": page.get("twitter_tags", {}),
            "canonical": page.get("canonical"),
            "robots_meta": page.get("robots_meta"),
            "json_ld": page.get("json_ld", []),
            "lang": page.get("metadata", {}).get("lang"),
        }

    def _remove_noise(self, soup: BeautifulSoup):
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            tag.decompose()

    def _get_paragraphs(self, soup: BeautifulSoup) -> list[str]:
        return [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 40]

    def _get_lists(self, soup: BeautifulSoup) -> list[list[str]]:
        result = []
        for ul in soup.find_all(["ul", "ol"]):
            items = [li.get_text(strip=True) for li in ul.find_all("li") if li.get_text(strip=True)]
            if items:
                result.append(items)
        return result

    def _get_tables(self, soup: BeautifulSoup) -> list[list[list[str]]]:
        tables = []
        for table in soup.find_all("table"):
            rows = [[td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
                    for tr in table.find_all("tr")]
            if rows:
                tables.append(rows)
        return tables

    def _get_faqs(self, soup: BeautifulSoup) -> list[dict]:
        faqs = []
        # FAQ schema
        for el in soup.find_all(attrs={"itemtype": re.compile("FAQPage", re.I)}):
            q = el.find(attrs={"itemprop": "name"})
            a = el.find(attrs={"itemprop": "text"})
            if q and a:
                faqs.append({"question": q.get_text(strip=True), "answer": a.get_text(strip=True)})
        # Heuristic: heading followed by paragraph
        if not faqs:
            for heading in soup.find_all(["h2", "h3"]):
                text = heading.get_text(strip=True)
                if "?" in text:
                    answer_el = heading.find_next_sibling("p")
                    if answer_el:
                        faqs.append({"question": text, "answer": answer_el.get_text(strip=True)})
        return faqs[:20]

    def _word_count(self, soup: BeautifulSoup) -> int:
        return len(soup.get_text().split())

    def _reading_level(self, soup: BeautifulSoup) -> str:
        words = soup.get_text().split()
        avg_word_len = sum(len(w) for w in words) / max(len(words), 1)
        if avg_word_len < 4.5:
            return "basic"
        elif avg_word_len < 5.5:
            return "intermediate"
        return "advanced"

    def _find_emails(self, soup: BeautifulSoup) -> list[str]:
        text = soup.get_text()
        return list(set(re.findall(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)))

    def _find_phones(self, soup: BeautifulSoup) -> list[str]:
        text = soup.get_text()
        return list(set(re.findall(r"[\+]?[\d\s\-\(\)]{10,15}", text)))[:10]

    def _find_prices(self, soup: BeautifulSoup) -> list[str]:
        text = soup.get_text()
        return list(set(re.findall(r"(?:₹|Rs\.?|USD|\$|€|£)\s?[\d,]+(?:\.\d{2})?", text)))[:20]

    def _get_reviews(self, soup: BeautifulSoup) -> list[str]:
        reviews = []
        for el in soup.find_all(attrs={"itemprop": "reviewBody"}):
            reviews.append(el.get_text(strip=True))
        return reviews[:10]
