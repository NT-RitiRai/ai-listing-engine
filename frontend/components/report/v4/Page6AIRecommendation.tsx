"use client";

import {
  Star, CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown,
  MessageCircle, Sparkles, FileText, Target, Clock, ThumbsUp, ThumbsDown,
  Zap, BarChart2, Activity, Link, Layers, ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, RadialBarChart, RadialBar
} from "recharts";
import { analyzePrompt } from "@/lib/api";

interface Page6Props {
  prompts: any[];
  intelligence: any;
  recommendations: any[];
}

function StatCard({ label, value, sub, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className={`${bg} ${color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-black text-gray-900">{value}</div>
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function PageRow({ url, badge, badgeColor, reason, priority }: {
  url: string; badge: string; badgeColor: string; reason?: string; priority?: string;
}) {
  const [open, setOpen] = useState(false);
  const slug = url.replace(/https?:\/\/[^/]+/, "") || "/";
  const domain = url.match(/https?:\/\/([^/]+)/)?.[1] || url;
  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/60 cursor-pointer" onClick={() => setOpen(!open)}>
        <Link className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{slug}</p>
          <p className="text-xs text-gray-400">{domain}</p>
        </div>
        {priority && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
            priority === "Critical" ? "bg-red-50 text-red-700 border-red-200" :
            priority === "High"     ? "bg-orange-50 text-orange-700 border-orange-200" :
                                      "bg-gray-50 text-gray-500 border-gray-200"
          }`}>{priority}</span>
        )}
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeColor}`}>{badge}</span>
        {reason && (open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />)}
      </div>
      {open && reason && (
        <div className="px-5 pb-3 pt-0">
          <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-3">{reason}</p>
        </div>
      )}
    </div>
  );
}

export default function Page6AIRecommendation({ prompts, intelligence, recommendations }: Page6Props) {
  const services = intelligence?.services || [];
  const topics   = intelligence?.primary_topics || [];

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

  // ── Aggregate from playground results ─────────────────────────────────────
  let recommendedCount = 0, missedCount = 0, pendingCount = 0;
  const gptScores: number[] = [], geminiScores: number[] = [];
  const missedPrompts: { text: string; intent: string; reason: string }[] = [];
  const recommendedPrompts: { text: string; intent: string; confidence: number }[] = [];
  const evidencePages: { url: string; confidence: string; similarity: number; reason: string }[] = [];
  const promptBarData: { name: string; full: string; ChatGPT: number; Gemini: number }[] = [];

  prompts.forEach(p => {
    const pr = p.playground_results;
    if (!pr) { pendingCount++; return; }

    const live = pr.live;
    let gpt    = pr.model_probabilities?.ChatGPT || 0;
    let gemini = pr.model_probabilities?.Gemini  || 0;

    if (live && (live.openai || live.gemini)) {
      const oValid = live.openai?.validation?.valid;
      const oMention = (live.openai?.brand_mentions || 0) > 0;
      gpt = live.openai ? ((oValid && oMention) ? 100 : 0) : gpt;

      const gValid = live.gemini?.validation?.valid;
      const gMention = (live.gemini?.brand_mentions || 0) > 0;
      gemini = live.gemini ? ((gValid && gMention) ? 100 : 0) : gemini;
    }

    const conf   = Math.round((gpt + gemini) / 2);

    gptScores.push(gpt);
    geminiScores.push(gemini);
    promptBarData.push({
      name: p.prompt_text.length > 22 ? p.prompt_text.slice(0, 20) + "…" : p.prompt_text,
      full: p.prompt_text,
      ChatGPT: gpt,
      Gemini:  gemini,
    });

    if (conf > 45) {
      recommendedCount++;
      recommendedPrompts.push({ text: p.prompt_text, intent: p.intent || "General", confidence: conf });
    } else {
      missedCount++;
      missedPrompts.push({
        text:   p.prompt_text,
        intent: p.intent || "General",
        reason: pr.model_analysis?.ChatGPT?.weakness || pr.model_analysis?.Gemini?.weakness || "Content coverage insufficient for this query intent.",
      });
    }

    // Collect evidence pages (recommended pages from playground)
    (pr.evidence_panel || []).forEach((ev: any) => {
      if (!evidencePages.find(e => e.url === ev.page_url)) {
        evidencePages.push({ url: ev.page_url, confidence: ev.confidence || "low", similarity: ev.similarity_score || 0, reason: ev.reason || "" });
      }
    });
  });

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
  const gptAvg    = avg(gptScores);
  const geminiAvg = avg(geminiScores);
  const overallConf = avg([...gptScores, ...geminiScores]);
  const totalEvaluated = recommendedCount + missedCount;
  const recommendationRate = totalEvaluated > 0 ? Math.round((recommendedCount / totalEvaluated) * 100) : 0;
  const hasData = totalEvaluated > 0;

  // ── Pages: ignored = affected_pages in recommendations ───────────────────
  const ignoredPageMap: Record<string, { url: string; priority: string; reason: string }> = {};
  recommendations.forEach((r: any) => {
    (r.affected_pages || []).forEach((url: string) => {
      if (!ignoredPageMap[url] || r.priority_score < (ignoredPageMap[url].priority === "Critical" ? 1 : 2)) {
        ignoredPageMap[url] = {
          url,
          priority: r.priority || "Medium",
          reason: r.business_impact || r.problem || "AI models de-prioritize this page due to missing signals.",
        };
      }
    });
  });

  const ignoredPages  = Object.values(ignoredPageMap).sort((a, b) =>
    (a.priority === "Critical" ? 0 : a.priority === "High" ? 1 : 2) -
    (b.priority === "Critical" ? 0 : b.priority === "High" ? 1 : 2)
  );

  // Recommended pages = evidence pages with high/medium confidence
  const recommendedPages = evidencePages
    .filter(e => e.confidence === "high" || e.confidence === "medium")
    .sort((a, b) => b.similarity - a.similarity);

  // ── Recommended vs ignored services ────────────────────────────────────────
  const serviceCount = services.length || 0;
  const recServicesCount = Math.round(serviceCount * (recommendationRate / 100));
  const recommendedServices = services.slice(0, recServicesCount);
  const ignoredServices     = services.slice(recServicesCount);

  // ── Recommendation reasons from recommendations array ──────────────────────
  const recReasons = recommendations.slice(0, 6).map((r: any) => ({
    text: r.technical_cause || r.problem,
    impact: r.estimated_visibility_increase || "",
    priority: r.priority || "Medium",
    category: r.category?.toUpperCase() || "GEO",
  })).filter(r => r.text);

  // ── Intent chart data ──────────────────────────────────────────────────────
  const intentGroup: Record<string, number[]> = {};
  [...recommendedPrompts, ...missedPrompts].forEach((p, i) => {
    const conf = i < recommendedPrompts.length ? recommendedPrompts[i].confidence : 0;
    if (!intentGroup[p.intent]) intentGroup[p.intent] = [];
    intentGroup[p.intent].push(conf);
  });
  const intentData = Object.entries(intentGroup).map(([intent, scores]) => ({
    intent: intent.length > 12 ? intent.slice(0,11)+"…" : intent,
    Rate: avg(scores),
    fill: ["#6366f1","#10b981","#f59e0b","#3b82f6","#ec4899"][Object.keys(intentGroup).indexOf(intent) % 5],
  }));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 6
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">AI Recommendations</h1>
        <p className="text-xl text-gray-500">How often, where, and why AI models recommend your business — and where they don't.</p>
      </div>

      {/* Pending Banner */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900">AI Playground Evaluation Pending</h4>
              <p className="text-amber-700 text-sm mt-1">
                {pendingCount} queries awaiting OpenAI + Gemini evaluation. Recommendation Rate, Frequency, Confidence, and page data will populate automatically once complete.
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
                <Activity className="w-4 h-4" />
                Run Live Evaluation
              </>
            )}
          </button>
        </div>
      )}

      {/* Hero Strip */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
        <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-6 relative z-10">Recommendation Overview</p>
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          {[
            { label: "Recommendation Rate",    value: `${recommendationRate}%`, color: "text-emerald-300" },
            { label: "Recommended Queries",     value: recommendedCount || "—",  color: "text-green-300"   },
            { label: "Missed Opportunities",    value: missedCount || "—",       color: "text-red-400"     },
            { label: "ChatGPT Confidence",      value: gptAvg ? `${gptAvg}%` : "—", color: "text-emerald-400" },
            { label: "Gemini Confidence",       value: geminiAvg ? `${geminiAvg}%` : "—", color: "text-blue-300" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-white/60 text-xs font-bold uppercase tracking-wider mt-1 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation Frequency & Confidence by Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Recommendation Frequency & Confidence</h3>
            <span className="ml-auto text-xs text-gray-400">ChatGPT + Gemini only</span>
          </div>
          <div className="p-6 space-y-6">
            {[
              { model: "ChatGPT", score: gptAvg, color: "#10b981", icon: MessageCircle, iconColor: "text-emerald-500" },
              { model: "Gemini",  score: geminiAvg, color: "#3b82f6", icon: Sparkles,     iconColor: "text-blue-500"    },
            ].map(m => {
              const Icon = m.icon;
              return (
                <div key={m.model}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${m.iconColor}`} />
                      <span className="text-sm font-bold text-gray-900">{m.model}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black" style={{ color: m.color }}>{hasData ? `${m.score}%` : "—"}</span>
                      <span className="text-xs text-gray-400 ml-1">confidence</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="h-3 rounded-full transition-all duration-1000" style={{ width: `${hasData ? m.score : 0}%`, backgroundColor: m.color }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {hasData
                      ? `Model recommended in ${m.score > 50 ? "majority" : "minority"} of evaluated queries`
                      : "Awaiting evaluation"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendation by Intent */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Recommendation Rate by Intent</h3>
          </div>
          <div className="p-4">
            {intentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={intentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="intent" tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis domain={[0,100]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 10 }} formatter={(v:any) => [`${v}%`]} />
                  <Bar isAnimationActive={false} dataKey="Rate" radius={[6,6,0,0]} maxBarSize={32}>
                    {intentData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm gap-2">
                <Clock className="w-5 h-5 opacity-40" /> Awaiting evaluation
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Per-Prompt Recommendation Chart */}
      {promptBarData.length > 0 && hasData && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Recommendation Confidence per Prompt</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={promptBarData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600 }} />
                <YAxis domain={[0,100]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 10 }} formatter={(v:any) => [`${v}%`]} labelFormatter={(l, p) => p[0]?.payload?.full || l} />
                <Bar isAnimationActive={false} dataKey="ChatGPT" fill="#10b981" radius={[4,4,0,0]} maxBarSize={24} />
                <Bar isAnimationActive={false} dataKey="Gemini"  fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={24} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recommended Services vs Ignored Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-900">Recommended Services</h3>
            <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-200 px-2.5 py-0.5 rounded-full">{recommendedServices.length}</span>
          </div>
          <div className="p-5 space-y-2">
            {recommendedServices.length > 0 ? recommendedServices.map((svc: string, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-semibold text-emerald-900">{svc}</span>
                <span className="ml-auto text-xs text-emerald-600 font-bold">AI Recognized</span>
              </div>
            )) : (
              <p className="text-sm text-gray-400 italic py-4 text-center">Awaiting AI evaluation to classify recommended services.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <ThumbsDown className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-900">Ignored Services</h3>
            <span className="ml-auto text-xs font-bold text-red-700 bg-red-200 px-2.5 py-0.5 rounded-full">{ignoredServices.length}</span>
          </div>
          <div className="p-5 space-y-2">
            {ignoredServices.length > 0 ? ignoredServices.map((svc: string, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm font-semibold text-red-900">{svc}</span>
                <span className="ml-auto text-xs text-red-600 font-bold">Not Cited</span>
              </div>
            )) : (
              <p className="text-sm text-gray-500 italic py-4 text-center">All services are being recommended by AI.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Pages vs Ignored Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Pages */}
        <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">Recommended Pages</h3>
            <span className="ml-auto text-xs font-bold text-blue-700 bg-blue-200 px-2.5 py-0.5 rounded-full">{recommendedPages.length}</span>
          </div>
          {recommendedPages.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recommendedPages.map((page, i) => (
                <PageRow
                  key={i}
                  url={page.url}
                  badge={`${page.similarity}% match`}
                  badgeColor="bg-blue-50 text-blue-700 border border-blue-200"
                  reason={page.reason}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">Page-level recommendation data populates after AI evaluation</p>
            </div>
          )}
        </div>

        {/* Ignored Pages */}
        <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-amber-900">Ignored Pages</h3>
            <span className="ml-auto text-xs font-bold text-amber-700 bg-amber-200 px-2.5 py-0.5 rounded-full">{ignoredPages.length}</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {ignoredPages.map((page, i) => (
              <PageRow
                key={i}
                url={page.url}
                badge="Ignored by AI"
                badgeColor="bg-amber-50 text-amber-700 border border-amber-200"
                priority={page.priority}
                reason={page.reason}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Missed Opportunities */}
      {missedPrompts.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-900">Missed Opportunities</h3>
            <span className="ml-2 px-2.5 py-0.5 bg-red-200 text-red-800 text-xs font-black rounded-full">{missedPrompts.length}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {missedPrompts.map((p, i) => (
              <div key={i} className="px-5 py-4 hover:bg-gray-50/60">
                <div className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">"{p.text}"</p>
                    <span className="text-xs text-indigo-600 font-bold">{p.intent}</span>
                    {p.reason && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{p.reason}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Reasons */}
      {recReasons.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Recommendation Reasons — Root Cause Analysis</h3>
          </div>
          <div className="p-5 space-y-3">
            {recReasons.map((r, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                <div className="flex-1">
                  <p className="text-sm text-indigo-900 font-semibold leading-relaxed">{r.text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      r.priority === "Critical" ? "bg-red-50 text-red-700 border-red-200" :
                      r.priority === "High"     ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                  "bg-gray-50 text-gray-500 border-gray-200"
                    }`}>{r.priority}</span>
                    {r.impact && <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{r.impact} potential uplift</span>}
                    <span className="text-xs text-gray-400 font-medium">{r.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
