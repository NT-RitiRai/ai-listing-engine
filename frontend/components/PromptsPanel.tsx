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
  ChatGPT: "text-green-400",
  Gemini: "text-blue-400",
  Claude: "text-orange-400",
  Perplexity: "text-purple-400",
};

const MODEL_BAR_COLORS: Record<string, string> = {
  ChatGPT: "bg-green-500",
  Gemini: "bg-blue-500",
  Claude: "bg-orange-500",
  Perplexity: "bg-purple-500",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">{children}</p>;
}

function ProbabilityBar({ model, value }: { model: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className={MODEL_COLORS[model] ?? "text-gray-400"}>{model}</span>
        <span className="text-white font-mono font-bold">{value}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${MODEL_BAR_COLORS[model] ?? "bg-gray-500"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function VisibilityGauge({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#1f2937" strokeWidth="6" />
        <circle cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div className="text-center -mt-1">
        <p className="text-xl font-bold text-white">{score}</p>
        <p className="text-gray-400 text-xs">Visibility</p>
      </div>
    </div>
  );
}

function EvidencePanel({ items }: { items: any[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <SectionTitle>Evidence</SectionTitle>
      <div className="space-y-2">
        {items.map((ev, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-2.5 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-blue-400 truncate max-w-xs font-mono text-xs">{ev.page_url.split("/").slice(-1)[0] || "/"}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                ev.confidence === "high" ? "bg-green-900 text-green-300" :
                ev.confidence === "medium" ? "bg-yellow-900 text-yellow-300" :
                "bg-gray-700 text-gray-400"
              }`}>
                {ev.similarity_score}%
              </span>
            </div>
            {ev.matched_headings?.length > 0 && (
              <p className="text-gray-300">{ev.matched_headings[0]}</p>
            )}
            {ev.matched_faqs?.length > 0 && (
              <p className="text-gray-400 italic text-xs">FAQ: {ev.matched_faqs[0]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelAnalysis({ modelAnalysis }: { modelAnalysis: Record<string, any> }) {
  if (!modelAnalysis || !Object.keys(modelAnalysis).length) return null;
  return (
    <div>
      <SectionTitle>Platform Analysis</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {Object.entries(modelAnalysis).map(([model, data]: [string, any]) => (
          <div key={model} className="bg-gray-800 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className={`font-semibold text-sm ${MODEL_COLORS[model] ?? "text-white"}`}>{model}</span>
              <span className="text-white font-mono text-sm font-bold">{data.probability}%</span>
            </div>
            <p className="text-gray-300 text-xs">{data.analysis}</p>
            {data.strength && (
              <p className="text-green-400 text-xs flex gap-1"><span>✓</span>{data.strength}</p>
            )}
            {data.weakness && (
              <p className="text-red-400 text-xs flex gap-1"><span>✗</span>{data.weakness}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandOverview({ brandOverview }: { brandOverview: Record<string, any> }) {
  if (!brandOverview || !Object.keys(brandOverview).length) return null;
  const levelColor = (l: string) =>
    l === "high" ? "text-green-400" : l === "medium" ? "text-yellow-400" : "text-red-400";
  return (
    <div>
      <SectionTitle>Brand Recognition Per Platform</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Object.entries(brandOverview).map(([model, data]: [string, any]) => (
          <div key={model} className="bg-gray-800 rounded-lg p-2.5 space-y-1">
            <span className={`font-semibold text-xs ${MODEL_COLORS[model] ?? "text-white"}`}>{model}</span>
            <div className="text-xs space-y-0.5">
              <p>Recognition: <span className={levelColor(data.recognition)}>{data.recognition}</span></p>
              <p>Confidence: <span className="text-white">{data.confidence}%</span></p>
            </div>
            <p className="text-gray-500 text-xs italic">{data.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptClusters({ clusters }: { clusters: any[] }) {
  if (!clusters?.length) return null;
  return (
    <div>
      <SectionTitle>Prompt Clusters</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {clusters.map((c, i) => (
          <div key={i} className={`rounded-lg px-3 py-1.5 text-xs border ${
            c.confidence >= 80 ? "border-green-800 bg-green-950 text-green-300" :
            c.confidence >= 60 ? "border-yellow-800 bg-yellow-950 text-yellow-300" :
            "border-gray-700 bg-gray-900 text-gray-400"
          }`}>
            <p className="font-semibold">{c.cluster}</p>
            <p className="text-xs opacity-75">{c.confidence}% · {c.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


function CitationReadiness({ readiness, potential, sources }: { readiness: any; potential: any; sources: any[] }) {
  if (!readiness) return null;
  
  return (
    <div className="space-y-3">
      {/* Citation Score */}
      <div>
        <SectionTitle>Citation Readiness</SectionTitle>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 text-sm">Overall Citation Score</span>
            <span className="text-2xl font-bold text-blue-400">{readiness.overall_score}%</span>
          </div>
          
          {readiness.evidence_used?.length > 0 && (
            <div className="mb-3">
              <p className="text-gray-500 text-xs mb-1">Evidence Used</p>
              <div className="flex flex-wrap gap-1">
                {readiness.evidence_used.map((ev: string, i: number) => (
                  <span key={i} className="bg-green-900 text-green-300 text-xs px-2 py-0.5 rounded">
                    ✓ {ev}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {readiness.missing_signals?.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-1">Missing Citation Signals</p>
              <div className="flex flex-wrap gap-1">
                {readiness.missing_signals.map((sig: string, i: number) => (
                  <span key={i} className="bg-red-900 text-red-300 text-xs px-2 py-0.5 rounded">
                    ✗ {sig}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Citation Sources */}
      {sources?.length > 0 && (
        <div>
          <SectionTitle>Primary Citation Sources</SectionTitle>
          <div className="space-y-2">
            {sources.map((src, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-2.5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-blue-400 font-mono">{src.page_url.split("/").slice(-1)[0] || "/"}</span>
                  <span className="text-white font-bold">{src.confidence}%</span>
                </div>
                <p className="text-gray-400">{src.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Citation Potential Per Platform */}
      {potential && (
        <div>
          <SectionTitle>LLM Citation Potential</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(potential).map(([model, data]: [string, any]) => (
              <div key={model} className="bg-gray-800 rounded-lg p-2.5 text-xs">
                <p className={`font-semibold ${MODEL_COLORS[model] ?? "text-white"}`}>{model}</p>
                <p className={`text-sm font-bold mt-1 ${
                  data.likelihood === "very high" ? "text-green-400" :
                  data.likelihood === "high" ? "text-green-300" :
                  data.likelihood === "medium" ? "text-yellow-400" :
                  "text-red-400"
                }`}>{data.likelihood}</p>
                <p className="text-gray-500 text-xs mt-1">{data.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentGaps({ gaps }: { gaps: any[] }) {
  if (!gaps?.length) return null;
  return (
    <div>
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
    <div>
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

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
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

        {!r ? (
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            {isPending ? "Analyzing..." : "Analyze →"}
          </button>
        ) : (
          <button onClick={() => setOpen(!open)} className="mt-2 text-blue-400 text-xs hover:text-blue-300 transition-colors">
            {open ? "Hide ▲" : "Show ▼"}
          </button>
        )}
      </div>

      {r && open && (
        <div className="border-t border-gray-800 p-4 space-y-4">

          {/* Visibility + Platform Probabilities */}
          <div className="flex gap-4 items-start">
            <VisibilityGauge score={r.visibility_score ?? 0} />
            <div className="flex-1 space-y-2">
              <SectionTitle>Recommendation Probability</SectionTitle>
              {Object.entries(r.model_probabilities ?? {}).map(([model, val]) => (
                <ProbabilityBar key={model} model={model} value={val as number} />
              ))}
            </div>
          </div>

          {/* Prompt Clusters */}
          <PromptClusters clusters={r.prompt_clusters} />

          {/* Platform Analysis */}
          <ModelAnalysis modelAnalysis={r.model_analysis} />

          {/* Brand Overview */}
          <BrandOverview brandOverview={r.brand_overview} />

          {/* Evidence Panel */}
          <EvidencePanel items={r.evidence_panel} />

          {/* Citation Readiness */}
          <CitationReadiness 
            readiness={r.citation_readiness}
            potential={r.citation_potential}
            sources={r.citation_sources}
          />

          {/* Content Gaps */}
          <ContentGaps gaps={r.content_gaps} />

          {/* Optimization Suggestions */}
          <OptimizationSuggestions suggestions={r.optimization_suggestions} />

        </div>
      )}
    </div>
  );
}

export default function PromptsPanel({ prompts, analysisId }: { prompts: any[]; analysisId: string }) {
  return (
    <div className="space-y-3">
      <p className="text-gray-400 text-sm">
        {prompts.length} AI search prompts. Click "Analyze" to see prompt-specific visibility, competitor analysis, and citation readiness.
      </p>
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} analysisId={analysisId} />
      ))}
      {prompts.length === 0 && (
        <div className="text-center py-12 text-gray-500">No prompts generated yet.</div>
      )}
    </div>
  );
}
