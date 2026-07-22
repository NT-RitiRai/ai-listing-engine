"use client";

import {
  Users, Trophy, Target, Shield, AlertTriangle, Lightbulb,
  Crosshair, TrendingUp, Link, Compass, Activity, MapPin, Zap
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Page11Props { competitorsData: any; }

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-gray-500 w-24 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-black text-gray-700 w-8 text-right">{value}</span>
    </div>
  );
}

export default function Page11CompetitorIntelligence({ competitorsData }: Page11Props) {
  const comp = competitorsData || {};
  const competitorsList = (comp.insight_analysis?.why_competitors_win || []).length > (comp.competitors || []).length ? comp.insight_analysis.why_competitors_win : (comp.competitors || []);
  const insights = comp.insight_analysis || {};
  
  const whyCompetitorsWin = insights.why_competitors_win || [];
  const radarDims = insights.radar_dimensions || {};
  const intentMatrix = insights.intent_matrix || [];

  const targetBiz = radarDims.target_business || {
    entity_strength: 0, content_depth: 0, topical_authority: 0, trust_eeat: 0, commercial_intent: 0
  };

  // Build Radar Chart Data (Target vs Top 2 Competitors)
  const radarData = [
    { subject: "Entity Strength",     Target: targetBiz.entity_strength,   Comp1: 0, Comp2: 0 },
    { subject: "Content Depth",       Target: targetBiz.content_depth,     Comp1: 0, Comp2: 0 },
    { subject: "Topical Authority",   Target: targetBiz.topical_authority, Comp1: 0, Comp2: 0 },
    { subject: "Trust & EEAT",        Target: targetBiz.trust_eeat,        Comp1: 0, Comp2: 0 },
    { subject: "Commercial Coverage", Target: targetBiz.commercial_intent, Comp1: 0, Comp2: 0 },
  ];

  const radarComps = radarDims.competitors || [];
  let comp1Name = "Competitor 1", comp2Name = "Competitor 2";

  if (radarComps.length > 0) {
    comp1Name = radarComps[0].company;
    radarData[0].Comp1 = radarComps[0].entity_strength;
    radarData[1].Comp1 = radarComps[0].content_depth;
    radarData[2].Comp1 = radarComps[0].topical_authority;
    radarData[3].Comp1 = radarComps[0].trust_eeat;
    radarData[4].Comp1 = radarComps[0].commercial_intent;
  }
  if (radarComps.length > 1) {
    comp2Name = radarComps[1].company;
    radarData[0].Comp2 = radarComps[1].entity_strength;
    radarData[1].Comp2 = radarComps[1].content_depth;
    radarData[2].Comp2 = radarComps[1].topical_authority;
    radarData[3].Comp2 = radarComps[1].trust_eeat;
    radarData[4].Comp2 = radarComps[1].commercial_intent;
  }

  // Build Intent Bar Chart Data
  const intentChartData = intentMatrix.map((m: any) => ({
    name: m.company.length > 12 ? m.company.slice(0, 11) + "…" : m.company,
    full: m.company,
    Commercial: m.scores.Commercial || 0,
    Informational: m.scores.Informational || 0,
    Location: m.scores.Location || 0,
  })).slice(0, 5); // top 5 only

  const totalMentions = competitorsList.reduce((acc: number, c: any) => acc + (c.mentions || 0), 0);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 11
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Competitor Analysis</h1>
        <p className="text-xl text-gray-500">Who AI recommends instead of you, why they win, and how to outrank them.</p>
      </div>

      {/* Hero Strip */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        
        <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 relative z-10">AI Competitor Landscape</p>
        
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Detected Competitors", value: competitorsList.length, color: "text-white" },
            { label: "Total AI Mentions", value: totalMentions, color: "text-indigo-300" },
            { label: "Lost Opportunity Rate", value: (insights.opportunity_analysis?.lost_recommendations?.match(/\d+%/) || ["22%"])[0], color: "text-blue-300" },
            { label: "Avg Trust Score", value: Math.round(radarComps.reduce((a:any, b:any) => a + b.trust_eeat, 0) / (radarComps.length || 1)), color: "text-indigo-200" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
              <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-white/60 text-xs font-bold uppercase tracking-wider mt-2 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why They Win vs Why We Lost */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Why Competitors Win */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-900">Why Competitors Win</h3>
          </div>
          <div className="p-5 flex-1 space-y-4">
            {whyCompetitorsWin.map((w: any, i: number) => (
              <div key={i} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{w.company}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{w.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why We Lost */}
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-900">Why You Lost The Citation</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center bg-red-50/30">
            <p className="text-sm text-red-900 font-medium leading-relaxed">
              {insights.why_we_lost || "You are currently being overlooked by AI search engines for commercial queries due to a lack of recognition, weak entity trust signals, or insufficient digital footprint compared to competitors."}
            </p>
            {insights.opportunity_analysis && (
              <div className="mt-5 p-4 bg-white rounded-xl border border-red-100">
                <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Priority Recovery Plan</h4>
                <ul className="space-y-2">
                  {(insights.opportunity_analysis.priority_improvements || []).map((imp: string, i: number) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                      <Target className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Radar Chart & Intent Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitive Radar */}
        <div className="break-inside-avoid">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Competitive Dimension Radar</h3>
            </div>
            <div className="p-4 bg-gray-50/30">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: "#4b5563" }} />
                  <Radar isAnimationActive={false} name="You" dataKey="Target" stroke="#ec4899" fill="#ec4899" fillOpacity={0.2} strokeWidth={3} />
                  <Radar isAnimationActive={false} name={comp1Name} dataKey="Comp1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                  {radarComps.length > 1 && <Radar isAnimationActive={false} name={comp2Name} dataKey="Comp2" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />}
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Intent Coverage Bar Chart */}
        <div className="break-inside-avoid">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Competitor Intent Coverage</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={intentChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: "#f9fafb" }} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600, marginTop: 10 }} />
                  <Bar isAnimationActive={false} dataKey="Commercial" name="Commercial Intent" fill="#f59e0b" radius={[4,4,0,0]} maxBarSize={24} />
                  <Bar isAnimationActive={false} dataKey="Informational" name="Informational Intent" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={24} />
                  <Bar isAnimationActive={false} dataKey="Location" name="Local Intent" fill="#10b981" radius={[4,4,0,0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Full Competitor Details List */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" /> Top AI-Recommended Competitors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {competitorsList.map((c: any, i: number) => {
            const cName = c.company_name || c.company;
            const m = intentMatrix.find((im: any) => im.company === cName);
            const r = radarComps.find((rc: any) => rc.company === cName);
            const leader = (comp.leaderboard || []).find((l: any) => l.name === cName);
            
            const commercialScore = m?.scores?.Commercial || 0;
            const trustScore      = r?.trust_eeat || 0;
            const entityScore     = r?.entity_strength || 0;
            
            const cMentions = c.mentions || leader?.mentions || 0;
            const cScore = c.final_score || Math.min(Math.round(commercialScore * 0.4 + trustScore * 0.6), 100) || 75;

            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{cName}</h4>
                    <p className="text-xs text-gray-400 truncate">{(c.category === "discovered_via_search" || !c.category) ? "Discovered via AI Search Results" : "Known Competitor"}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-indigo-600">{Math.round(cScore)}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Similarity Score</div>
                  </div>
                </div>
                
                <div className="p-5 space-y-4">
                  {/* Stats Row */}
                  <div className="flex gap-4">
                    <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                      <div className="text-blue-700 font-black text-lg">{cMentions}</div>
                      <div className="text-blue-600 text-[10px] font-bold uppercase tracking-wider mt-0.5">AI Mentions</div>
                    </div>
                    <div className="flex-1 bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                      <div className="text-amber-700 font-black text-lg">{trustScore}%</div>
                      <div className="text-amber-600 text-[10px] font-bold uppercase tracking-wider mt-0.5">Trust / EEAT</div>
                    </div>
                  </div>

                  {/* Dimension Bars */}
                  <div className="space-y-2 pt-2">
                    <MetricBar label="Entity Strength" value={entityScore} color="#6366f1" />
                    <MetricBar label="Commercial Coverage" value={commercialScore} color="#f59e0b" />
                    <MetricBar label="Location Coverage" value={m?.scores?.Location || 0} color="#10b981" />
                  </div>

                  {/* Why they compete */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5 text-indigo-500" /> AI Perspective
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{c.why_it_competes}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
