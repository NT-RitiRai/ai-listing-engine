import re
from urllib.parse import urlparse

class CitationExtractor:
    def extract_citations(self, text: str, raw_annotations: list[dict] = None) -> list[dict]:
        """
        Extract citations from the provider's text response or raw annotations.
        """
        citations = []
        
        if raw_annotations:
            for idx, ann in enumerate(raw_annotations):
                if isinstance(ann, dict) and ann.get("type") == "url_citation":
                    cit_data = ann.get("url_citation", {})
                    url = cit_data.get("url", "")
                    title = cit_data.get("title", "")
                    if url:
                        parsed_url = urlparse(url)
                        domain = parsed_url.netloc.lower()
                        if domain.startswith("www."):
                            domain = domain[4:]
                            
                        citations.append({
                            "citation_title": title,
                            "citation_url": url,
                            "domain": domain,
                            "root_domain": domain, # simplification
                            "position": idx + 1,
                            "anchor_text": title,
                            "response_snippet": "",
                            "confidence": 1.0,
                            "citation_order": idx + 1
                        })
            return citations
            
        # Fallback to Regex extraction
        pattern = r'\[([^\]]+)\]\((https?://[^\)]+)\)'
        
        # Find all matches with their index in the text to extract snippets
        for idx, match in enumerate(re.finditer(pattern, text)):
            anchor_text = match.group(1)
            url = match.group(2)
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.lower()
            if domain.startswith("www."):
                domain = domain[4:]
            
            root_domain = domain # In a real implementation, use tldextract
            
            # Extract snippet (up to 100 chars before and after)
            start_idx = max(0, match.start() - 100)
            end_idx = min(len(text), match.end() + 100)
            snippet = text[start_idx:end_idx].strip()
            
            citations.append({
                "citation_title": anchor_text,
                "citation_url": url,
                "domain": domain,
                "root_domain": root_domain,
                "position": idx + 1,
                "anchor_text": anchor_text,
                "response_snippet": snippet,
                "confidence": 0.9,
                "citation_order": idx + 1
            })
            
        return citations
