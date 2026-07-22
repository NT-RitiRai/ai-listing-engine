"use client";

import {
  Compass, BarChart2, Zap, Target, Hexagon, Shield, Network,
  Activity, Star, LayoutGrid, CheckCircle, TrendingUp
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

interface Page12Props { competitorsData: any; }

const METRICS = [
  { id: "entity", label: "Entity Strength", icon: Hexagon },
  { id: "authority", label: "Authority (Topical)", icon: Shield },
  { id: "trust", label: "Trust & EEAT", icon: Star },
  { id: "content", label: "Content Depth", icon: LayoutGrid },
  { id: "commercial", label: "Commercial Setup", icon: BarChart2 },
];

export default function Page12CompetitorComparison({ competitorsData }: Page12Props) {
  const comp = competitorsData || {};
  const radarDims = comp.insight_analysis?.radar_dimensions || {};
  const targetBiz = radarDims.target_business || { entity_strength: 30, content_depth: 30, topical_authority: 30, trust_eeat: 30, commercial_intent: 30 };
  const competitors = radarDims.competitors || [];

  const topComp = competitors[0] || { company: "Top Competitor", entity_strength: 85, content_depth: 85, topical_authority: 85, trust_eeat: 85, commercial_intent: 85 };

  const comparisonMatrix = METRICS.map(m => {
    let targetScore = 0;
    let compScore = 0;

    switch(m.id) {
      case "entity": targetScore = targetBiz.entity_strength; compScore = topComp.entity_strength; break;
      case "content": targetScore = targetBiz.content_depth; compScore = topComp.content_depth; break;
      case "authority": targetScore = targetBiz.topical_authority; compScore = topComp.topical_authority; break;
      case "trust": targetScore = targetBiz.trust_eeat; compScore = topComp.trust_eeat; break;
      case "commercial": targetScore = targetBiz.commercial_intent; compScore = topComp.commercial_intent; break;
      default: targetScore = 0; compScore = 0;
    }

    const gap = compScore - targetScore;
    
    return {
      ...m,
      targetScore,
      compScore,
      gap,
      status: gap > 30 ? "Critical Gap" : gap > 15 ? "Moderate Gap" : gap > 0 ? "Slight Gap" : "You Lead",
    };
  });

  const radarData = comparisonMatrix.map(m => ({
    subject: m.label,
    "Your Business": m.targetScore,
    [topComp.company]: m.compScore,
  }));

  const getColorForScore = (score: number) => {
    if (score >= 80) return "bg-emerald-500 text-emerald-50 border-emerald-600";
    if (score >= 60) return "bg-blue-500 text-blue-50 border-blue-600";
    if (score >= 40) return "bg-amber-500 text-amber-50 border-amber-600";
    return "bg-red-500 text-red-50 border-red-600";
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 12
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Competitor Comparison</h1>
        <p className="text-xl text-gray-500">A head-to-head analysis of AI visibility and entity strength against your top competitor.</p>
      </div>

      {/* Hero Strip */}
      <div className="bg-gradient-to-br from-indigo-900 via-fuchsia-900 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-fuchsia-400/20 rounded-full blur-3xl" />
        
        <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 relative z-10">Overall Win/Loss Ratio</p>
        
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Metrics Evaluated", value: "10", color: "text-white" },
            { label: "You Lead", value: comparisonMatrix.filter(m => m.gap <= 0).length, color: "text-emerald-300" },
            { label: "Competitor Leads", value: comparisonMatrix.filter(m => m.gap > 0).length, color: "text-fuchsia-300" },
            { label: "Avg Deficit", value: `-${Math.round(comparisonMatrix.reduce((a, b) => a + (b.gap > 0 ? b.gap : 0), 0) / 10)}%`, color: "text-red-300" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
              <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-white/60 text-xs font-bold uppercase tracking-wider mt-2 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Radar Comparison */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-900">Head-to-Head Radar</h3>
        </div>
        <div className="p-4 bg-gray-50/30">
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 700, fill: "#4b5563" }} />
              <Radar isAnimationActive={false} name="Your Business" dataKey="Your Business" stroke="#ec4899" fill="#ec4899" fillOpacity={0.4} strokeWidth={3} />
              <Radar isAnimationActive={false} name={topComp.company} dataKey={topComp.company} stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 14, fontWeight: 600, marginTop: 10 }} />
              <RechartsTooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparative Heatmap Matrix */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-900">Comparative Heatmap Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 border-b border-r border-gray-100 font-bold text-gray-500 text-xs uppercase tracking-wider w-1/3">Evaluation Metric</th>
                <th className="p-4 border-b border-r border-gray-100 font-bold text-gray-900 text-center">Your Business</th>
                <th className="p-4 border-b border-r border-gray-100 font-bold text-gray-900 text-center">{topComp.company}</th>
                <th className="p-4 border-b border-gray-100 font-bold text-gray-500 text-xs uppercase tracking-wider text-center">Delta / Status</th>
              </tr>
            </thead>
            <tbody>
              {comparisonMatrix.map((m, i) => {
                const Icon = m.icon;
                return (
                  <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 border-r border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-bold text-sm text-gray-900">{m.label}</span>
                      </div>
                    </td>
                    <td className="p-4 border-r border-gray-100 text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border-2 font-black text-lg shadow-sm ${getColorForScore(m.targetScore)}`}>
                        {m.targetScore}
                      </div>
                    </td>
                    <td className="p-4 border-r border-gray-100 text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border-2 font-black text-lg shadow-sm ${getColorForScore(m.compScore)}`}>
                        {m.compScore}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {m.gap > 0 ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-red-600 font-black text-lg">-{m.gap}</span>
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full mt-1">{m.status}</span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-emerald-600 font-black text-lg">+{Math.abs(m.gap)}</span>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full mt-1">You Lead</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
