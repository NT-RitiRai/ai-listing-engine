"use client";

import {
  Compass, ShoppingCart, Info, CreditCard, GitCompare, FlaskConical,
  Lightbulb, MapPin, DollarSign, Target, Star, Search,
  TrendingUp, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp, BarChart2
} from "lucide-react";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from "recharts";
import { analyzePrompt } from "@/lib/api";

interface Page7Props { prompts: any[]; }

// All 11 supported intents with metadata
const INTENT_META: Record<string, {
  label: string; icon: any; color: string; bg: string; border: string;
  textColor: string; chartColor: string; opportunityLabel: string;
}> = {
  "Commercial":      { label: "Commercial",      icon: ShoppingCart, color: "bg-indigo-500",  bg: "bg-indigo-50",  border: "border-indigo-200",  textColor: "text-indigo-700",  chartColor: "#6366f1", opportunityLabel: "High Revenue Potential"   },
  "Informational":   { label: "Informational",   icon: Info,         color: "bg-sky-500",     bg: "bg-sky-50",     border: "border-sky-200",     textColor: "text-sky-700",     chartColor: "#0ea5e9", opportunityLabel: "Content Authority Gap"    },
  "Transactional":   { label: "Transactional",   icon: CreditCard,   color: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", textColor: "text-emerald-700", chartColor: "#10b981", opportunityLabel: "Direct Conversion Uplift" },
  "Comparison":      { label: "Comparison",      icon: GitCompare,   color: "bg-amber-500",   bg: "bg-amber-50",   border: "border-amber-200",   textColor: "text-amber-700",   chartColor: "#f59e0b", opportunityLabel: "Competitive Edge Gain"    },
  "Research":        { label: "Research",        icon: FlaskConical, color: "bg-violet-500",  bg: "bg-violet-50",  border: "border-violet-200",  textColor: "text-violet-700",  chartColor: "#8b5cf6", opportunityLabel: "Thought Leadership Gap"   },
  "Problem Solving": { label: "Problem Solving", icon: Lightbulb,    color: "bg-orange-500",  bg: "bg-orange-50",  border: "border-orange-200",  textColor: "text-orange-700",  chartColor: "#f97316", opportunityLabel: "Solution Authority Gap"   },
  "Local":           { label: "Local",           icon: MapPin,       color: "bg-teal-500",    bg: "bg-teal-50",    border: "border-teal-200",    textColor: "text-teal-700",    chartColor: "#14b8a6", opportunityLabel: "Local Market Capture"     },
  "Purchase":        { label: "Purchase",        icon: DollarSign,   color: "bg-rose-500",    bg: "bg-rose-50",    border: "border-rose-200",    textColor: "text-rose-700",    chartColor: "#f43f5e", opportunityLabel: "Direct Sales Opportunity" },
  "Decision":        { label: "Decision",        icon: Target,       color: "bg-red-500",     bg: "bg-red-50",     border: "border-red-200",     textColor: "text-red-700",     chartColor: "#ef4444", opportunityLabel: "Decision Stage Capture"   },
  "Recommendation":  { label: "Recommendation",  icon: Star,         color: "bg-yellow-500",  bg: "bg-yellow-50",  border: "border-yellow-200",  textColor: "text-yellow-700",  chartColor: "#eab308", opportunityLabel: "Brand Endorsement Gain"   },
  "Discovery":       { label: "Discovery",       icon: Search,       color: "bg-pink-500",    bg: "bg-pink-50",    border: "border-pink-200",    textColor: "text-pink-700",    chartColor: "#ec4899", opportunityLabel: "Top-Funnel Awareness Gap" },
};

const DEFAULT_META = {
  label: "Other", icon: Compass, color: "bg-gray-500", bg: "bg-gray-50",
  border: "border-gray-200", textColor: "text-gray-700", chartColor: "#9ca3af",
  opportunityLabel: "General Opportunity"
};

function getBusinessOpportunity(intent: string, vis: number, rec: number, queries: number): string {
  const meta = INTENT_META[intent] || DEFAULT_META;
  if (vis === 0 && rec === 0) {
    return `${queries} ${intent.toLowerCase()} queries generated — AI evaluation pending. Once scored, opportunity size for "${meta.opportunityLabel}" will be calculated automatically.`;
  }
  if (vis < 20) return `Critical gap: You are nearly invisible for ${intent.toLowerCase()} queries. Every competitor capturing this intent is taking potential revenue from you. Fixing this could unlock ${meta.opportunityLabel}.`;
  if (vis < 50) return `Moderate opportunity: Visibility is partial but insufficient. ${queries} ${intent.toLowerCase()} queries show only ${vis}% coverage — ${meta.opportunityLabel} is being lost to competitors.`;
  return `Strong position: ${vis}% visibility across ${intent.toLowerCase()} queries. Continue reinforcing ${meta.opportunityLabel} by expanding coverage of remaining ${queries - Math.round(queries * vis / 100)} uncovered queries.`;
}

function IntentRow({ intentName, data, index, expanded, onToggle }: {
  intentName: string;
  data: { prompts: any[]; vis: number; rec: number; citation: number; confidence: number; competitors: number };
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = INTENT_META[intentName] || DEFAULT_META;
  const Icon = meta.icon;
  const hasData = data.prompts.some(p => p.playground_results);
  const opportunity = getBusinessOpportunity(intentName, data.vis, data.rec, data.prompts.length);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${meta.border}`}>
      {/* Row Header */}
      <div className={`p-5 flex flex-col md:flex-row items-start md:items-center gap-4 ${meta.bg} border-b ${meta.border}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`${meta.color} text-white p-2.5 rounded-xl shadow-sm shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-black text-lg ${meta.textColor}`}>{intentName}</h3>
            <p className="text-xs text-gray-500 font-medium">{data.prompts.length} {data.prompts.length === 1 ? "query" : "queries"} classified</p>
          </div>
        </div>

        {/* Quick stat pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="px-3 py-1.5 bg-white rounded-full text-xs font-bold text-gray-700 border border-gray-200 shadow-sm">
            Visibility: {hasData ? `${data.vis}%` : "—"}
          </span>
          <span className="px-3 py-1.5 bg-white rounded-full text-xs font-bold text-gray-700 border border-gray-200 shadow-sm">
            Rec: {hasData ? `${data.rec}%` : "—"}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
            !hasData ? "bg-gray-100 text-gray-400 border-gray-200" :
            data.vis > 50 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
            data.vis > 25 ? "bg-amber-100 text-amber-700 border-amber-200" :
            "bg-red-100 text-red-700 border-red-200"
          }`}>
            {!hasData ? "Pending" : data.vis > 50 ? "Strong" : data.vis > 25 ? "Partial" : "Low"}
          </span>
          <button
            onClick={onToggle}
            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${meta.bg} ${meta.textColor} ${meta.border} hover:opacity-80`}
          >
            {expanded ? <><ChevronUp className="w-3.5 h-3.5" />Less</> : <><ChevronDown className="w-3.5 h-3.5" />Detail</>}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-gray-100 border-b border-gray-100">
        {[
          { label: "Queries",      value: data.prompts.length, unit: "" },
          { label: "Visibility",   value: hasData ? data.vis         : "—", unit: hasData ? "%" : "" },
          { label: "Recommend",    value: hasData ? data.rec         : "—", unit: hasData ? "%" : "" },
          { label: "Citation",     value: hasData ? data.citation    : "—", unit: hasData ? "%" : "" },
          { label: "Confidence",   value: hasData ? data.confidence  : "—", unit: hasData ? "%" : "" },
          { label: "Competitors",  value: hasData ? data.competitors : "—", unit: "" },
        ].map(m => (
          <div key={m.label} className="p-3 text-center">
            <div className={`text-xl font-black ${typeof m.value === "number" && m.label === "Visibility" ? (m.value > 50 ? "text-emerald-600" : m.value > 25 ? "text-amber-500" : "text-red-500") : "text-gray-900"}`}>
              {m.value}{m.unit}
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Confidence bar */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1.5 text-xs text-gray-400">
          <span className="font-bold uppercase tracking-wider">Visibility Strength</span>
          <span className="font-bold">{hasData ? `${data.vis}%` : "Pending"}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-1000"
            style={{ width: hasData ? `${data.vis}%` : "0%", backgroundColor: meta.chartColor }}
          />
        </div>
      </div>

      {/* Business Opportunity — always visible */}
      <div className="px-5 py-4 flex items-start gap-3">
        <TrendingUp className={`w-4 h-4 shrink-0 mt-0.5 ${meta.textColor}`} />
        <div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Business Opportunity</span>
          <p className="text-sm text-gray-700 leading-relaxed font-medium">{opportunity}</p>
        </div>
      </div>

      {/* Expanded: prompt list */}
      {expanded && (
        <div className={`border-t ${meta.border} ${meta.bg} p-5 space-y-3`}>
          <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Prompts in This Intent</h4>
          {data.prompts.map((p, i) => {
            const pr = p.playground_results;
            let conf = pr ? Math.round(((pr.model_probabilities?.ChatGPT || 0) + (pr.model_probabilities?.Gemini || 0)) / 2) : null;
            let status = !pr ? "pending" : conf && conf > 45 ? "recommended" : "missed";
            if (pr && pr.live && (pr.live.openai || pr.live.gemini)) {
              const oValid = pr.live.openai?.validation?.valid;
              const oMention = (pr.live.openai?.brand_mentions || 0) > 0;
              const gValid = pr.live.gemini?.validation?.valid;
              const gMention = (pr.live.gemini?.brand_mentions || 0) > 0;
              const gptConf = (oValid && oMention) ? 100 : 0;
              const gemConf = (gValid && gMention) ? 100 : 0;
              if (pr.live.openai && pr.live.gemini) conf = (gptConf + gemConf) / 2;
              else if (pr.live.openai) conf = gptConf;
              else if (pr.live.gemini) conf = gemConf;
              status = (gptConf === 100 || gemConf === 100) ? "recommended" : "missed";
            }
            return (
              <div key={p.id || i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">"{p.prompt_text}"</p>
                  {p.rationale && <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{p.rationale}</p>}
                </div>
                <div className="shrink-0">
                  {status === "recommended" && <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold"><CheckCircle className="w-3 h-3"/>Recommended</span>}
                  {status === "missed"      && <span className="flex items-center gap-1 text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full text-[11px] font-bold"><AlertCircle className="w-3 h-3"/>Missed</span>}
                  {status === "pending"     && <span className="flex items-center gap-1 text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full text-[11px] font-bold"><Clock className="w-3 h-3"/>Pending</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

export default function Page7IntentAnalysis({ prompts }: Page7Props) {
  const [expandedIntent, setExpandedIntent] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

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

  if (!prompts || prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-gray-400 gap-3">
        <Compass className="w-14 h-14 opacity-20" />
        <h3 className="text-xl font-semibold">No Prompts Available</h3>
        <p className="text-sm">Intent analysis requires at least one generated prompt.</p>
      </div>
    );
  }

  // ── Aggregate prompts by intent ─────────────────────────────────────────────
  const intentMap: Record<string, { prompts: any[]; vis: number[]; rec: number[]; citation: number[]; confidence: number[]; competitors: number[] }> = {};

  prompts.forEach(p => {
    const intent = p.intent || p.intent_category || "Informational";
    if (!intentMap[intent]) {
      intentMap[intent] = { prompts: [], vis: [], rec: [], citation: [], confidence: [], competitors: [] };
    }
    intentMap[intent].prompts.push(p);

    const pr = p.playground_results;
    if (!pr) return;

    const vis    = pr.visibility_score || 0;
    let rec    = Math.round(((pr.model_probabilities?.ChatGPT || 0) + (pr.model_probabilities?.Gemini || 0)) / 2);
    let cit    = pr.citation_readiness?.overall_score || 0;

    if (pr.live && (pr.live.openai || pr.live.gemini)) {
        const oValid = pr.live.openai?.validation?.valid;
        const oMention = (pr.live.openai?.brand_mentions || 0) > 0;
        const gValid = pr.live.gemini?.validation?.valid;
        const gMention = (pr.live.gemini?.brand_mentions || 0) > 0;
        const gptConf = (oValid && oMention) ? 100 : 0;
        const gemConf = (gValid && gMention) ? 100 : 0;
        if (pr.live.openai && pr.live.gemini) rec = (gptConf + gemConf) / 2;
        else if (pr.live.openai) rec = gptConf;
        else if (pr.live.gemini) rec = gemConf;
        
        const gptCite = pr.live.openai?.citation_found ? 100 : 0;
        const gemCite = pr.live.gemini?.citation_found ? 100 : 0;
        if (pr.live.openai && pr.live.gemini) cit = (gptCite + gemCite) / 2;
        else if (pr.live.openai) cit = gptCite;
        else if (pr.live.gemini) cit = gemCite;
    }
    const comps  = (pr.competitor_gap?.gaps || []).length;

    intentMap[intent].vis.push(vis);
    intentMap[intent].rec.push(rec);
    intentMap[intent].citation.push(cit);
    intentMap[intent].confidence.push(rec);
    intentMap[intent].competitors.push(comps);
  });

  // ── Build sorted rows ────────────────────────────────────────────────────────
  const intentRows = Object.keys(intentMap)
    .map(name => ({
      name,
      data: {
        prompts:     intentMap[name].prompts,
        vis:         avg(intentMap[name].vis),
        rec:         avg(intentMap[name].rec),
        citation:    avg(intentMap[name].citation),
        confidence:  avg(intentMap[name].confidence),
        competitors: intentMap[name].competitors.reduce((a, b) => a + b, 0),
      },
    }))
    .sort((a, b) => b.data.prompts.length - a.data.prompts.length);

  const hasAnyData = prompts.some(p => p.playground_results);

  // ── Chart data ───────────────────────────────────────────────────────────────
  const chartData = intentRows.map(row => ({
    name:    row.name.length > 10 ? row.name.slice(0, 10) + "…" : row.name,
    fullName: row.name,
    Queries: row.data.prompts.length,
    Visibility: row.data.vis,
    Recommendation: row.data.rec,
    fill: (INTENT_META[row.name] || DEFAULT_META).chartColor,
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 7
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">User Search Intent</h1>
        <p className="text-xl text-gray-500">Every AI query classified by search intent, with visibility and business opportunity scoring.</p>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Intent Categories", value: intentRows.length,          icon: Compass,     color: "text-indigo-700" },
          { label: "Total Queries",     value: prompts.length,             icon: Search,      color: "text-gray-900"   },
          { label: "Evaluated",         value: prompts.filter(p => p.playground_results).length, icon: CheckCircle, color: "text-emerald-700" },
          { label: "Pending Eval.",     value: prompts.filter(p => !p.playground_results).length, icon: Clock,       color: "text-amber-600"  },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 shrink-0">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Charts */}
      {hasAnyData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queries per intent */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Queries by Intent</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} width={80} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
                    formatter={(val: any, _: any, props: any) => [val, props.payload.fullName]}
                  />
                  <Bar isAnimationActive={false} dataKey="Queries" radius={[0,6,6,0]} maxBarSize={24}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Visibility by intent */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Visibility vs Recommendation by Intent</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
                    formatter={(val: any) => [`${val}%`]}
                  />
                  <Bar isAnimationActive={false} dataKey="Visibility"     fill="#6366f1" radius={[4,4,0,0]} maxBarSize={22} />
                  <Bar isAnimationActive={false} dataKey="Recommendation" fill="#10b981" radius={[4,4,0,0]} maxBarSize={22} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Pending notice */}
      {!hasAnyData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900">AI Evaluation Pending</h4>
              <p className="text-sm text-amber-700 mt-1">
                {prompts.length} queries have been classified into {intentRows.length} intent categories. Visibility, Recommendation, Citation, and Confidence scores will populate automatically once the OpenAI + Gemini playground evaluation completes.
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
                <Clock className="w-4 h-4" />
                Run Live Evaluation
              </>
            )}
          </button>
        </div>
      )}

      {/* Intent rows */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">All Intent Categories</h3>
        {intentRows.map((row, i) => (
          <IntentRow
            key={row.name}
            intentName={row.name}
            data={row.data}
            index={i}
            expanded={expandedIntent === row.name}
            onToggle={() => setExpandedIntent(expandedIntent === row.name ? null : row.name)}
          />
        ))}

        {/* Ghost cards for intents not present in this analysis */}
        {Object.keys(INTENT_META).filter(intent => !intentMap[intent]).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">No Queries Generated for These Intents</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.keys(INTENT_META).filter(intent => !intentMap[intent]).map(intent => {
                const m = INTENT_META[intent];
                const Icon = m.icon;
                return (
                  <div key={intent} className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 flex items-center gap-3 opacity-50">
                    <div className="bg-gray-200 p-2 rounded-lg shrink-0">
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm font-bold text-gray-400">{intent}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
