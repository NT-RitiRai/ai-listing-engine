# AI Listing Engine - Complete Technical Breakdown

## 📋 Project Overview
Enterprise-grade AI Search Visibility & SEO Analysis platform that analyzes websites for SEO, AEO (Answer Engine Optimization), GEO (Geographic), and AI readiness issues.

**Architecture Philosophy**: Modular, independent modules with no re-crawling or re-inference between domains.

---

## 🏗️ Tech Stack

### Backend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | FastAPI | 0.115.0 | Async web framework |
| **Server** | Uvicorn | 0.30.0 | ASGI server |
| **Database** | PostgreSQL | 16-alpine | Primary data store |
| **ORM** | SQLAlchemy | 2.0.36 | Database abstraction |
| **Async DB** | asyncpg | 0.30.0 | Async PostgreSQL driver |
| **Migrations** | Alembic | 1.14.0 | Database versioning |
| **Validation** | Pydantic | 2.10.0 | Data validation |
| **Config** | Pydantic Settings | 2.6.0 | Environment config |
| **Cache** | Redis | 7-alpine | Session/cache layer |
| **Task Queue** | Celery | 5.4.0 | Async task processing |
| **HTTP Client** | HTTPX | 0.28.0 | Async HTTP requests |
| **Bot Bypass** | curl_cffi | 0.7.3 | Chrome impersonation |
| **Browser** | Playwright | 1.49.0 | Headless browser automation |
| **Stealth** | playwright-stealth | 1.0.6 | Anti-bot detection |
| **Web Scraping** | Crawl4AI | 0.4.0 | Advanced crawling |
| **HTML Parsing** | BeautifulSoup4 | 4.12.3 | HTML/XML parsing |
| **Content Extraction** | Trafilatura | 2.0.0 | Content extraction |
| **XML Parsing** | lxml | 5.3.0 | Fast XML processing |
| **AI Integration** | OpenAI | 1.58.0 | GPT-4o API |
| **Env Management** | python-dotenv | 1.0.1 | .env file loading |
| **DB Driver** | psycopg2-binary | 2.9.10 | PostgreSQL adapter |

### Frontend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Next.js | 16.2.10 | React meta-framework |
| **React** | React | 19.2.4 | UI library |
| **Styling** | Tailwind CSS | 4.1.13 | Utility-first CSS |
| **Tailwind Plugin** | @tailwindcss/postcss | 4.3.2 | PostCSS integration |
| **State Management** | Zustand | 5.0.14 | Lightweight state |
| **Data Fetching** | @tanstack/react-query | 5.101.2 | Server state management |
| **HTTP Client** | Axios | 1.18.1 | HTTP requests |
| **Icons** | lucide-react | 1.23.0 | Icon library |
| **Export** | jsPDF | 4.2.1 | PDF generation |
| **Canvas** | html2canvas | 1.4.1 | Screenshot to canvas |
| **Image Export** | html-to-image | 1.11.13 | HTML to image |
| **Utilities** | clsx | 2.1.1 | Class name utility |
| **TypeScript** | TypeScript | 5 | Type safety |
| **Linting** | ESLint | 9 | Code quality |

### Infrastructure & DevOps
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker | Container runtime |
| **Orchestration** | Docker Compose | Multi-container management |
| **Reverse Proxy** | Nginx | Load balancing & routing |
| **Database** | PostgreSQL 16 | Persistent data |
| **Cache** | Redis 7 | In-memory caching |
| **Networking** | Docker Bridge | Container networking |

---

## 🗄️ Database Schema

### Core Tables

#### `analyses`
```sql
- id (UUID, PK)
- url (String)
- status (Enum: pending, crawling, extracting, analyzing, scoring, generating_prompts, completed, failed)
- error (Text, nullable)
- created_at (DateTime)
- updated_at (DateTime)
```

#### `crawl_data`
```sql
- id (UUID, PK)
- analysis_id (FK → analyses)
- pages (JSON) - {url: {html, metadata, links, images, schema, ...}}
- sitemap_urls (JSON array)
- robots_txt (Text, nullable)
- llms_txt (Text, nullable)
- total_pages (Integer)
```

#### `website_intelligence`
```sql
- id (UUID, PK)
- analysis_id (FK → analyses)
- industry (String)
- sub_industry (String)
- business_summary (Text)
- products (JSON array)
- services (JSON array)
- locations (JSON array)
- brands (JSON array)
- primary_topics (JSON array)
- secondary_topics (JSON array)
- entities (JSON array)
- target_audience (Text)
- unique_selling_points (JSON array)
- content_clusters (JSON array)
- extracted_content (JSON)
- website_type (String)
- website_type_confidence (Integer)
- crawl_quality_confidence (Integer)
```

#### `scores`
```sql
- id (UUID, PK)
- analysis_id (FK → analyses)
- seo_score (Float)
- aeo_score (Float)
- geo_score (Float)
- ai_readiness_score (Float)
- overall_score (Float)
- breakdown (JSON) - transparent calculation details
```

#### `issues`
```sql
- id (UUID, PK)
- analysis_id (FK → analyses)
- category (String: seo, aeo, geo, ai)
- issue_type (String)
- severity (String: critical, high, medium, low)
- affected_pages (JSON array)
- element (Text, nullable)
- recommendation (Text)
- impact (Text)
- fix_difficulty (String: easy, medium, hard)
```

#### `generated_prompts`
```sql
- id (UUID, PK)
- analysis_id (FK → analyses)
- prompt_text (Text)
- intent (String: informational, commercial, transactional, comparison, local/educational)
- rationale (Text)
- playground_results (JSON, nullable)
```

#### `strengths_weaknesses`
```sql
- id (UUID, PK)
- analysis_id (FK → analyses)
- strengths (JSON array)
- weaknesses (JSON array)
```

#### `competitors`
```sql
- id (UUID, PK)
- analysis_id (FK → analyses)
- competitors (JSON array)
```

---

## 🔄 Processing Pipeline

### Module Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYSIS PIPELINE                             │
└─────────────────────────────────────────────────────────────────┘

1. CRAWLER (Module 1)
   ├─ Input: URL
   ├─ Process:
   │  ├─ HTTPX-first fetch with curl_cffi (Chrome impersonation)
   │  ├─ Fallback to Playwright for JS-rendered pages
   │  ├─ Concurrent robots.txt, sitemap, metadata fetching
   │  ├─ Smart page prioritization (homepage, about, services, etc.)
   │  └─ Concurrent page crawling (5 concurrent requests)
   ├─ Output: CrawlData
   │  ├─ pages: {url: {html, metadata, links, images, schema, ...}}
   │  ├─ robots_txt
   │  ├─ llms_txt
   │  └─ sitemap_urls
   └─ Status: crawling

2. EXTRACTOR (Module 2)
   ├─ Input: CrawlData.pages (raw HTML)
   ├─ Process:
   │  ├─ Parse HTML with BeautifulSoup
   │  ├─ Remove noise (scripts, styles, nav, footer)
   │  ├─ Extract structured content:
   │  │  ├─ Titles, headings (H1, H2, H3)
   │  │  ├─ Paragraphs, lists, tables
   │  │  ├─ FAQs (schema + heuristic)
   │  │  ├─ Contact info (emails, phones)
   │  │  ├─ Prices, reviews
   │  │  ├─ JSON-LD schema
   │  │  ├─ OG/Twitter tags
   │  │  ├─ Canonical, robots meta
   │  │  └─ Word count, reading level
   ├─ Output: WebsiteIntelligence.extracted_content
   └─ Status: extracting

3. INTELLIGENCE (Module 3)
   ├─ Input: extracted_content
   ├─ Process:
   │  ├─ Aggregate content across all pages
   │  ├─ Call OpenAI (gpt-4o-mini) with timeout handling:
   │  │  ├─ 2 retry attempts
   │  │  ├─ 50s total timeout
   │  │  └─ Fallback to Gemini if OpenAI fails
   │  ├─ Extract:
   │  │  ├─ Industry & sub-industry
   │  │  ├─ Business summary
   │  │  ├─ Target audience
   │  │  ├─ Unique selling points
   │  │  ├─ Primary/secondary topics
   │  │  ├─ Entities (brands, people, places)
   │  │  └─ Content clusters
   │  └─ Heuristic extraction:
   │     ├─ Services/products from headings
   │     ├─ Brands from titles
   │     └─ Locations from content
   ├─ Output: WebsiteIntelligence profile
   └─ Status: analyzing

4. ISSUE DETECTOR (Module 4)
   ├─ Input: extracted_content, profile, robots_txt, llms_txt
   ├─ Process: Detect issues in 4 categories
   │
   ├─ SEO Issues:
   │  ├─ Missing/duplicate titles
   │  ├─ Missing meta descriptions
   │  ├─ Missing/multiple H1 tags
   │  ├─ Short/long titles
   │  ├─ Noindex pages
   │  ├─ Missing canonical tags
   │  ├─ Missing OG tags
   │  ├─ Images missing alt text
   │  ├─ Missing internal links
   │  └─ Low external linking
   │
   ├─ AEO Issues (Answer Engine Optimization):
   │  ├─ Missing FAQ schema
   │  ├─ Missing structured data (JSON-LD)
   │  ├─ Missing review schema
   │  ├─ Missing breadcrumb schema
   │  ├─ Missing heading hierarchy (H2/H3)
   │  └─ Weak entity coverage
   │
   ├─ AI Readiness Issues:
   │  ├─ Missing llms.txt
   │  ├─ Missing AI crawler rules (robots.txt)
   │  ├─ Thin content (<300 words)
   │  ├─ Missing schema for AI
   │  ├─ Low content depth (<500 avg words)
   │  └─ Missing USP content
   │
   └─ GEO Issues (Geographic):
      ├─ Missing LocalBusiness schema
      ├─ Missing contact information
      ├─ Missing location signals
      └─ Missing location pages
   
   ├─ Output: Issues list with:
   │  ├─ category, issue_type, severity
   │  ├─ affected_pages, element
   │  ├─ recommendation, impact, fix_difficulty
   └─ Status: scoring

5. SCORER (Module 5)
   ├─ Input: Issues list
   ├─ Process:
   │  ├─ Calculate SEO score (0-100)
   │  ├─ Calculate AEO score (0-100)
   │  ├─ Calculate GEO score (0-100)
   │  ├─ Calculate AI Readiness score (0-100)
   │  ├─ Calculate overall score (weighted average)
   │  └─ Generate transparent breakdown
   ├─ Output: Scores with breakdown
   └─ Status: scoring

6. RECOMMENDER (Module 6)
   ├─ Input: Issues list
   ├─ Process:
   │  ├─ Prioritize by severity & impact
   │  ├─ Group by category
   │  ├─ Estimate effort & ROI
   │  └─ Generate action plan
   ├─ Output: Prioritized recommendations
   └─ Status: generating_prompts

7. PROMPT GENERATOR (Module 7)
   ├─ Input: profile, extracted_content
   ├─ Process:
   │  ├─ Generate 5 niche-specific prompts
   │  ├─ Intents: informational, commercial, transactional, comparison, local
   │  ├─ Based on:
   │  │  ├─ Industry & topics
   │  │  ├─ Products/services
   │  │  ├─ Target audience
   │  │  └─ Unique selling points
   │  └─ Include rationale for each
   ├─ Output: GeneratedPrompt list
   └─ Status: generating_prompts

8. PLAYGROUND (Module 8)
   ├─ Input: GeneratedPrompt
   ├─ Process:
   │  ├─ Test prompt visibility per AI model:
   │  │  ├─ ChatGPT
   │  │  ├─ Claude
   │  │  ├─ Gemini
   │  │  └─ Perplexity
   │  ├─ Analyze:
   │  │  ├─ Ranking position
   │  │  ├─ Citation presence
   │  │  ├─ Visibility score
   │  │  └─ Recommendations
   ├─ Output: playground_results
   └─ Status: completed
```

---

## 🛡️ Prevention & Security Measures

### 1. **Bot Detection Prevention**
- **curl_cffi**: Chrome 120 impersonation to bypass Cloudflare
- **playwright-stealth**: Anti-bot detection for Playwright
- **User-Agent Rotation**: Random selection from 4 realistic user agents
- **Connection Pooling**: Persistent HTTP client to avoid rate limiting
- **Timeout Handling**: Per-page 45s timeout, global 50s timeout for LLM calls

### 2. **Blocking Detection**
```python
# Cloudflare/Bot Protection Detection
- HTTP 403/429 status codes
- "Just a moment..." title detection
- Cloudflare wrapper elements
- cf-browser-verification class detection
```

### 3. **Fallback Mechanisms**
- **HTTPX → Playwright**: If HTTPX returns insufficient content
- **OpenAI → Gemini**: If OpenAI fails or times out
- **Retry Logic**: 
  - HTTPX: 3 attempts with exponential backoff
  - OpenAI: 2 attempts with 1s delay
  - Playwright: Timeout-based fallback

### 4. **Content Validation**
- Minimum HTML size checks (>200 bytes)
- Title/H1/OG tag presence validation
- Schema type validation
- JSON parsing with error handling

### 5. **Rate Limiting & Throttling**
- Semaphore: Max 5 concurrent requests
- Per-page timeout: 45 seconds
- Global timeout: 50 seconds for LLM calls
- Exponential backoff on retries

### 6. **Error Handling**
- Graceful degradation on failures
- Detailed error logging with timestamps
- Block detection with reason/type/details
- Default profiles for failed AI calls

### 7. **Data Privacy**
- No PII storage (emails/phones extracted but not stored)
- Environment-based secrets (.env)
- CORS configuration
- Database encryption ready (PostgreSQL)

### 8. **Network Security**
- HTTPS for all external API calls
- Timeout on all network operations
- Connection error handling
- DNS resolution with fallback

---

## 📊 API Endpoints

### Analysis Management
```
POST   /api/v1/analyses
       Body: { "url": "https://example.com" }
       Response: { "id": "uuid", "status": "pending" }

GET    /api/v1/analyses/{id}
       Response: { "id", "url", "status", "error", "created_at", "updated_at" }

GET    /api/v1/analyses/{id}/scores
       Response: { "seo_score", "aeo_score", "geo_score", "ai_readiness_score", "overall_score", "breakdown" }

GET    /api/v1/analyses/{id}/issues
       Query: ?category=seo|aeo|ai|geo
       Response: [{ "category", "issue_type", "severity", "affected_pages", "recommendation", "impact", "fix_difficulty" }]

GET    /api/v1/analyses/{id}/recommendations
       Response: [{ "priority", "issue_id", "action", "effort", "roi" }]

GET    /api/v1/analyses/{id}/intelligence
       Response: { "industry", "sub_industry", "business_summary", "products", "services", "locations", "brands", "topics", "entities" }

GET    /api/v1/analyses/{id}/prompts
       Response: [{ "prompt_text", "intent", "rationale", "playground_results" }]

POST   /api/v1/prompts/{id}/analyze
       Body: { "models": ["chatgpt", "claude", "gemini", "perplexity"] }
       Response: { "playground_results": {...} }

GET    /health
       Response: { "status": "ok" }
```

---

## 🚀 Deployment

### Docker Compose Stack
```yaml
Services:
├─ postgres:16-alpine (Database)
├─ redis:7-alpine (Cache)
├─ backend (FastAPI)
├─ frontend (Next.js)
└─ nginx:alpine (Reverse Proxy)

Networks:
└─ app-network (10.0.9.0/24)

Volumes:
├─ postgres_data
├─ redis_data
├─ uploads
└─ logs
```

### Environment Variables
```
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/ai_listing
REDIS_URL=redis://:password@redis:6379/0
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
SECRET_KEY=...
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=production
LOG_LEVEL=info
```

---

## 📈 Performance Optimizations

### Crawler
- HTTPX connection pooling
- Concurrent requests (5 parallel)
- Smart page prioritization
- Sitemap parsing with recursion limit
- Per-page timeout (45s)

### Intelligence
- Aggregation before AI call
- Single LLM call per analysis
- Timeout handling (50s)
- Fallback to Gemini

### Database
- Async operations (asyncpg)
- Connection pooling
- Indexed foreign keys
- JSON columns for flexible data

### Frontend
- Next.js static generation
- React Query for caching
- Zustand for state management
- Tailwind CSS for performance

---

## 🔍 Key Design Principles

1. **No Hallucination**: Every score, issue, prompt derived from crawled data
2. **No Hardcoded Values**: Scores calculated from detected issues
3. **No Templates**: Prompts generated from website intelligence
4. **Single Responsibility**: Each module does one thing
5. **Modular Independence**: No module re-crawls or re-infers from another
6. **Transparent Scoring**: Breakdown shows calculation details
7. **Graceful Degradation**: Fallbacks for all critical operations
8. **Comprehensive Logging**: Detailed logs for debugging

---

## 📝 Logging Strategy

### Log Levels
- **DEBUG**: Detailed HTTP requests, parsing steps
- **INFO**: Module progress, step completion, statistics
- **WARNING**: Timeouts, retries, fallbacks
- **ERROR**: Failures, exceptions, blocked sites

### Log Format
```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

### Output
- File: `backend.log`
- Console: Real-time output
- Docker: JSON file driver with rotation (10MB max, 3 files)

---

## 🎯 Use Cases

1. **SEO Audit**: Identify on-page SEO issues
2. **AI Readiness**: Prepare for AI search engines
3. **Local SEO**: Optimize for geographic search
4. **Content Strategy**: Generate AI-optimized prompts
5. **Competitive Analysis**: Compare with competitors
6. **Visibility Testing**: Test prompt visibility in AI models

---

## 📦 Dependencies Summary

**Backend**: 20 packages
- Web: FastAPI, Uvicorn
- Database: SQLAlchemy, asyncpg, Alembic
- Scraping: Playwright, Crawl4AI, BeautifulSoup4, Trafilatura
- HTTP: HTTPX, curl_cffi
- AI: OpenAI
- Utilities: Pydantic, python-dotenv

**Frontend**: 12 packages
- Framework: Next.js, React
- Styling: Tailwind CSS
- State: Zustand, React Query
- Export: jsPDF, html2canvas
- Utilities: Axios, lucide-react

**Infrastructure**: Docker, Docker Compose, Nginx, PostgreSQL, Redis

---

## 🔐 Security Checklist

- ✅ Environment-based secrets
- ✅ CORS configuration
- ✅ Timeout on all network calls
- ✅ Error handling without exposing internals
- ✅ Input validation (Pydantic)
- ✅ Database connection pooling
- ✅ Async operations (no blocking)
- ✅ Rate limiting (semaphore)
- ✅ Bot detection prevention
- ✅ Graceful degradation
- ✅ Comprehensive logging
- ✅ Health checks on all services

---

## 🎓 Architecture Highlights

### Modular Design
Each module is independent and can be tested/deployed separately.

### Async-First
All I/O operations are async for maximum concurrency.

### Resilient
Multiple fallbacks and retry mechanisms for reliability.

### Observable
Comprehensive logging and health checks for monitoring.

### Scalable
Stateless backend, Redis cache, async task queue ready.

### Maintainable
Clear separation of concerns, single responsibility principle.

---

**Last Updated**: 2024
**Version**: 1.0.0
