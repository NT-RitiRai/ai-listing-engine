"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzePrompt } from "@/lib/api";

const INTENT_COLORS: Record<string, string> = {
  informational: "bg-blue-900 text-blue-300",
  commercial: "bg-purple-900 text-purple-300",
  transactional: "bg-green-900 text-green-300",
  comparison: "bg-yellow-900 text-yellow-300",
  local: "bg-pink-900 text-pink-300",
  educational: "bg-cyan-900 text-cyan-300",
};

const MODEL_COLORS: Record<string, string> = {
  openai: "text-green-400 border-green-800 bg-green-950",
  gemini: "text-blue-400 border-blue-800 bg-blue-950",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-500 text-xs uppercase tracking-widest mb-2 font-semibold">{children}</p>;
}

function PromptClusters({ clusters }: { clusters: any[] }) {
  if (!clusters?.length) return null;
  return (
    <div className="mb-4">
      <SectionTitle>Prompt Clusters</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {clusters.map((c, i) => (
          <div key={i} className="rounded-lg px-3 py-1.5 text-xs border border-gray-700 bg-gray-900 text-gray-400">
            <p className="font-semibold text-gray-300">{c.cluster}</p>
            <p className="text-xs opacity-75">{c.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentGaps({ gaps }: { gaps: any[] }) {
  if (!gaps?.length) return null;
  return (
    <div className="mb-4">
      <SectionTitle>Content Gaps for This Prompt</SectionTitle>
      <ul className="space-y-1">
        {gaps.map((gap, i) => (
          <li key={i} className="text-sm text-gray-300 flex gap-2">
            <span className="text-yellow-400">!</span>{gap}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OptimizationSuggestions({ suggestions }: { suggestions: any[] }) {
  if (!suggestions?.length) return null;
  return (
    <div className="mb-4">
      <SectionTitle>Optimization Suggestions</SectionTitle>
      <ul className="space-y-1">
        {suggestions.map((suggestion, i) => (
          <li key={i} className="text-sm text-gray-300 flex gap-2">
            <span className="text-blue-400">→</span>{suggestion}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LiveResultPanel({ provider, data }: { provider: string; data: any }) {
  if (!data) return null;
  const isError = data.status === "failed";
  const colorClass = MODEL_COLORS[provider] || "text-gray-400 border-gray-800 bg-gray-900";
  
  return (
    <div className={`rounded-xl border p-4 ${colorClass}`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-lg capitalize flex items-center gap-2">
          {provider} 
          {data.validation?.valid === false && <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded border border-red-800">Invalid</span>}
          {data.validation?.valid === true && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded border border-green-800">Valid</span>}
        </h4>
        <span className="text-xs font-mono opacity-80">{data.latency}s latency</span>
      </div>
      
      {isError ? (
        <p className="text-red-400 text-sm">Failed to connect: {data.error}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 border-b border-white/10 pb-3">
            <div>
              <p className="text-xs opacity-70">Category</p>
              <p className="font-semibold text-sm">{data.validation?.category || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Relevance</p>
              <p className="font-semibold text-sm">{data.validation?.relevance_score || 0}%</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Brand/Products</p>
              <p className="font-semibold text-sm">{data.brand_mentions} / {data.product_mentions}</p>
            </div>
          </div>

          {data.validation?.valid === false && (
            <div className="bg-red-950/50 p-3 rounded border border-red-900 text-red-300 text-sm">
              <span className="font-bold">Validation Failed: </span>{data.validation.reason}
            </div>
          )}

          {data.competitors?.length > 0 && (
            <div>
              <p className="text-xs opacity-70 mb-1">Competitors Identified</p>
              <div className="flex flex-wrap gap-2">
                {data.competitors.map((c: any, idx: number) => (
                  <span key={idx} className="bg-white/10 px-2 py-0.5 rounded text-xs font-medium">
                    {c.name} ({c.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.citations?.length > 0 && (
            <div>
              <p className="text-xs opacity-70 mb-1">Citations</p>
              <ul className="space-y-2">
                {data.citations.map((cit: any, idx: number) => (
                  <li key={idx} className="bg-white/5 p-2 rounded text-xs">
                    <a href={cit.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-medium block truncate">
                      {cit.title || cit.url}
                    </a>
                    {cit.snippet && <p className="mt-1 opacity-80 line-clamp-2 italic">"...{cit.snippet}..."</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.remediation_note?.evidence && data.remediation_note.evidence.length > 0 && (
            <div className="bg-black/20 p-3 rounded-lg border border-red-900/30 mt-4">
              <p className="text-sm font-bold text-red-400 mb-1">Absorption Gate (Remediation)</p>
              <p className="text-xs text-red-300 mb-2 opacity-90">{data.remediation_note.status}</p>
              
              <p className="text-xs font-semibold mt-2 opacity-70 uppercase tracking-wider">Crawl Evidence:</p>
              <ul className="text-xs text-gray-300 space-y-1 mb-2">
                {data.remediation_note.evidence.map((e: string, idx: number) => <li key={idx}>{e}</li>)}
              </ul>
              
              <p className="text-xs font-semibold mt-2 opacity-70 uppercase tracking-wider">Recommendations:</p>
              <ul className="text-xs text-blue-300 space-y-1">
                {data.remediation_note.recommendations.map((r: string, idx: number) => <li key={idx}>→ {r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PromptCard({ prompt, analysisId }: { prompt: any; analysisId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => analyzePrompt(prompt.id),
    onSuccess: (data) => {
      queryClient.setQueryData(["prompts", analysisId], (old: any[]) =>
        old.map((p) => (p.id === prompt.id ? { ...p, playground_results: data.results } : p))
      );
      setOpen(true);
    },
  });

  const r = prompt.playground_results;
  const liveData = r?.live;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <p className="text-white font-semibold text-base">"{prompt.prompt_text}"</p>
            <p className="text-gray-400 text-xs mt-1">{prompt.rationale}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${INTENT_COLORS[prompt.intent] ?? "bg-gray-800 text-gray-300"}`}>
            {prompt.intent}
          </span>
        </div>

        <div className="flex gap-3 items-center">
          {!liveData ? (
            <button
              onClick={() => mutate()}
              disabled={isPending}
              className="mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="animate-spin">◌</span>
                  Running Live AI Search...
                </>
              ) : (
                "Run Live Analysis →"
              )}
            </button>
          ) : (
            <>
              <button onClick={() => setOpen(!open)} className="mt-2 text-blue-400 text-xs hover:text-blue-300 transition-colors">
                {open ? "Hide Results ▲" : "Show Results ▼"}
              </button>
              <button 
                onClick={() => mutate()} 
                disabled={isPending}
                className="mt-2 text-gray-400 text-xs hover:text-gray-300 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isPending ? "Retrying..." : "↻ Retry Analysis"}
              </button>
            </>
          )}
        </div>
      </div>

      {liveData && open && (
        <div className="border-t border-gray-800 p-4 space-y-6 bg-gray-950">
          <div>
            <SectionTitle>Live API Extraction Results</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(liveData).map(([provider, data]) => (
                <LiveResultPanel key={provider} provider={provider} data={data} />
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-800">
            <PromptClusters clusters={r.prompt_clusters} />
            <ContentGaps gaps={r.content_gaps} />
            <OptimizationSuggestions suggestions={r.optimization_suggestions} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PromptsPanel({ prompts, analysisId }: { prompts: any[]; analysisId: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">
          {prompts.length} search prompts generated. Click "Run Live Analysis" to trigger real-time LLM web searches across active providers.
        </p>
      </div>
      <div className="space-y-3">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} analysisId={analysisId} />
        ))}
        {prompts.length === 0 && (
          <div className="text-center py-12 text-gray-500">No prompts generated yet.</div>
        )}
      </div>
    </div>
  );
}
