import re

file_path = r"c:\Users\ASUS\Downloads\ai-listing-engine\backend\app\modules\issue_detector.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    # SEO
    (r'"Duplicate titles confuse search engines and reduce CTR\."', 
     r'"AI assistants cannot distinguish between your offerings, causing them to skip your business in comparison queries."'),
    (r'"Ensure each page has a unique title tag\."',
     r'"Clearly differentiate page identities so AI models can accurately route commercial queries to the right service."'),

    (r'"Missing titles severely hurt rankings\."',
     r'"AI models lack primary context for this page, leading to a complete loss of visibility for associated products/services."'),
    (r'"Add a descriptive title tag to every page\."',
     r'"Define the exact business value and target entity in the page identity to restore AI indexing confidence."'),

    (r'"Missing meta descriptions reduce CTR in search results\."',
     r'"AI assistants could not confidently understand this page because descriptive metadata is missing. This reduces recommendation confidence for commercial searches."'),
    (r'"Add a unique meta description to every page\."',
     r'"Provide clear, concise summaries of business value on every page to ensure AI models can accurately describe you to buyers."'),

    (r'"H1 is a primary ranking signal\."',
     r'"Without a primary structural heading, AI models fail to parse the core topic, discarding the page from high-intent answers."'),
    (r'"Add a single H1 tag to every page\."',
     r'"Establish a clear topical hierarchy starting with a strong primary entity declaration."'),

    (r'"Multiple H1s dilute heading hierarchy\."',
     r'"Conflicting structural signals confuse AI models about the primary subject, reducing your authority score for target entities."'),
    (r'"Use only one H1 per page\."',
     r'"Consolidate the primary page topic into a single, authoritative declaration."'),

    (r'"Short titles miss keyword opportunities\."',
     r'"Insufficient context prevents AI from associating this page with long-tail, high-conversion commercial queries."'),
    (r'"Expand title tags to 30-65 characters\."',
     r'"Expand page context to capture specific buyer intents and niche recommendations."'),

    (r'"Long titles get truncated in SERPs\."',
     r'"Overly verbose identities dilute the core entity focus, causing AI models to miscategorize the offering."'),
    (r'"Shorten title tags to under 65 characters\."',
     r'"Refine the page identity to focus strictly on the primary business entity and intent."'),

    (r'"Noindex prevents pages from appearing in search\."',
     r'"Explicit directives are blocking AI agents from reading this page, resulting in zero visibility for this content."'),
    (r'"Review noindex directives\. Remove unless intentional\."',
     r'"Audit AI blocking rules and open commercial pages to AI indexers to recover lost visibility."'),

    (r'"Missing canonicals can cause duplicate content issues\."',
     r'"AI models penalize businesses with ambiguous content structures, reducing trust and citation frequency."'),
    (r'"Add canonical tags to all pages\."',
     r'"Establish clear canonical paths to consolidate AI trust signals to your primary pages."'),

    (r'"Missing OG tags reduce social media visibility\."',
     r'"Lack of structured graph data reduces your brand\'s footprint across ecosystem integrations used by AI."'),
    (r'"Add OpenGraph tags for better social sharing\."',
     r'"Implement OpenGraph data to ensure AI systems parse rich media and brand context correctly."'),

    (r'"Missing alt text hurts accessibility and image SEO\."',
     r'"AI models are blind to visual assets without descriptive text, losing valuable context for product and brand association."'),
    (r'"Add descriptive alt text to all images\."',
     r'"Translate all visual business assets into text descriptions to maximize AI comprehension."'),

    (r'"Internal linking distributes page authority and improves crawlability\."',
     r'"Isolated pages prevent AI models from understanding the relationship between your services, reducing overall domain authority."'),
    (r'"Add internal links to connect related pages\."',
     r'"Build a strong semantic web between your offerings to help AI understand your complete business ecosystem."'),

    (r'"External links build topical authority and trust\."',
     r'"Lack of outbound citations isolates your business from the broader industry knowledge graph, lowering trust scores."'),
    (r'"Add external links to authoritative sources\."',
     r'"Connect your content to authoritative industry entities to validate your expertise to AI models."'),

    # AEO
    (r'"FAQ schema increases chances of featured snippets\."',
     r'"Without structured Q&A data, AI assistants struggle to extract direct answers, costing you voice and conversational search visibility."'),
    (r'"Add FAQ schema markup to answer common questions\."',
     r'"Deploy conversational schema to feed direct answers into AI memory, positioning your business as the default solution."'),

    (r'"Structured data is essential for AI and voice search\."',
     r'"AI models cannot reliably identify your business entities, making it less likely that your website will be cited in AI-generated answers."'),
    (r'"Add structured data \(JSON-LD\) to all pages\."',
     r'"Implement enterprise-grade structured data to explicitly define your products, services, and corporate entities for AI."'),

    (r'"Review schema improves trust signals in SERPs\."',
     r'"Missing reputation data prevents AI from verifying your credibility, causing it to recommend trusted competitors instead."'),
    (r'"Add Review/AggregateRating schema where applicable\."',
     r'"Inject verifiable trust signals directly into the code to increase AI recommendation confidence."'),

    (r'"Breadcrumbs improve navigation signals\."',
     r'"Poor structural context makes it difficult for AI to map your service hierarchy, losing visibility for category-level queries."'),
    (r'"Add BreadcrumbList schema to all pages\."',
     r'"Map your business architecture explicitly so AI can correctly categorize your offerings."'),

    (r'"Proper heading hierarchy helps AI models understand content structure\."',
     r'"Flat content structures force AI to guess your service details, significantly reducing extraction accuracy for complex queries."'),
    (r'"Add H2 and H3 tags to structure content hierarchically\."',
     r'"Organize business information with strict hierarchical logic to ensure flawless AI parsing."'),

    (r'"Weak entity coverage reduces AI citation probability\."',
     r'"Your content lacks recognizable industry entities, making AI perceive your business as an outlier rather than a market leader."'),
    (r'"Add clear entity mentions \(brand, people, locations\) throughout content\."',
     r'"Aggressively integrate recognized industry entities, brands, and terminology to anchor your business in the AI knowledge graph."'),

    # AI
    (r'"llms\.txt helps AI models understand and cite your website\."',
     r'"Without an AI-specific entry point, modern LLMs default to generic crawling, often missing your most critical commercial data."'),
    (r'"Create a /llms\.txt file to guide AI crawlers about your content\."',
     r'"Deploy an llms.txt file to spoon-feed high-priority business context and citations directly to AI models."'),

    (r'"Without explicit rules, AI crawlers may not index your content optimally\."',
     r'"Failing to explicitly welcome AI agents signals poor AI-readiness, potentially deprioritizing your brand in model training."'),
    (r'"Add explicit rules for AI crawlers \(GPTBot, anthropic-ai, Google-Extended\)\."',
     r'"Update access protocols to explicitly authorize and guide next-generation AI agents to your commercial content."'),

    (r'"AI models prefer citing comprehensive, well-structured content\."',
     r'"Superficial content is instantly discarded by AI models seeking deep, authoritative answers for users."'),
    (r'"Expand thin pages with comprehensive, authoritative content\."',
     r'"Transform thin service pages into comprehensive, authoritative guides that dominate AI reference selection."'),

    (r'"Schema markup is critical for AI model comprehension\."',
     r'"Without machine-readable context, AI models treat your business as raw text, ignoring key commercial attributes."'),
    (r'"Add structured data to help AI models understand your content\."',
     r'"Wrap all core business assets in strict JSON-LD to guarantee 100% accurate AI extraction."'),

    (r'"AI models need substantial content to generate accurate citations\."',
     r'"Insufficient topical depth prevents AI from associating your business with complex, high-value buyer queries."'),
    (r'"Increase average page word count to 800\+ words\."',
     r'"Deepen the semantic richness of your content to capture high-intent, long-form AI queries."'),

    (r'"AI models need clear differentiators to recommend your business\."',
     r'"Because your unique value is not explicitly stated, AI defaults to recommending generic competitors over you."'),
    (r'"Clearly state your unique value propositions on key pages\."',
     r'"Hardcode your unique selling propositions into the text so AI models can explicitly argue why you are the best choice."'),

    # GEO
    (r'"LocalBusiness schema is critical for local AI search visibility\."',
     r'"Without strict geographic bounding, AI models exclude your business from high-converting \'near me\' and local service recommendations."'),
    (r'"Add LocalBusiness schema with address, phone, and hours\."',
     r'"Anchor your physical operations in the AI graph using strict local entity markup to dominate regional search."'),

    (r'"Contact information is essential for local search visibility\."',
     r'"Missing contact data prevents AI from fulfilling transactional intents, causing it to route ready-to-buy customers elsewhere."'),
    (r'"Add phone numbers and email addresses to contact pages\."',
     r'"Ensure frictionless conversion paths by exposing direct contact entities to AI decision engines."'),

    (r'"Missing location signals reduce local search visibility\."',
     r'"Geographic ambiguity causes AI models to pass over your business for localized commercial queries, directly losing regional revenue."'),
    (r'"Add location-specific content and NAP \(Name, Address, Phone\) information\."',
     r'"Saturate your digital footprint with consistent geographic entities to secure local market dominance in AI answers."'),

    (r'"Location pages are critical for local search visibility\."',
     r'"Failing to dedicate pages to specific markets blinds AI to your operational footprint, handing those territories to competitors."'),
    (r'"Create dedicated pages for each business location\."',
     r'"Deploy highly-targeted regional pages to capture hyper-local AI commercial queries across your entire service area."')
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewrote issue_detector.py with executive business language.")
