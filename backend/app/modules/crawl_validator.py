"""
Strict Multi-Stage Crawl Validation
Only blocks on actual protection pages, not on CAPTCHA presence.
"""
import re
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    is_valid: bool
    reason: Optional[str] = None
    block_type: Optional[str] = None
    details: Optional[str] = None
    debug_info: Optional[dict] = None


class CrawlValidator:
    """Strict validation: only blocks on actual protection pages."""

    # HTTP status codes that indicate blocking
    BLOCKING_STATUS_CODES = {
        401: ("Unauthorized", "Website requires authentication"),
        403: ("Forbidden", "Access denied to this website"),
        429: ("Rate Limited", "Too many requests - crawler blocked"),
        503: ("Service Unavailable", "Website is down or blocking crawlers"),
        520: ("Cloudflare Error", "Cloudflare is blocking the request"),
        521: ("Cloudflare Error", "Cloudflare origin is unreachable"),
        522: ("Cloudflare Error", "Cloudflare connection timeout"),
        523: ("Cloudflare Error", "Cloudflare origin unreachable"),
        524: ("Cloudflare Error", "Cloudflare timeout"),
    }

    # STRICT: Only detect actual Cloudflare challenge pages
    CLOUDFLARE_CHALLENGE_PATTERNS = [
        r"just a moment",
        r"checking your browser",
        r"cf_chl_",
        r"cf-browser-verification",
        r"turnstile",
    ]

    # STRICT: Only detect actual CAPTCHA CHALLENGE pages (not forms with CAPTCHA)
    CAPTCHA_CHALLENGE_PATTERNS = [
        r"i'm not a robot",
        r"i am not a robot",
        r"please verify you are human",
        r"verify you are human",
        r"hcaptcha challenge",
        r"press and hold",
        r"px-captcha",
        r"datadome challenge",
    ]

    # AWS WAF block patterns
    AWS_WAF_PATTERNS = [
        r"aws waf",
        r"request has been blocked",
    ]

    # Akamai block patterns
    AKAMAI_PATTERNS = [
        r"akamai access denied",
        r"access denied",
    ]

    def validate(self, status_code: int, html: str, url: str) -> ValidationResult:
        """
        STRICT validation: Only blocks on actual protection pages.
        """
        debug_info = {
            "http_status": status_code,
            "html_size": len(html) if html else 0,
            "url": url,
            "checks": {}
        }

        logger.info(f"\n[VALIDATION] Starting validation for {url}")
        logger.info(f"[VALIDATION] HTTP Status: {status_code}")
        logger.info(f"[VALIDATION] HTML Size: {len(html) if html else 0} bytes")

        # Check HTTP status codes
        if status_code in self.BLOCKING_STATUS_CODES:
            block_type, reason = self.BLOCKING_STATUS_CODES[status_code]
            debug_info["checks"]["http_status"] = f"BLOCKED: {block_type}"
            logger.warning(f"[VALIDATION] ✗ BLOCKED: HTTP {status_code} ({block_type})")
            return ValidationResult(
                is_valid=False,
                reason=reason,
                block_type=block_type,
                details=f"HTTP {status_code}: {block_type}",
                debug_info=debug_info,
            )

        # Check for empty content
        if not html or len(html.strip()) < 100:
            debug_info["checks"]["empty_content"] = "BLOCKED"
            logger.warning(f"[VALIDATION] ✗ BLOCKED: Empty HTML response")
            return ValidationResult(
                is_valid=False,
                reason="Page returned minimal or empty content",
                block_type="Empty Response",
                details="The page returned less than 100 characters of content",
                debug_info=debug_info,
            )

        html_lower = html.lower()
        page_title = self._extract_title(html_lower)
        body_text = self._extract_body_text(html_lower)

        logger.info(f"[VALIDATION] Page Title: {page_title}")
        logger.info(f"[VALIDATION] Body Text Length: {len(body_text)} chars")

        # STRICT: Check for actual Cloudflare challenge
        cf_challenge = self._detect_cloudflare_challenge(html_lower, page_title, body_text)
        if cf_challenge:
            debug_info["checks"]["cloudflare_challenge"] = "BLOCKED"
            logger.warning(f"[VALIDATION] ✗ BLOCKED: Cloudflare challenge detected")
            logger.warning(f"[VALIDATION] Matched patterns: {cf_challenge}")
            return ValidationResult(
                is_valid=False,
                reason="Cloudflare browser challenge detected",
                block_type="Cloudflare Challenge",
                details="Website is showing Cloudflare browser verification challenge.",
                debug_info=debug_info,
            )

        # STRICT: Check for actual CAPTCHA CHALLENGE (not just presence)
        captcha_type = self._detect_captcha_challenge(html_lower, page_title, body_text)
        if captcha_type:
            debug_info["checks"]["captcha_challenge"] = f"BLOCKED: {captcha_type}"
            logger.warning(f"[VALIDATION] ✗ BLOCKED: {captcha_type} challenge detected")
            logger.warning(f"[VALIDATION] Matched patterns: {captcha_type}")
            return ValidationResult(
                is_valid=False,
                reason=f"{captcha_type} challenge detected",
                block_type="CAPTCHA Challenge",
                details=f"Website is showing {captcha_type} challenge.",
                debug_info=debug_info,
            )

        # Check for CAPTCHA presence (but don't block)
        captcha_presence = self._detect_captcha_presence(html_lower)
        if captcha_presence:
            debug_info["checks"]["captcha_presence"] = f"ALLOWED: {captcha_presence} present on forms"
            logger.info(f"[VALIDATION] ℹ {captcha_presence} detected on forms (not blocking)")

        # STRICT: Check for AWS WAF
        if self._check_patterns(html_lower, self.AWS_WAF_PATTERNS):
            debug_info["checks"]["aws_waf"] = "BLOCKED"
            logger.warning(f"[VALIDATION] ✗ BLOCKED: AWS WAF detected")
            return ValidationResult(
                is_valid=False,
                reason="AWS WAF is blocking access",
                block_type="AWS WAF",
                details="Website is protected by AWS WAF.",
                debug_info=debug_info,
            )

        # STRICT: Check for Akamai
        if self._check_patterns(html_lower, self.AKAMAI_PATTERNS):
            debug_info["checks"]["akamai"] = "BLOCKED"
            logger.warning(f"[VALIDATION] ✗ BLOCKED: Akamai access denied")
            return ValidationResult(
                is_valid=False,
                reason="Akamai is blocking access",
                block_type="Akamai WAF",
                details="Website is protected by Akamai.",
                debug_info=debug_info,
            )

        # Page is valid
        debug_info["checks"]["final_result"] = "ALLOWED"
        logger.info(f"[VALIDATION] ✓ ALLOWED: Page passed all checks")
        return ValidationResult(is_valid=True, debug_info=debug_info)

    def _detect_cloudflare_challenge(self, html_lower: str, page_title: str, body_text: str) -> Optional[str]:
        """Detect actual Cloudflare challenge page."""
        matched = []
        
        for pattern in self.CLOUDFLARE_CHALLENGE_PATTERNS:
            if re.search(pattern, html_lower):
                matched.append(pattern)
        
        if matched:
            logger.debug(f"[VALIDATION] Cloudflare patterns matched: {matched}")
            return ", ".join(matched)
        
        return None

    def _detect_captcha_challenge(self, html_lower: str, page_title: str, body_text: str) -> Optional[str]:
        """
        Detect actual CAPTCHA CHALLENGE page.
        Only block if the entire page is a verification challenge.
        """
        matched = []
        
        # Check page title for challenge indicators
        if page_title:
            for pattern in self.CAPTCHA_CHALLENGE_PATTERNS:
                if re.search(pattern, page_title):
                    matched.append(f"title:{pattern}")
        
        # Check body text for challenge indicators
        if body_text:
            for pattern in self.CAPTCHA_CHALLENGE_PATTERNS:
                if re.search(pattern, body_text):
                    matched.append(f"body:{pattern}")
        
        if matched:
            logger.debug(f"[VALIDATION] CAPTCHA challenge patterns matched: {matched}")
            return ", ".join(matched)
        
        return None

    def _detect_captcha_presence(self, html_lower: str) -> Optional[str]:
        """
        Detect CAPTCHA presence (but don't block).
        These are just indicators that CAPTCHA is used on forms.
        """
        if "g-recaptcha" in html_lower:
            return "reCAPTCHA"
        if "recaptcha" in html_lower and "script" in html_lower:
            return "reCAPTCHA"
        if "hcaptcha" in html_lower:
            return "hCaptcha"
        if "captcha.js" in html_lower:
            return "Generic CAPTCHA"
        
        return None

    def _extract_title(self, html_lower: str) -> str:
        """Extract page title."""
        match = re.search(r"<title[^>]*>([^<]+)</title>", html_lower)
        return match.group(1).strip() if match else ""

    def _extract_body_text(self, html_lower: str) -> str:
        """Extract visible body text."""
        # Remove script and style tags
        text = re.sub(r"<script[^>]*>.*?</script>", "", html_lower, flags=re.DOTALL)
        text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL)
        # Remove HTML tags
        text = re.sub(r"<[^>]+>", "", text)
        # Get first 1000 chars of visible text
        return text[:1000]

    def _check_patterns(self, text: str, patterns: list[str]) -> bool:
        """Check if any pattern matches in the text."""
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
