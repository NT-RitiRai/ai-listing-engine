"use client";

import {
  MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle, Tag,
  Brain, Zap, Users, Link, ChevronDown, ChevronUp, Target,
  BarChart2, Lightbulb, TrendingUp, Activity, Play
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { analyzePrompt } from "@/lib/api";

interface Page4Props { prompts: any[]; }

const INTENT_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  "Recommendation":  { color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200" },
  "Local":           { color: "text-blue-700",     bg: "bg-blue-50",     border: "border-blue-200" },
  "Commercial":      { color: "text-indigo-700",   bg: "bg-indigo-50",   border: "border-indigo-200" },
  "Purchase":        { color: "text-purple-700",   bg: "bg-purple-50",   border: "border-purple-200" },
  "Problem Solving": { color: "text-amber-700",    bg: "bg-amber-50",    border: "border-amber-200" },
  "Informational":   { color: "text-cyan-700",     bg: "bg-cyan-50",     border: "border-cyan-200" },
  "Comparison":      { color: "text-rose-700",     bg: "bg-rose-50",     border: "border-rose-200" },
};

const INTENT_DEFAULT = { color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200" };

function StatusBadge({ status }: { status: "recommended" | "missed" | "pending" }) {
  if (status === "recommended") return (
    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 font-bold text-xs tracking-wide">
      <CheckCircle2 className="w-3.5 h-3.5" /> RECOMMENDED
    </div>
  );
  if (status === "missed") return (
    <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-200 font-bold text-xs tracking-wide">
      <XCircle className="w-3.5 h-3.5" /> MISSED OPPORTUNITY
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 font-bold text-xs tracking-wide">
      <Clock className="w-3.5 h-3.5" /> AWAITING EVALUATION
    </div>
  );
}

function ConfidenceBar({ value, color = "#6366f1" }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

function PromptCard({ prompt, index }: { prompt: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const live = prompt.playground_results;
  const intentCfg = INTENT_CONFIG[prompt.intent] || INTENT_DEFAULT;

  // Determine status & derive metrics
  let status: "recommended" | "missed" | "pending" = "pending";
  let brandMention = false;
  let citationFound = false;
  let competitorsMentioned: string[] = [];
  let confidence = 0;
  let reason = prompt.rationale || "System-generated prompt based on business intelligence profile.";
  let tokens = 0;
  let responseTime = 0;
  let aiModel = "OpenAI GPT-4 + Google Gemini";
  let businessInterpretation = "";

  if (live) {
    // From playground engine
    const vis = live.visibility_score || 0;
    const rec = live.recommendation_probability || 0;
    const chatGPTProb = live.model_probabilities?.ChatGPT || 0;
    const geminiProb  = live.model_probabilities?.Gemini  || 0;

    confidence = 0;
    status = "pending";
    if (live.live && (live.live.openai || live.live.gemini)) {
      const openai = live.live.openai;
      const gemini = live.live.gemini;
      
      let gptConf = 0;
      let geminiConf = 0;
      
      if (openai) {
         const oValid = openai.validation?.valid;
         const oMention = (openai.brand_mentions || 0) > 0;
         brandMention = oMention; 
         citationFound = openai.citation_found; 
         gptConf = (oValid && oMention) ? 100 : 0;
         status = (oValid && oMention) ? "recommended" : "missed";
      }
      if (gemini) {
         const gValid = gemini.validation?.valid;
         const gMention = (gemini.brand_mentions || 0) > 0;
         brandMention = openai ? (brandMention || gMention) : gMention;
         citationFound = openai ? (citationFound || gemini.citation_found) : gemini.citation_found;
         geminiConf = (gValid && gMention) ? 100 : 0;
         if (!openai) {
            status = (gValid && gMention) ? "recommended" : "missed";
         }
      }
      if (openai && gemini) {
         status = (gptConf === 100 || geminiConf === 100) ? "recommended" : "missed";
         confidence = (gptConf + geminiConf) / 2;
      } else if (openai) {
         confidence = gptConf;
      } else if (gemini) {
         confidence = geminiConf;
      }
      reason = openai?.validation?.reason || gemini?.validation?.reason || reason;
      tokens = (openai?.tokens || gemini?.tokens || tokens);
      responseTime = openai?.response_time || gemini?.response_time || responseTime;
      aiModel = [openai ? "ChatGPT" : "", gemini ? "Gemini" : ""].filter(Boolean).join(" + ");
    } else {
      // Fallback for pending
      confidence = Math.round((chatGPTProb + geminiProb) / 2) || rec;
      status = confidence > 45 ? "recommended" : "missed";
    }

    // Business interpretation from brand_overview
  } else {
    // No playground results yet — derive from rationale intelligently
    businessInterpretation = `This prompt targets the "${prompt.intent}" search intent. ${prompt.rationale}`;
  }

  const hasResults = !!live;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="bg-indigo-100 text-indigo-700 rounded-xl p-3 shrink-0 font-black text-lg w-11 h-11 flex items-center justify-center">
              {index + 1}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                "{prompt.prompt_text}"
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${intentCfg.bg} ${intentCfg.color} ${intentCfg.border}`}>
                  <Tag className="w-3 h-3" /> {prompt.intent}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  <Brain className="w-3 h-3" /> {aiModel}
                </span>
                {hasResults && tokens > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    <Zap className="w-3 h-3" /> ~{tokens} tokens
                  </span>
                )}
                {hasResults && responseTime > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    <Clock className="w-3 h-3" /> {responseTime}s
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            <StatusBadge status={status} />
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
            >
              {expanded ? <><ChevronUp className="w-4 h-4" /> Less detail</> : <><ChevronDown className="w-4 h-4" /> Full detail</>}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
        <div className="p-4 flex items-center gap-3">
          <CheckCircle2 className={`w-5 h-5 shrink-0 ${brandMention && hasResults ? "text-emerald-500" : "text-gray-300"}`} />
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Brand Mention</div>
            <div className={`text-sm font-bold mt-0.5 ${!hasResults ? "text-gray-400" : brandMention ? "text-emerald-700" : "text-red-600"}`}>
              {!hasResults ? "Pending" : brandMention ? "Detected" : "Not Found"}
            </div>
          </div>
        </div>
        <div className="p-4 flex items-center gap-3">
          <Link className={`w-5 h-5 shrink-0 ${citationFound && hasResults ? "text-blue-500" : "text-gray-300"}`} />
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Citation</div>
            <div className={`text-sm font-bold mt-0.5 ${!hasResults ? "text-gray-400" : citationFound ? "text-blue-700" : "text-red-600"}`}>
              {!hasResults ? "Pending" : citationFound ? "Likely" : "Unlikely"}
            </div>
          </div>
        </div>
        <div className="p-4 flex items-center gap-3">
          <Users className={`w-5 h-5 shrink-0 ${competitorsMentioned.length > 0 && hasResults ? "text-amber-500" : "text-gray-300"}`} />
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Competitors</div>
            <div className={`text-sm font-bold mt-0.5 ${!hasResults ? "text-gray-400" : competitorsMentioned.length > 0 ? "text-amber-700" : "text-gray-600"}`}>
              {!hasResults ? "Pending" : competitorsMentioned.length > 0 ? `${competitorsMentioned.length} Detected` : "None Found"}
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Confidence</div>
          <div className={`text-lg font-black mb-1 ${!hasResults ? "text-gray-300" : confidence > 60 ? "text-emerald-600" : confidence > 30 ? "text-amber-500" : "text-red-500"}`}>
            {!hasResults ? "—" : `${confidence}%`}
          </div>
          <ConfidenceBar value={hasResults ? confidence : 0} color={confidence > 60 ? "#10b981" : confidence > 30 ? "#f59e0b" : "#ef4444"} />
        </div>
      </div>

      {/* Business Interpretation — always visible */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="bg-indigo-50 p-2 rounded-lg shrink-0">
            <Lightbulb className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Business Interpretation</h4>
            <p className="text-gray-800 text-sm leading-relaxed font-medium">{businessInterpretation}</p>
          </div>
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/30">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Business Context Used */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Business Context Used
              </h4>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-700 leading-relaxed">
                {prompt.rationale || "No rationale provided."}
              </div>
            </div>

            {/* AI Response Reason */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> AI Outcome Reason
              </h4>
              <div className={`bg-white rounded-xl border p-4 text-sm leading-relaxed ${status === "recommended" ? "border-emerald-200 text-emerald-900" : status === "missed" ? "border-red-200 text-red-900" : "border-gray-200 text-gray-500 italic"}`}>
                {status === "pending" ? "Live AI evaluation hasn't run yet. The system will query OpenAI and Gemini APIs to validate this prompt." : reason}
              </div>
            </div>

            {/* Competitor Gaps */}
            {competitorsMentioned.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Competitors Mentioned / Gaps
                </h4>
                <div className="space-y-2">
                  {competitorsMentioned.map((gap, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm text-amber-800 font-medium flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> {gap}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Readiness */}
            {hasResults && live?.platform_readiness && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5" /> Platform Readiness
                </h4>
                <div className="space-y-2">
                  {Object.entries(live.platform_readiness).map(([model, data]: [string, any]) => (
                    <div key={model} className="bg-white border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-gray-900">{model}</span>
                        <span className={`text-sm font-black ${(data.probability || 0) > 50 ? "text-emerald-600" : "text-amber-500"}`}>{data.probability || 0}%</span>
                      </div>
                      <ConfidenceBar value={data.probability || 0} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Gaps */}
            {hasResults && live?.content_gaps?.length > 0 && (
              <div className="md:col-span-2 space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Content Gaps for This Query
                </h4>
                <div className="flex flex-wrap gap-2">
                  {live.content_gaps.map((gap: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-semibold">
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Optimization Suggestions */}
            {hasResults && live?.optimization_suggestions?.length > 0 && (
              <div className="md:col-span-2 space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Optimization Suggestions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {live.optimization_suggestions.map((s: string, i: number) => (
                    <div key={i} className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-800 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" /> {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page4PromptAnalysis({ prompts }: Page4Props) {
  const [filterIntent, setFilterIntent] = useState("All");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const hasStartedAutoEval = useRef(false);

  const intents = ["All", ...Array.from(new Set((prompts || []).map(p => p.intent))).filter(Boolean)];
  const filtered = filterIntent === "All" ? prompts || [] : (prompts || []).filter(p => p.intent === filterIntent);
  
  const handleRunEvaluation = async () => {
    setIsRunning(true);
    let completed = 0;
    for (const p of prompts) {
      if (!p.playground_results) {
        try {
          await analyzePrompt(p.id);
        } catch (e) {
          console.error("Failed to analyze prompt", p.id, e);
        }
      }
      completed++;
      setProgress(completed);
    }
    setIsRunning(false);
    window.location.reload();
  };

  const totalRec = (prompts || []).filter(p => {
    const live = p.playground_results;
    if (!live) return false;
    if (live.live && (live.live.openai || live.live.gemini)) {
      let gptConf = 0;
      let gemConf = 0;
      if (live.live.openai) {
        const oValid = live.live.openai.validation?.valid;
        const oMention = (live.live.openai.brand_mentions || 0) > 0;
        gptConf = (oValid && oMention) ? 100 : 0;
      }
      if (live.live.gemini) {
        const gValid = live.live.gemini.validation?.valid;
        const gMention = (live.live.gemini.brand_mentions || 0) > 0;
        gemConf = (gValid && gMention) ? 100 : 0;
      }
      return gptConf === 100 || gemConf === 100;
    }
    const conf = Math.round(((live.model_probabilities?.ChatGPT || 0) + (live.model_probabilities?.Gemini || 0)) / 2);
    return conf > 45;
  }).length;

  const pending = (prompts || []).filter(p => !p.playground_results).length;

  useEffect(() => {
    if (pending > 0 && !isRunning && !hasStartedAutoEval.current) {
      hasStartedAutoEval.current = true;
      handleRunEvaluation();
    }
  }, [pending, isRunning]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 4
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">AI Search Queries</h1>
        <p className="text-xl text-gray-500">Every query generated by the AI system, and how each AI model responds.</p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Prompts",    value: prompts?.length || 0,                      color: "text-gray-900",    icon: MessageSquare },
          { label: "Recommended",      value: totalRec,                                   color: "text-emerald-700", icon: CheckCircle2 },
          { label: "Missed",           value: (prompts?.length || 0) - totalRec - pending, color: "text-red-600",     icon: XCircle },
          { label: "Pending Eval.",    value: pending,                                    color: "text-amber-600",   icon: Clock },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Banner */}
      {pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900">Live Evaluation Pending</h4>
              <p className="text-amber-700 text-sm mt-1">
                {pending} queries need to be run through <strong>OpenAI</strong> and <strong>Gemini</strong> APIs to produce real visibility scores.
              </p>
            </div>
          </div>
          <button
            onClick={handleRunEvaluation}
            disabled={isRunning}
            className="shrink-0 flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Evaluating ({progress}/{prompts.length})...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Live Evaluation
              </>
            )}
          </button>
        </div>
      )}

      {/* Intent Filter */}
      {intents.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {intents.map(intent => {
            const cfg = intent === "All" ? { bg: "bg-gray-100", color: "text-gray-700", border: "border-gray-200" } : (INTENT_CONFIG[intent] || INTENT_DEFAULT);
            const active = filterIntent === intent;
            return (
              <button
                key={intent}
                onClick={() => setFilterIntent(intent)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${active ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm ring-2 ring-indigo-200` : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
              >
                {intent}
              </button>
            );
          })}
        </div>
      )}

      {/* Prompt Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No prompts to display.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((prompt, idx) => (
            <PromptCard key={prompt.id || idx} prompt={prompt} index={prompts.indexOf(prompt)} />
          ))}
        </div>
      )}
    </div>
  );
}
