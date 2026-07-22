"use client";

import { Eye, Search, GitCompare, CheckCircle, ShoppingCart, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useState } from "react";
import { analyzePrompt } from "@/lib/api";

interface Page14Props { prompts: any[]; competitorsData: any; scores: any; }

const FUNNEL_STAGES = [
  { id: "awareness", label: "Awareness", desc: "User realizes a problem (Informational)", icon: Eye, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
  { id: "interest", label: "Interest", desc: "User searches for solutions (Problem Solving)", icon: Search, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-200" },
  { id: "research", label: "Research", desc: "User evaluates local options (Local)", icon: MapPinIcon, color: "text-teal-500", bg: "bg-teal-50", border: "border-teal-200" },
  { id: "comparison", label: "Comparison", desc: "User compares top providers (Recommendation)", icon: GitCompare, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
  { id: "decision", label: "Decision", desc: "User selects an agency (Commercial)", icon: CheckCircle, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
  { id: "purchase", label: "Purchase", desc: "User is ready to buy (Purchase)", icon: ShoppingCart, color: "text-pink-500", bg: "bg-pink-50", border: "border-pink-200" },
];

function MapPinIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
}

export default function Page14BuyerJourney({ prompts, competitorsData, scores }: Page14Props) {
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

  const intentMap: Record<string, number[]> = { Informational: [], "Problem Solving": [], Local: [], Recommendation: [], Commercial: [], Purchase: [] };
  
  prompts?.forEach(p => {
    const pr = p.playground_results;
    if (!pr) return;
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

    if (intentMap[p.intent]) intentMap[p.intent].push(avg);
  });

  const getAvg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const stageData = [
    { ...FUNNEL_STAGES[0], vis: getAvg(intentMap.Informational) },
    { ...FUNNEL_STAGES[1], vis: getAvg(intentMap["Problem Solving"]) },
    { ...FUNNEL_STAGES[2], vis: getAvg(intentMap.Local) },
    { ...FUNNEL_STAGES[3], vis: getAvg(intentMap.Recommendation) },
    { ...FUNNEL_STAGES[4], vis: getAvg(intentMap.Commercial) },
    { ...FUNNEL_STAGES[5], vis: getAvg(intentMap.Purchase) },
  ];

  const overallCitation = scores?.breakdown?.aeo?.signals?.entity_coverage?.percentage || 0;
  const topCompetitor = competitorsData?.competitors?.[0]?.company_name || "Major Competitors";
  const compMentions = competitorsData?.competitors?.reduce((acc: number, c: any) => acc + c.mentions, 0) || 0;

  const funnelChartData = stageData.map(s => ({
    name: s.label,
    Visibility: s.vis || 0,
    Opportunity: Math.max(0, 100 - (s.vis || 0))
  }));

  const hasData = prompts?.some(p => p.playground_results);
  const pending = prompts?.filter(p => !p.playground_results).length || 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 14
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Buyer Journey</h1>
        <p className="text-xl text-gray-500">How your AI visibility holds up as prospects move from research to purchase.</p>
      </div>

      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900">Evaluation Pending</h4>
              <p className="text-sm text-amber-700 mt-1">
                {pending} queries are awaiting LLM evaluation. Buyer journey drop-off and stage metrics will populate once complete.
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" /> Pipeline Visibility Drop-off
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={funnelChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="visColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 10 }} />
              <Area isAnimationActive={false} type="monotone" dataKey="Visibility" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#visColor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[31px] md:before:ml-[39px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-100 before:via-purple-100 before:to-pink-100">
        {stageData.map((stage, i) => {
          const Icon = stage.icon;
          const recRate = stage.vis > 0 ? (stage.vis > 50 ? "High" : stage.vis > 20 ? "Medium" : "Low") : "Zero";
          const oppScore = 100 - stage.vis;
          const compThreat = stage.vis < 40 ? "High Threat" : "Low Threat";

          return (
            <div key={stage.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-black text-sm">
                {i + 1}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${stage.bg} ${stage.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{stage.label}</h3>
                    <p className="text-[10px] uppercase font-bold text-gray-400">{stage.desc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Visibility</p>
                    <p className="font-black text-indigo-600 text-lg">{stage.vis}%</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Recommendation</p>
                    <p className="font-black text-gray-800 text-sm mt-1">{recRate}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Competitor Threat</span>
                    <span className={`font-bold ${compThreat === "High Threat" ? "text-red-500" : "text-emerald-500"}`}>{compThreat}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Citation Coverage</span>
                    <span className="font-bold text-gray-700">{overallCitation}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                    <span className="text-gray-900 font-bold">Lost Opportunity Score</span>
                    <span className="font-black text-amber-500">{oppScore}/100</span>
                  </div>
                </div>
                
                {oppScore > 70 && (
                  <div className="mt-4 p-2 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-800 font-medium leading-relaxed">
                      AI is highly likely to recommend {topCompetitor} during this critical buyer stage. Immediate structural optimization required.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
