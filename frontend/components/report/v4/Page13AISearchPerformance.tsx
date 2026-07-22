"use client";

import {
  Search, Target, Trophy, XCircle, TrendingUp, BarChart2,
  PieChart as PieChartIcon, Activity, MapPin, ShoppingCart, Info, Clock
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend, LineChart, Line, AreaChart, Area } from "recharts";
import { useState } from "react";
import { analyzePrompt } from "@/lib/api";

interface Page13Props { prompts: any[]; scores: any; }

function StatCard({ label, value, sub, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className={`${bg} ${color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-3xl font-black text-gray-900">{value}</div>
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</div>
      {sub && <div className="text-xs font-semibold text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function Page13AISearchPerformance({ prompts, scores }: Page13Props) {
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

  const totalQueries = prompts?.length || 0;
  
  let won = 0, lost = 0, pending = 0;
  let gptConfSum = 0, geminiConfSum = 0, evaluated = 0;
  
  const intentScores: Record<string, number[]> = {
    Commercial: [],
    Informational: [],
    Purchase: [],
    Recommendation: [],
    Local: []
  };

  prompts?.forEach(p => {
    const pr = p.playground_results;
    if (!pr) {
      pending++;
      return;
    }
    
    evaluated++;
    let gpt = pr.model_probabilities?.ChatGPT || 0;
    let gem = pr.model_probabilities?.Gemini || 0;

    if (pr.live && (pr.live.openai || pr.live.gemini)) {
        const oValid = pr.live.openai?.validation?.valid;
        const oMention = (pr.live.openai?.brand_mentions || 0) > 0;
        gpt = pr.live.openai ? ((oValid && oMention) ? 100 : 0) : gpt;

        const gValid = pr.live.gemini?.validation?.valid;
        const gMention = (pr.live.gemini?.brand_mentions || 0) > 0;
        gem = pr.live.gemini ? ((gValid && gMention) ? 100 : 0) : gem;
    }

    const avgConf = (gpt + gem) / 2;
    
    gptConfSum += gpt;
    geminiConfSum += gem;

    if (avgConf >= 45) won++; else lost++;
    
    if (intentScores[p.intent]) intentScores[p.intent].push(avgConf);
    // map some intents
    if (p.intent === 'Problem Solving') intentScores['Informational'].push(avgConf);
  });

  const recommendationRate = evaluated > 0 ? Math.round((won / evaluated) * 100) : 0;
  
  // Calculate average rank based on average confidence (100 = Rank 1, 0 = Rank > 10)
  const avgOverallConf = evaluated > 0 ? (gptConfSum + geminiConfSum) / (evaluated * 2) : 0;
  const avgRank = evaluated > 0 ? Math.max(1, Math.round((100 - avgOverallConf) / 10 + 1)) : 0;

  const getAvg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const commercialVis = getAvg(intentScores.Commercial);
  const infoVis = getAvg(intentScores.Informational);
  const purchaseVis = getAvg(intentScores.Purchase);
  
  const citationRate = scores?.breakdown?.aeo?.signals?.entity_coverage?.percentage || 0;

  // Model Performance Data
  const modelPerfData = [
    { name: "ChatGPT", Score: evaluated > 0 ? Math.round(gptConfSum / evaluated) : 0, fill: "#10b981" },
    { name: "Gemini",  Score: evaluated > 0 ? Math.round(geminiConfSum / evaluated) : 0, fill: "#3b82f6" },
  ];

  // Intent Performance Data
  const intentPerfData = [
    { name: "Commercial", Score: commercialVis, fill: "#f59e0b" },
    { name: "Informational", Score: infoVis, fill: "#3b82f6" },
    { name: "Purchase", Score: purchaseVis, fill: "#ec4899" },
    { name: "Recommendation", Score: getAvg(intentScores.Recommendation), fill: "#10b981" },
    { name: "Local", Score: getAvg(intentScores.Local), fill: "#14b8a6" },
  ];

  const hasData = evaluated > 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 13
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">AI Search Performance</h1>
        <p className="text-xl text-gray-500">Your total query share, win/loss rates, and visibility across all generative AI search engines.</p>
      </div>

      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900">Evaluation Pending</h4>
              <p className="text-sm text-amber-700 mt-1">
                {pending} search queries are awaiting evaluation. The AI Search Performance metrics will populate automatically once the playground analysis completes.
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
                Evaluating ({progress}/{totalQueries})...
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

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Queries" value={totalQueries} icon={Search} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Queries Won" value={hasData ? won : "—"} icon={Trophy} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Queries Lost" value={hasData ? lost : "—"} icon={XCircle} color="text-red-600" bg="bg-red-50" />
        <StatCard label="Average Rank" value={hasData ? `#${avgRank}` : "—"} icon={TrendingUp} color="text-purple-600" bg="bg-purple-50" />
        <StatCard label="Recommendation Rate" value={hasData ? `${recommendationRate}%` : "—"} icon={Target} color="text-blue-600" bg="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visibility by Intent */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Visibility by Search Intent</h3>
            </div>
            {hasData && <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">{avgOverallConf.toFixed(1)}% Avg</span>}
          </div>
          <div className="p-4 flex-1">
            {hasData ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={intentPerfData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} width={100} />
                  <Tooltip cursor={{ fill: "#f9fafb" }} formatter={(v: any) => [`${v}%`, "Visibility"]} contentStyle={{ borderRadius: 10 }} />
                  <Bar isAnimationActive={false} dataKey="Score" radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {intentPerfData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">Awaiting query evaluation...</div>
            )}
          </div>
        </div>

        {/* Model Performance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">AI Model Performance</h3>
          </div>
          <div className="p-4 flex-1">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={modelPerfData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip cursor={{ fill: "#f9fafb" }} formatter={(v: any) => [`${v}%`, "Score"]} contentStyle={{ borderRadius: 10 }} />
                <Bar isAnimationActive={false} dataKey="Score" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {modelPerfData.map((e, i) => <Cell key={i} fill={e.locked ? "#e5e7eb" : e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Strategic Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-amber-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1">Commercial Visibility</h4>
          <p className="text-3xl font-black text-amber-600 mb-2">{hasData ? `${commercialVis}%` : "—"}</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Measures your brand's presence in high-intent commercial queries (e.g., "top agencies for X").
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-pink-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-4">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1">Purchase Visibility</h4>
          <p className="text-3xl font-black text-pink-600 mb-2">{hasData ? `${purchaseVis}%` : "—"}</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Measures recommendation rates for direct transactional queries where users are ready to buy.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Info className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1">Informational Visibility</h4>
          <p className="text-3xl font-black text-blue-600 mb-2">{hasData ? `${infoVis}%` : "—"}</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Measures how often AI cites your content for top-of-funnel research and problem-solving queries.
          </p>
        </div>
      </div>

    </div>
  );
}
