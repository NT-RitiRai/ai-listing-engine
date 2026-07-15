"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzePrompt } from "@/lib/api";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, MessageSquare, Play, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AISearchSummary({ prompts, analysisId }: { prompts: any[], analysisId: string }) {
  const queryClient = useQueryClient();
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());

  if (!prompts || prompts.length === 0) {
    return null;
  }

  // Filter out prompts that don't have playground results yet
  const livePrompts = prompts.filter(p => p.playground_results?.live && Object.keys(p.playground_results.live).length > 0);
  const unanalyzedPrompts = prompts.filter(p => !p.playground_results?.live || Object.keys(p.playground_results.live).length === 0);

  const runAnalysis = async (promptId: string) => {
    setAnalyzingIds(prev => new Set(prev).add(promptId));
    try {
      const data = await analyzePrompt(promptId);
      // Wait a moment for the DB to settle before invalidating to ensure fresh data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["prompts", analysisId] });
      }, 500);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(promptId);
        return next;
      });
    }
  };

  const runAll = async () => {
    for (const p of unanalyzedPrompts) {
      if (!analyzingIds.has(p.id)) {
        await runAnalysis(p.id);
      }
    }
  };

  const isAnalyzing = analyzingIds.size > 0;

  if (livePrompts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12 text-center">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">AI Search Summary</h2>
        <p className="text-gray-500 mb-6">Live AI search data is currently unavailable. Run a live analysis to see how AI responds to searches about your business.</p>
        <button 
          onClick={runAll}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {isAnalyzing ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing {analyzingIds.size} / {unanalyzedPrompts.length} Prompts...</>
          ) : (
            <><Play className="w-5 h-5" /> Run Live AI Analysis</>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">AI Search Summary</h2>
          <span className="bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full border border-blue-100">
            {livePrompts.length} Search Queries Analyzed
          </span>
        </div>
        
        {unanalyzedPrompts.length > 0 && (
          <button 
            onClick={runAll}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors border border-blue-200 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Play className="w-4 h-4" /> Run {unanalyzedPrompts.length} Remaining Tests</>
            )}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {livePrompts.map((prompt, idx) => (
          <PromptCard key={prompt.id || idx} prompt={prompt} />
        ))}
      </div>
    </div>
  );
}

function PromptCard({ prompt }: { prompt: any }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedBoxes, setExpandedBoxes] = useState<Record<string, boolean>>({});

  const toggleBox = (name: string) => {
    setExpandedBoxes(prev => ({...prev, [name]: !prev[name]}));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50 print:break-after-avoid">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 leading-snug">"{prompt.prompt_text}"</h3>
            <p className="text-sm text-gray-500 mt-1">Search Intent: {prompt.intent}</p>
          </div>
          <span className="inline-flex shrink-0 items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
            {prompt.category || "General"}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(prompt.playground_results?.live || {}).map(([providerName, data]: [string, any]) => {
            const isValid = data.validation?.valid;
            const isRecommended = isValid && (data.brand_mentions > 0 || data.product_mentions > 0);
            
            return (
              <div key={providerName} className="rounded-xl border border-gray-100 bg-white overflow-hidden print:break-inside-avoid">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 capitalize">{providerName}</span>
                  </div>
                  {isRecommended ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Recommended
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      <XCircle className="w-3.5 h-3.5" /> Not Recommended
                    </span>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Confidence</p>
                      <p className="text-gray-900 font-semibold">{data.validation?.relevance_score || 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand Mentioned</p>
                      <p className="text-gray-900 font-semibold">{data.brand_mentions > 0 ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Products Mentioned</p>
                      <p className="text-gray-900 font-semibold">{data.product_mentions}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</p>
                      <p className="text-gray-900 font-semibold truncate text-sm mt-0.5">{isValid ? "Included in Answer" : "Excluded"}</p>
                    </div>
                  </div>

                  {/* Summary instead of raw text */}
                  <div 
                    onClick={() => toggleBox(providerName)}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors relative group"
                    title="Click to read full response"
                  >
                    <div className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-gray-900 ${expandedBoxes[providerName] ? '' : 'line-clamp-6 overflow-hidden'}`}>
                      {data.full_response ? (
                        <ReactMarkdown>{data.full_response}</ReactMarkdown>
                      ) : (
                        "No response provided by the AI."
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View Full Response Toggle */}
        <div className="mt-6 border-t border-gray-100 pt-4">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="w-4 h-4" /> Hide Full Responses</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> View Full AI Responses</>
            )}
          </button>

          {expanded && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(prompt.playground_results?.live || {}).map(([providerName, data]: [string, any]) => (
                <div key={`${providerName}-full`} className="bg-gray-900 rounded-xl p-5 text-gray-300 text-sm shadow-inner overflow-y-auto max-h-96">
                  <h4 className="text-white font-semibold mb-3 capitalize">{providerName} Full Response</h4>
                  <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {data.full_response}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
