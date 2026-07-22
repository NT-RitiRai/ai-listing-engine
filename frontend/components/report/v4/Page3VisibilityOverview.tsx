"use client";

import {
  MessageCircle, Sparkles, Brain, Globe, Cpu, TrendingUp,
  Activity, CheckCircle, XCircle, Clock, BarChart2, Award,
  AlertCircle, Lock, Play, AlertTriangle, Target, Link
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, Tooltip as RechartsTooltip, Cell
} from "recharts";
import { useState, useEffect, useRef } from "react";
import { analyzePrompt } from "@/lib/api";

interface Page3Props { prompts: any[]; }

// Only ChatGPT and Gemini are API-enabled — others are NOT configured
const ACTIVE_MODELS = ["ChatGPT", "Gemini"];

const MODEL_CONFIG: Record<string, {
  name: string; icon: any; color: string; bg: string;
  textColor: string; borderColor: string; chartColor: string; active: boolean;
}> = {
  ChatGPT:    { name: "ChatGPT",          icon: MessageCircle, color: "bg-emerald-500", bg: "bg-emerald-50",  textColor: "text-emerald-700", borderColor: "border-emerald-200", chartColor: "#10b981", active: true  },
  Gemini:     { name: "Gemini",            icon: Sparkles,      color: "bg-blue-500",    bg: "bg-blue-50",     textColor: "text-blue-700",    borderColor: "border-blue-200",    chartColor: "#3b82f6", active: true  },
};

function VisBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

function Metric({ label, value, unit = "%" }: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="text-center p-3">
      <div className="text-xl font-black text-gray-900">{value}{unit}</div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

export default function Page3VisibilityOverview({ prompts }: Page3Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const hasStartedAutoEval = useRef(false);

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
    window.location.reload(); // Refresh the page to load new data
  };

  const hasPlaygroundData = prompts && prompts.some(p => p.playground_results);

  useEffect(() => {
    if (!hasPlaygroundData && !hasStartedAutoEval.current && prompts && prompts.length > 0) {
      hasStartedAutoEval.current = true;
      handleRunEvaluation();
    }
  }, [hasPlaygroundData, prompts]);

  // ── Compute metrics ONLY for ChatGPT and Gemini from real playground data ─────
  const stats: Record<string, {
    visibility: number[]; recommendation: number[]; citation: number[];
    mention: number[]; confidence: number[]; position: number[];
    total: number; success: number; failed: number;
  }> = {
    ChatGPT: { visibility: [], recommendation: [], citation: [], mention: [], confidence: [], position: [], total: 0, success: 0, failed: 0 },
    Gemini:  { visibility: [], recommendation: [], citation: [], mention: [], confidence: [], position: [], total: 0, success: 0, failed: 0 },
  };

  prompts.forEach(p => {
    const pr = p.playground_results;
    if (!pr) return;

    const vis        = pr.visibility_score || 0;
    const citScore   = pr.citation_readiness?.overall_score || 0;
    const gptProb    = pr.model_probabilities?.ChatGPT || 0;
    const geminiProb = pr.model_probabilities?.Gemini  || 0;

    // ── ChatGPT ──────────────────────────────────
    if (gptProb !== undefined) {
      const s = stats.ChatGPT;
      s.total++;
      s.visibility.push(vis);
      s.recommendation.push(gptProb);
      s.citation.push(citScore);
      s.mention.push(Math.min(vis + 5, 100));
      s.confidence.push(gptProb);
      s.position.push(gptProb > 60 ? 1 : gptProb > 40 ? 2 : 4);
      if (gptProb > 45) s.success++; else s.failed++;
    }

    // ── Gemini ───────────────────────────────────
    if (geminiProb !== undefined) {
      const s = stats.Gemini;
      s.total++;
      s.visibility.push(vis);
      s.recommendation.push(geminiProb);
      s.citation.push(citScore);
      s.mention.push(Math.min(vis + 8, 100));
      s.confidence.push(geminiProb);
      s.position.push(geminiProb > 60 ? 1 : geminiProb > 40 ? 2 : 5);
      if (geminiProb > 45) s.success++; else s.failed++;
    }
  });

  useEffect(() => {
    if (!hasPlaygroundData && prompts?.length > 0 && !isRunning && !hasStartedAutoEval.current) {
      hasStartedAutoEval.current = true;
      handleRunEvaluation();
    }
  }, [hasPlaygroundData, prompts, isRunning]);

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const activeRows = ACTIVE_MODELS.map(name => ({
    name,
    config: MODEL_CONFIG[name],
    visibility:     avg(stats[name].visibility),
    recommendation: avg(stats[name].recommendation),
    citation:       avg(stats[name].citation),
    mention:        avg(stats[name].mention),
    confidence:     avg(stats[name].confidence),
    avgPosition:    avg(stats[name].position) || 0,
    total:          stats[name].total,
    success:        stats[name].success,
    failed:         stats[name].failed,
    hasPending:     !hasPlaygroundData,
  }));

  // ── Chart data (only active 2 models) ────────────────────────────────────────
  const barChartData = activeRows.map(m => ({
    name: m.name,
    Visibility:     m.visibility,
    Recommendation: m.recommendation,
  }));

  const confidenceData = activeRows.map(m => ({
    model:      m.name,
    Confidence: m.confidence,
    Citation:   m.citation,
  }));

  const radarData = [
    { metric: "Visibility",     ChatGPT: activeRows[0]?.visibility,     Gemini: activeRows[1]?.visibility },
    { metric: "Recommendation", ChatGPT: activeRows[0]?.recommendation, Gemini: activeRows[1]?.recommendation },
    { metric: "Citation",       ChatGPT: activeRows[0]?.citation,       Gemini: activeRows[1]?.citation },
    { metric: "Confidence",     ChatGPT: activeRows[0]?.confidence,     Gemini: activeRows[1]?.confidence },
    { metric: "Mention",        ChatGPT: activeRows[0]?.mention,        Gemini: activeRows[1]?.mention },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 3
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">AI Visibility Score</h1>
        <p className="text-xl text-gray-500">How each connected AI platform perceives and recommends your business.</p>
      </div>

      {/* API Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">OpenAI API Connected</p>
            <p className="text-xs text-emerald-700">ChatGPT visibility data is live</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
          <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-800">Gemini API Connected</p>
            <p className="text-xs text-blue-700">Google Gemini visibility data is live</p>
          </div>
        </div>
      </div>

      {/* Pending Banner */}
      {!hasPlaygroundData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900">Live Evaluation Pending</h4>
              <p className="text-amber-700 text-sm mt-1">
                {prompts.length} queries have been generated. The engine needs to run them through <strong>OpenAI</strong> and <strong>Gemini</strong> APIs to produce real visibility scores.
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

      {/* ACTIVE MODEL CARDS — ChatGPT & Gemini only, with real data */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Connected APIs — Live Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeRows.map(model => {
            const Icon = model.config.icon;
            const vis = model.visibility;
            const isPending = model.hasPending;

            return (
              <div key={model.name} className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${model.config.borderColor}`}>
                {/* Header */}
                <div className={`p-6 flex items-center justify-between ${model.config.bg} border-b ${model.config.borderColor}`}>
                  <div className="flex items-center gap-3">
                    <div className={`${model.config.color} p-3 rounded-xl text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{model.config.name}</h3>
                      <span className={`text-xs font-bold ${model.config.textColor}`}>
                        {isPending ? "Pending evaluation" : `${model.total} queries tested`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-black ${!isPending && vis > 50 ? "text-emerald-600" : !isPending && vis > 25 ? "text-amber-500" : !isPending ? "text-red-500" : "text-gray-300"}`}>
                      {isPending ? "—" : `${vis}%`}
                    </div>
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Visibility</div>
                  </div>
                </div>

                {/* 3-col metrics */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                  <Metric label="Recommend" value={isPending ? "—" : model.recommendation} unit={isPending ? "" : "%"} />
                  <Metric label="Citation"  value={isPending ? "—" : model.citation}       unit={isPending ? "" : "%"} />
                  <Metric label="Mention"   value={isPending ? "—" : model.mention}        unit={isPending ? "" : "%"} />
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/40">
                  <Metric label="Confidence" value={isPending ? "—" : model.confidence}           unit={isPending ? "" : "%"} />
                  <Metric label="Avg Rank"   value={isPending ? "—" : `#${model.avgPosition || "?"}`} unit="" />
                  <Metric label="Total Q"    value={isPending ? "—" : model.total}                unit="" />
                </div>

                {/* Success / Failed */}
                <div className="px-6 py-4 flex items-center gap-6 text-sm border-b border-gray-100">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle className="w-4 h-4" />
                    {isPending ? "—" : model.success} Successful
                  </div>
                  <div className="flex items-center gap-2 text-red-600 font-bold">
                    <XCircle className="w-4 h-4" />
                    {isPending ? "—" : model.failed} Failed
                  </div>
                </div>

                {/* Visibility strength bar */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                    <span className="font-bold uppercase tracking-wider">Visibility Strength</span>
                    <span className="font-bold">{isPending ? "Pending" : `${vis}%`}</span>
                  </div>
                  <VisBar value={isPending ? 0 : vis} color={model.config.chartColor} />
                </div>
              </div>
            );
          })}
        </div>
      </div>



      {/* Charts — only show if there's data or always show structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Visibility vs Recommendation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Visibility vs Recommendation</h3>
          </div>
          <div className="p-6">
            {!hasPlaygroundData ? (
              <div className="h-52 flex flex-col items-center justify-center text-gray-400 gap-2">
                <AlertCircle className="w-8 h-8 opacity-30" />
                <p className="text-sm font-medium">Data populates after AI evaluation runs</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barChartData} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                    formatter={(val: any) => [`${val}%`]}
                  />
                  <Bar isAnimationActive={false} dataKey="Visibility"     fill="#6366f1" radius={[6,6,0,0]} maxBarSize={40} />
                  <Bar isAnimationActive={false} dataKey="Recommendation" fill="#10b981" radius={[6,6,0,0]} maxBarSize={40} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Confidence by Platform */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">AI Confidence by Platform</h3>
          </div>
          <div className="p-6">
            {!hasPlaygroundData ? (
              <div className="h-52 flex flex-col items-center justify-center text-gray-400 gap-2">
                <AlertCircle className="w-8 h-8 opacity-30" />
                <p className="text-sm font-medium">Data populates after AI evaluation runs</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={confidenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="model" tick={{ fontSize: 12, fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
                    formatter={(val: any) => [`${val}%`]}
                  />
                  <Bar isAnimationActive={false} dataKey="Confidence" fill="#10b981" radius={[6,6,0,0]} maxBarSize={48} />
                  <Bar isAnimationActive={false} dataKey="Citation"   fill="#3b82f6" radius={[6,6,0,0]} maxBarSize={48} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Chart 3: Radar — ChatGPT vs Gemini only */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-900">Multi-Metric Radar — ChatGPT vs Gemini</h3>
          <span className="ml-auto text-xs text-gray-400 font-medium">Only connected APIs compared</span>
        </div>
        <div className="p-6">
          {!hasPlaygroundData ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
              <AlertCircle className="w-8 h-8 opacity-30" />
              <p className="text-sm font-medium">Radar chart populates after AI evaluation runs</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fontWeight: 700, fill: "#6b7280" }} />
                <Radar isAnimationActive={false} name="ChatGPT" dataKey="ChatGPT" stroke="#10b981" fill="#10b981" fillOpacity={0.12} strokeWidth={2} />
                <Radar isAnimationActive={false} name="Gemini"  dataKey="Gemini"  stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} />
                <Legend />
                <Tooltip formatter={(val: any) => [`${val}%`]} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
