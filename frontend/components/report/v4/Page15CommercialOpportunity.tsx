"use client";

import {
  TrendingUp, Users, DollarSign, Activity, AlertTriangle, 
  Target, PieChart as PieChartIcon, Zap, EyeOff, MinusCircle, 
  ArrowUpRight, Clock
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from "recharts";
import { useState, useEffect, useRef } from "react";
import { analyzePrompt } from "@/lib/api";

interface Page15Props { prompts: any[]; scores: any; }

export default function Page15CommercialOpportunity({ prompts, scores }: Page15Props) {
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
    window.location.reload();
  };

  const hasAnyPlaygroundData = prompts && prompts.some(p => p.playground_results);

  useEffect(() => {
    if (!hasAnyPlaygroundData && !hasStartedAutoEval.current && prompts && prompts.length > 0) {
      hasStartedAutoEval.current = true;
      handleRunEvaluation();
    }
  }, [hasAnyPlaygroundData, prompts]);

  // Extract real visibility metrics
  let commercialEvaluated = 0, commercialWon = 0, commercialPending = 0;
  
  prompts?.forEach(p => {
    if (p.intent === "Commercial" || p.intent === "Purchase" || p.intent === "Recommendation") {
      const pr = p.playground_results;
      if (pr) {
        commercialEvaluated++;
        let avg = ((pr.model_probabilities?.ChatGPT || 0) + (pr.model_probabilities?.Gemini || 0)) / 2;
        
        if (pr.live && (pr.live.openai || pr.live.gemini)) {
            const oValid = pr.live.openai?.validation?.valid;
            const oMention = (pr.live.openai?.brand_mentions || 0) > 0;
            const gValid = pr.live.gemini?.validation?.valid;
            const gMention = (pr.live.gemini?.brand_mentions || 0) > 0;
            const gptConf = (oValid && oMention) ? 100 : 0;
            const gemConf = (gValid && gMention) ? 100 : 0;
            
            if (pr.live.openai && pr.live.gemini) avg = (gptConf + gemConf) / 2;
            else if (pr.live.openai) avg = gptConf;
            else if (pr.live.gemini) avg = gemConf;
        }

        if (avg >= 45) commercialWon++;
      } else {
        commercialPending++;
      }
    }
  });

  const commVisRate = commercialEvaluated > 0 ? (commercialWon / commercialEvaluated) : 0;
  const lostVisRate = 1 - commVisRate;
  
  const aiScore = scores?.ai_readiness_score || 0;
  const lostMarketSharePct = Math.max(0, 100 - aiScore);

  const missedRecs = commercialEvaluated - commercialWon;

  // Chart Data
  const marketShareData = [
    { name: "Captured AI Market Share", value: aiScore, fill: "#10b981" },
    { name: "Lost Market Share", value: lostMarketSharePct, fill: "#f43f5e" }
  ];

  const visibilityData = [
    { name: "Commercial Visibility", value: Math.round(commVisRate * 100), fill: "#3b82f6" },
    { name: "Lost Recommendations", value: Math.round(lostVisRate * 100), fill: "#f59e0b" }
  ];

  const hasData = commercialEvaluated > 0;
  const pending = commercialPending;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 15
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Growth Opportunities</h1>
        <p className="text-xl text-gray-500">The projected business upside of closing the AI visibility gap.</p>
      </div>

      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900">Evaluation Pending</h4>
              <p className="text-sm text-amber-700 mt-1">
                {pending} queries are awaiting LLM evaluation. Commercial opportunity metrics will populate once complete.
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
                Evaluating ({progress}/{prompts?.length || 0})...
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

      {/* Notice */}
      {hasData && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-start gap-3">
          <InfoIcon className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-800 leading-relaxed font-medium">
            <strong>Commercial Analysis:</strong> Based on evaluating {commercialEvaluated} high-intent commercial and purchase queries against your business profile across ChatGPT and Gemini.
          </p>
        </div>
      )}

      {/* Hero Uplift Pipeline */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />
        
        <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-6 relative z-10">Commercial Pipeline Health</p>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
            <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
            <div className="text-4xl font-black text-white">{commercialEvaluated}</div>
            <div className="text-white/60 text-xs font-bold uppercase tracking-wider mt-2">Commercial Queries Tested</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
            <Users className="w-6 h-6 text-teal-400 mx-auto mb-3" />
            <div className="text-4xl font-black text-white">{commercialWon}</div>
            <div className="text-white/60 text-xs font-bold uppercase tracking-wider mt-2">Captured Recommendations</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2"><Zap className="w-4 h-4 text-emerald-300" /></div>
            <DollarSign className="w-6 h-6 text-emerald-300 mx-auto mb-3" />
            <div className="text-4xl font-black text-white">{Math.round(commVisRate * 100)}%</div>
            <div className="text-white/60 text-xs font-bold uppercase tracking-wider mt-2">Commercial Win Rate</div>
          </div>
        </div>
      </div>

      {/* The Losses */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" /> Current Commercial Deficits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LossCard label="Missed Opportunities" value={missedRecs} icon={MinusCircle} color="text-red-600" bg="bg-red-50" border="border-red-200" />
          <LossCard label="Lost Commercial Visibility" value={`${Math.round(lostVisRate * 100)}%`} icon={EyeOff} color="text-amber-600" bg="bg-amber-50" border="border-amber-200" />
          <LossCard label="Lost Market Share" value={`${lostMarketSharePct}%`} icon={PieChartIcon} color="text-fuchsia-600" bg="bg-fuchsia-50" border="border-fuchsia-200" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">AI Market Share Breakdown</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center">
            <div className="h-48 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie isAnimationActive={false} data={marketShareData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                    {marketShareData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => [`${value}%`, "Market Share"]} contentStyle={{ borderRadius: 8 }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Commercial Visibility Gap</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center">
            <div className="h-48 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie isAnimationActive={false} data={visibilityData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                    {visibilityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => [`${value}%`, "Visibility"]} contentStyle={{ borderRadius: 8 }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* ROI */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">ROI Potential</h3>
          <p className="text-sm text-gray-500">The expected return on investment by implementing the Action Plan (Module 18).</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-200">
          <ArrowUpRight className="w-6 h-6" />
          <div className="text-xl font-black">Very High</div>
        </div>
      </div>

    </div>
  );
}

function LossCard({ label, value, icon: Icon, color, bg, border }: any) {
  return (
    <div className={`bg-white rounded-2xl border ${border} p-5 shadow-sm`}>
      <div className={`${bg} ${color} w-8 h-8 rounded-lg flex items-center justify-center mb-3`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function InfoIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
}
