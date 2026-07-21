# AI Listing Engine

Enterprise-grade AI Search Visibility & SEO Analysis platform.

## Architecture

```
Crawler → Extractor → Intelligence → Issues → Scores → Recommendations → Prompts → Playground
```

Each module is independent. No module re-crawls or re-infers from another module's domain.

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY and DATABASE_URL

pip install -r requirements.txt
playwright install chromium

uvicorn app.main:app --reload
```
.\venv\Scripts\Activate.ps1

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Docker (full stack)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env

docker-compose up --build
```
.\venv\Scripts\Activate.ps1

Open http://localhost:3000

## Modules

| # | Module | File | Responsibility |
|---|--------|------|----------------|
| 1 | Crawler | `backend/app/modules/crawler.py` | Fetch raw HTML, links, metadata |
| 2 | Extractor | `backend/app/modules/extractor.py` | Parse structured content from HTML |
| 3 | Intelligence | `backend/app/modules/intelligence.py` | Build website profile via OpenAI |
| 4 | Issue Detector | `backend/app/modules/issue_detector.py` | Detect SEO/AEO/GEO/AI issues |
| 5 | Scorer | `backend/app/modules/scorer.py` | Calculate transparent scores |
| 6 | Recommender | `backend/app/modules/recommender.py` | Prioritize recommendations from issues |
| 7 | Prompt Generator | `backend/app/modules/prompt_generator.py` | Generate 5 niche-specific prompts |
| 8 | Playground | `backend/app/modules/playground.py` | Analyze prompt visibility per AI model |

## API Endpoints

```
POST   /api/v1/analyses                    Start analysis
GET    /api/v1/analyses/{id}               Status polling
GET    /api/v1/analyses/{id}/scores        Score breakdown
GET    /api/v1/analyses/{id}/issues        All issues (filter by ?category=seo|aeo|ai|geo)
GET    /api/v1/analyses/{id}/recommendations
GET    /api/v1/analyses/{id}/intelligence  Website profile
GET    /api/v1/analyses/{id}/prompts       Generated prompts
POST   /api/v1/prompts/{id}/analyze        Run playground analysis
```

## Design Principles

- No hallucination: every score, issue, prompt derived from crawled data
- No hardcoded values: scores calculated from detected issues
- No templates: prompts generated from website intelligence
- Single responsibility: each module does one thing
"# ai-listing-engine" 
"# ai-listing-engine" 
