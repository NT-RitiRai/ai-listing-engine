"""
Direct pipeline test - bypasses FastAPI completely.
Run: python -u test_pipeline.py
"""
import asyncio
import sys
import os
import logging

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stdout,
    format='%(asctime)s [%(levelname)s] %(message)s',
    force=True,
)

URLS = [
    "https://www.anmolindustries.com/",
]

async def main():
    print("[TEST] Starting direct pipeline test...", flush=True)

    # Step 1: Test LLM directly
    print("\n[TEST] Step 1: Testing LLM (_call_llm)...", flush=True)
    try:
        from app.modules.intelligence import _call_llm
        result = await asyncio.wait_for(
            _call_llm('Return this JSON: {"test": "ok"}'),
            timeout=30
        )
        print(f"[TEST] LLM OK: {result[:80]}", flush=True)
    except asyncio.TimeoutError:
        print("[TEST] LLM TIMEOUT after 30s — THIS IS THE PROBLEM", flush=True)
        return
    except Exception as e:
        print(f"[TEST] LLM ERROR: {type(e).__name__}: {e}", flush=True)
        return

    # Step 2: Test DB connection + create tables
    print("\n[TEST] Step 2: Testing DB + creating tables...", flush=True)
    try:
        from app.database import AsyncSessionLocal, engine, Base
        from app.models import models  # ensure models are registered
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[TEST] DB tables created OK", flush=True)
    except Exception as e:
        print(f"[TEST] DB ERROR: {type(e).__name__}: {e}", flush=True)
        return

    # Step 3: Test full orchestrator
    print("\n[TEST] Step 3: Running full orchestrator on domains...", flush=True)
    from app.database import AsyncSessionLocal
    from app.models.models import Analysis
    from app.orchestrator import run_analysis

    for url in URLS:
        print(f"\n======================================", flush=True)
        print(f"[TEST] Testing URL: {url}", flush=True)
        print(f"======================================", flush=True)
        try:
            async with AsyncSessionLocal() as db:
                analysis = Analysis(url=url)
                db.add(analysis)
                await db.commit()
                await db.refresh(analysis)
                aid = analysis.id
                print(f"[TEST] Created analysis: {aid}", flush=True)

            print("[TEST] Running pipeline (600s timeout)...", flush=True)
            async with AsyncSessionLocal() as db:
                await asyncio.wait_for(run_analysis(aid, db), timeout=600)

            # Check final status
            async with AsyncSessionLocal() as db:
                analysis = await db.get(Analysis, aid)
                print(f"\n[TEST] FINAL STATUS for {url}: {analysis.status}", flush=True)
                if analysis.error:
                    print(f"[TEST] ERROR: {analysis.error}", flush=True)
                
                # We can also fetch the scores to verify
                await db.refresh(analysis, ['scores'])
                if analysis.scores:
                    print(f"[TEST] Overall Score: {analysis.scores.overall_score}", flush=True)
                else:
                    print(f"[TEST] No scores found.", flush=True)

        except asyncio.TimeoutError:
            print(f"[TEST] PIPELINE TIMEOUT after 600s for {url}", flush=True)
        except Exception as e:
            import traceback
            print(f"[TEST] PIPELINE ERROR for {url}: {type(e).__name__}: {e}", flush=True)
            traceback.print_exc()

asyncio.run(main())
