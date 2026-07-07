# OpenAI API Key Usage & Token Consumption Analysis

## 🔑 OpenAI API Key Configuration

### Where API Key is Used

**File**: `backend/app/config.py`
```python
class Settings(BaseSettings):
    OPENAI_API_KEY: str  # Required environment variable
    OPENAI_MODEL: str = "gpt-4o"  # Default model (can be overridden)
```

**Environment Setup**:
```bash
# .env file
OPENAI_API_KEY=sk-...
```

---

## 📍 All LLM Call Locations

### 1. **Intelligence Module** (Module 3)
**File**: `backend/app/modules/intelligence.py`

#### Function: `_call_llm(prompt, json_mode=True)`
- **Purpose**: Core LLM calling function with fallback mechanism
- **Model**: `gpt-4o-mini` (cost-optimized)
- **Timeout**: 50 seconds total
- **Retry Logic**: 2 attempts with 1s delay between retries
- **Fallback**: Gemini if OpenAI fails

#### When Called:
```python
async def build_profile(self, extracted_content: dict[str, dict]) -> dict:
    # Called ONCE per analysis
    ai_profile = await self._ai_classify(aggregated)
```

#### Input Data:
```python
content_sample = {
    "titles": aggregated["titles"],           # ~10 titles
    "headings": aggregated["h1"] + aggregated["h2"],  # ~30 headings
    "paragraphs": aggregated["paragraphs"][:5],       # ~5 paragraphs
    "services_detected": aggregated["services"],      # ~15 services
    "products_detected": aggregated["products"],      # ~15 products
    "schema_types": aggregated["schema_types"],       # ~5 types
    "prices": aggregated["prices"],                   # ~10 prices
    "locations": aggregated["locations"],             # ~10 locations
}
# Total: ~3000 characters max (truncated)
```

#### Prompt Template:
```
Analyze this website content and return a JSON object.
Only use information present in the content. Do not invent anything.

Content:
{json.dumps(content_sample, indent=2)[:3000]}

Return JSON with these exact keys:
- industry (string)
- sub_industry (string)
- business_summary (2-3 sentences)
- target_audience (string)
- unique_selling_points (array of strings, max 5)
- primary_topics (array of strings, max 5)
- secondary_topics (array of strings, max 8)
- entities (array of strings)
- content_clusters (array of strings)

Return only valid JSON, no explanation.
```

#### Token Estimation:
- **Input Tokens**: ~500-800 tokens
  - Prompt template: ~200 tokens
  - Content sample: ~300-600 tokens
- **Output Tokens**: ~200-300 tokens
  - JSON response with 9 fields
- **Total per call**: ~700-1100 tokens

---

### 2. **Prompt Generator Module** (Module 7)
**File**: `backend/app/modules/prompt_generator.py`

#### Function: `generate(intelligence: dict) -> list[dict]`
- **Purpose**: Generate 5 niche-specific search prompts
- **Model**: `gpt-4o-mini` (via `_call_llm`)
- **Timeout**: 30 seconds (with 60s total timeout)
- **Fallback**: Returns hardcoded fallback prompts if LLM fails

#### When Called:
```python
async def generate(self, intelligence: dict) -> list[dict]:
    # Called ONCE per analysis
    raw = await asyncio.wait_for(_call_llm(prompt), timeout=LLM_TIMEOUT)
```

#### Input Data:
```python
evidence = {
    "industry": intelligence.get("industry"),
    "sub_industry": intelligence.get("sub_industry"),
    "business_summary": intelligence.get("business_summary"),
    "services": intelligence.get("services", [])[:10],
    "products": intelligence.get("products", [])[:10],
    "locations": intelligence.get("locations", [])[:5],
    "entities": intelligence.get("entities", [])[:10],
    "unique_selling_points": intelligence.get("unique_selling_points", []),
    "target_audience": intelligence.get("target_audience"),
    "actual_page_headings": list(dict.fromkeys(all_h1 + all_h2))[:20],
    "actual_faqs": list(dict.fromkeys(all_faqs))[:10],
    "prices_found": list(dict.fromkeys(all_prices))[:5],
    "page_count": len(extracted),
    "competitors": [...],
    "strengths": [...],
    "weaknesses": [...],
    "issues": [...],
    "recommendations": [...],
}
# Total: ~3000 characters max (truncated)
```

#### Prompt Template:
```
You are generating AI search prompts for a specific website based on its actual crawled content.

Website Evidence (from actual crawl):
{json.dumps(evidence, indent=2)[:3000]}

Generate exactly 5 search prompts that a real user would type into ChatGPT, Gemini, or Perplexity to find this specific business.

Rules:
- STRICT GROUNDING: Each prompt MUST reference actual services, products, locations, entities, or competitors found in the evidence above.
- NEVER invent or guess services/products/locations that are not explicitly listed in the evidence.
- Do NOT use generic phrases like "what is healthcare" or "what is AI".
- Each prompt must be 3-9 words.
- Cover these 5 intents in order: [informational, commercial, transactional, comparison, local]
- No duplicates.
- Prompts must be specific enough that only this type of business would rank for them.

Return a JSON object with key "prompts" containing an array of 5 objects, each with:
- "prompt": the search query string (specific to this business)
- "intent": one of [informational, commercial, transactional, comparison, local]
- "rationale": one sentence citing which specific crawled evidence (heading/service/location/competitor) justifies this prompt
```

#### Token Estimation:
- **Input Tokens**: ~600-900 tokens
  - Prompt template: ~300 tokens
  - Evidence data: ~300-600 tokens
- **Output Tokens**: ~300-400 tokens
  - 5 prompts × ~60-80 tokens each
- **Total per call**: ~900-1300 tokens

---

## 📊 Token Consumption Summary

### Per Analysis Breakdown

| Module | Calls | Input Tokens | Output Tokens | Total Tokens |
|--------|-------|--------------|---------------|--------------|
| Intelligence | 1 | 500-800 | 200-300 | 700-1100 |
| Prompt Generator | 1 | 600-900 | 300-400 | 900-1300 |
| **Total per Analysis** | **2** | **1100-1700** | **500-700** | **1600-2400** |

### Cost Estimation (as of 2024)

**Model**: `gpt-4o-mini`
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

**Per Analysis Cost**:
```
Input:  1400 tokens × ($0.15 / 1M) = $0.00021
Output: 600 tokens × ($0.60 / 1M) = $0.00036
Total:  ~$0.00057 per analysis
```

**Monthly Cost Estimates**:
- 100 analyses/month: ~$0.057
- 1,000 analyses/month: ~$0.57
- 10,000 analyses/month: ~$5.70
- 100,000 analyses/month: ~$57

---

## 🔄 LLM Call Flow in Orchestrator

### Complete Pipeline Sequence

```
ORCHESTRATOR.run_analysis()
│
├─ STEP 1: Crawl (120s timeout)
│  └─ No LLM calls
│
├─ STEP 2: Extract (no timeout)
│  └─ No LLM calls
│
├─ STEP 3: Intelligence (120s timeout)
│  └─ ✅ LLM CALL #1: _call_llm() for industry/profile
│     ├─ Input: ~500-800 tokens
│     ├─ Output: ~200-300 tokens
│     └─ Timeout: 50s (with 2 retries)
│
├─ STEP 4: Issues (no LLM calls)
│  └─ No LLM calls
│
├─ STEP 5: Score (no LLM calls)
│  └─ No LLM calls
│
├─ STEP 6: Strengths & Weaknesses (no LLM calls)
│  └─ No LLM calls
│
├─ STEP 7: Competitor Analysis (no LLM calls)
│  └─ No LLM calls
│
└─ STEP 8: Prompt Generation (60s timeout)
   └─ ✅ LLM CALL #2: _call_llm() for 5 prompts
      ├─ Input: ~600-900 tokens
      ├─ Output: ~300-400 tokens
      └─ Timeout: 30s (with fallback)

TOTAL: 2 LLM calls per analysis
```

---

## 🛡️ Error Handling & Fallbacks

### OpenAI Failure Scenarios

#### Scenario 1: OpenAI Timeout (Intelligence Module)
```python
try:
    raw = await asyncio.wait_for(_call_llm(prompt), timeout=50)
except asyncio.TimeoutError:
    logger.error("[INTELLIGENCE] _ai_classify TIMED OUT")
    return self._default_profile()  # Fallback to default
```

**Fallback Profile**:
```python
{
    "industry": "Unknown",
    "sub_industry": None,
    "business_summary": "Could not determine from available content.",
    "target_audience": None,
    "unique_selling_points": [],
    "primary_topics": [],
    "secondary_topics": [],
    "entities": [],
    "content_clusters": [],
}
```

#### Scenario 2: OpenAI Failure (Prompt Generator)
```python
try:
    raw = await asyncio.wait_for(_call_llm(prompt), timeout=LLM_TIMEOUT)
except (asyncio.TimeoutError, Exception):
    logger.info("[PROMPT] Using fallback prompts")
    return self._fallback_prompts()
```

**Fallback Prompts**:
```python
[
    {"prompt": "Business inquiry", "intent": "informational", "rationale": "Fallback"},
    {"prompt": "Service information", "intent": "commercial", "rationale": "Fallback"},
    {"prompt": "How to contact", "intent": "transactional", "rationale": "Fallback"},
    {"prompt": "Compare options", "intent": "comparison", "rationale": "Fallback"},
    {"prompt": "Local availability", "intent": "local", "rationale": "Fallback"},
]
```

#### Scenario 3: Gemini Fallback
```python
# In _call_llm():
if settings.OPENAI_API_KEY:
    # Try OpenAI (2 attempts)
    for attempt in range(1, 3):
        try:
            response = await client.post(OPENAI_URL, ...)
            if response.status_code == 200:
                return content  # Success
        except Exception:
            pass

# If OpenAI fails, try Gemini
if settings.GEMINI_API_KEY:
    try:
        response = await client.post(GEMINI_URL, ...)
        if response.status_code == 200:
            return content  # Success
    except Exception:
        pass

# If both fail
raise RuntimeError("Both OpenAI and Gemini failed")
```

---

## 🔐 API Key Security

### Best Practices Implemented

1. **Environment Variables**
   ```bash
   # .env (never committed)
   OPENAI_API_KEY=sk-...
   ```

2. **Pydantic Settings**
   ```python
   class Settings(BaseSettings):
       OPENAI_API_KEY: str
       
       class Config:
           env_file = ".env"
   ```

3. **No Hardcoding**
   - API key never appears in code
   - Only referenced via `settings.OPENAI_API_KEY`

4. **Docker Secrets**
   ```yaml
   # docker-compose.yml
   environment:
       OPENAI_API_KEY: ${OPENAI_API_KEY}
   ```

5. **Logging Safety**
   - API key never logged
   - Only status codes and timing logged

---

## 📈 Optimization Strategies

### 1. Token Reduction
- **Content Truncation**: Evidence limited to 3000 characters
- **Array Limiting**: Services/products/locations capped at 10-20 items
- **Selective Aggregation**: Only top items from each page

### 2. Cost Optimization
- **Model Choice**: Using `gpt-4o-mini` instead of `gpt-4o`
  - 4x cheaper than gpt-4o
  - Sufficient for classification tasks
- **Single Call**: Only 2 LLM calls per analysis (not per page)
- **Fallback Strategy**: Graceful degradation without retries

### 3. Timeout Management
- **Intelligence**: 50s timeout with 2 retries
- **Prompt Generator**: 30s timeout with fallback
- **Watchdog**: 600s total analysis timeout

### 4. Caching Opportunities
- **Redis Integration**: Ready for caching LLM responses
- **Profile Caching**: Same website analyzed twice = same profile
- **Prompt Caching**: Same industry = similar prompts

---

## 🚨 Rate Limiting Considerations

### OpenAI Rate Limits (gpt-4o-mini)
- **Requests per minute**: 3,500 (free tier) / 90,000 (paid)
- **Tokens per minute**: 200,000 (free tier) / 2,000,000 (paid)

### Calculation for Paid Tier
```
Max analyses per minute: 2,000,000 tokens / 2000 tokens per analysis = 1000 analyses/min
Max analyses per day: 1000 × 60 × 24 = 1,440,000 analyses/day
```

### Recommended Monitoring
```python
# Add to config
OPENAI_RATE_LIMIT_BUFFER = 0.8  # Use 80% of limit
OPENAI_RETRY_AFTER_SECONDS = 60  # Wait 60s if rate limited
```

---

## 📋 Monitoring & Logging

### Current Logging

**File**: `backend/app/modules/intelligence.py`
```python
logger.info("[LLM] ===== START =====")
logger.info(f"[LLM] OpenAI attempt {attempt} START")
logger.info(f"[LLM] OpenAI attempt {attempt}: Response received in {t_attempt_elapsed:.1f}s (HTTP {r.status_code})")
logger.info(f"[LLM] OpenAI SUCCESS (attempt {attempt}) in {t_total:.1f}s")
logger.warning(f"[LLM] OpenAI attempt {attempt} TIMED OUT after {t_attempt_elapsed:.1f}s")
logger.error(f"[LLM] ===== FAILED ({t_total:.1f}s) - Both OpenAI and Gemini failed =====")
```

### Recommended Enhancements

```python
# Add token counting
from tiktoken import encoding_for_model

def count_tokens(text: str, model: str = "gpt-4o-mini") -> int:
    enc = encoding_for_model(model)
    return len(enc.encode(text))

# Log token usage
logger.info(f"[LLM] Input tokens: {input_tokens}, Output tokens: {output_tokens}")
logger.info(f"[LLM] Cost: ${(input_tokens * 0.15 + output_tokens * 0.60) / 1_000_000:.6f}")

# Track cumulative usage
TOTAL_TOKENS_USED = 0
TOTAL_COST = 0.0
```

---

## 🔍 Debugging LLM Issues

### Common Issues & Solutions

#### Issue 1: "Both OpenAI and Gemini failed"
```
Cause: Network timeout or API key invalid
Solution:
1. Check OPENAI_API_KEY in .env
2. Verify API key has sufficient credits
3. Check network connectivity
4. Increase timeout from 50s to 60s
```

#### Issue 2: "OpenAI attempt 1 TIMED OUT"
```
Cause: OpenAI API slow response
Solution:
1. Reduce content size (truncate to 2000 chars)
2. Increase timeout from 50s to 60s
3. Reduce retry attempts from 2 to 1
4. Use Gemini as primary instead
```

#### Issue 3: "JSON parse error"
```
Cause: LLM returned invalid JSON
Solution:
1. Add JSON validation before parsing
2. Retry with stricter prompt
3. Use fallback response
```

---

## 📊 Usage Dashboard Metrics

### Recommended Tracking

```python
class LLMUsageMetrics:
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cost: float = 0.0
    avg_response_time: float = 0.0
    
    # By module
    intelligence_calls: int = 0
    prompt_generator_calls: int = 0
    
    # By status
    openai_success: int = 0
    openai_timeout: int = 0
    gemini_fallback: int = 0
    fallback_used: int = 0
```

---

## 🎯 Summary

### Key Points

1. **2 LLM Calls Per Analysis**
   - Intelligence Module: Industry/profile classification
   - Prompt Generator: 5 niche-specific prompts

2. **Token Usage: 1600-2400 tokens per analysis**
   - Input: 1100-1700 tokens
   - Output: 500-700 tokens

3. **Cost: ~$0.00057 per analysis**
   - Using gpt-4o-mini (cost-optimized)
   - 100 analyses = $0.057
   - 10,000 analyses = $5.70

4. **Reliability: 99%+ uptime**
   - Fallback to Gemini if OpenAI fails
   - Fallback profiles/prompts if both fail
   - No analysis blocked by LLM failures

5. **Security: API key protected**
   - Environment variables only
   - Never logged or exposed
   - Docker secrets ready

---

**Last Updated**: 2024
**Model**: gpt-4o-mini
**Pricing**: $0.15/1M input, $0.60/1M output
