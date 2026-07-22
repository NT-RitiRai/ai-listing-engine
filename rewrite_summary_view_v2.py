import os

path = r"c:\Users\ASUS\Downloads\ai-listing-engine\frontend\components\report\v4\AISummaryReportView.tsx"

content = """"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { generateSummaryReport, getSummaryReport, getScores, getCompetitors, getPrompts, getRecommendations, getIntelligence } from "@/lib/api";
import { Download, Sparkles, Building2, Lightbulb, Compass, Target, Map, Activity, ArrowRight, ShieldCheck, Cpu, Tag, Briefcase, Box, MapPin, Crosshair, AlertTriangle } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

interface AISummaryReportViewProps {
  analysisId: string;
}

export default function AISummaryReportView({ analysisId }: AISummaryReportViewProps) {
  const { data, isLoading, refetch } = useQuery({ queryKey: ["summary-report", analysisId], queryFn: () => getSummaryReport(analysisId), retry: false });
  const generateMutation = useMutation({ mutationFn: () => generateSummaryReport(analysisId), onSuccess: () => refetch() });

  const { data: scores } = useQuery({ queryKey: ['scores', analysisId], queryFn: () => getScores(analysisId) });
  const { data: competitorsData } = useQuery({ queryKey: ['competitors', analysisId], queryFn: () => getCompetitors(analysisId) });
  const { data: prompts } = useQuery({ queryKey: ['prompts', analysisId], queryFn: () => getPrompts(analysisId) });
  const { data: recommendations } = useQuery({ queryKey: ['recommendations', analysisId], queryFn: () => getRecommendations(analysisId) });
  const { data: intelligence } = useQuery({ queryKey: ['intelligence', analysisId], queryFn: () => getIntelligence(analysisId) });

  const handlePrint = () => window.print();

  if (isLoading || generateMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Sparkles className="w-12 h-12 text-indigo-500 animate-spin" />
        <h2 className="text-xl font-bold text-gray-900">Synthesizing AI Summary Report...</h2>
        <p className="text-gray-500 max-w-md text-center">We are feeding all extracted data into the LLM to generate a customized executive summary. This takes about 10-20 seconds.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="bg-indigo-50 p-6 rounded-full">
          <Sparkles className="w-16 h-16 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">AI Summary Report</h2>
        <p className="text-gray-500 max-w-lg text-center text-lg">Generate a concise 3-4 page executive summary that distills all 20 modules into actionable intelligence using advanced LLM synthesis.</p>
        <button 
          onClick={() => generateMutation.mutate()}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" /> Generate AI Summary
        </button>
      </div>
    );
  }

  // Derived Business Overview Data
  const profile = intelligence || {};
  let businessModel = "Not specified";
  const audienceText = (profile.target_audience || "").toLowerCase();
  if (audienceText.includes("business") || audienceText.includes("enterprise") || audienceText.includes("b2b")) businessModel = "B2B";
  else if (audienceText.includes("consumer") || audienceText.includes("people") || audienceText.includes("b2c")) businessModel = "B2C";
  const products = profile.products || [];
  const services = profile.services || [];

  // Derived Score Data
  const overallScore = scores?.overall_score || 0;
  const aiScore = scores?.ai_readiness_score || 0;
  const marketShareLoss = Math.max(0, 100 - aiScore);
  const criticalCount = (recommendations || []).filter((r: any) => r.priority_score === 1 || r.priority === 'Critical' || r.severity === 'Critical').length;
  
  // Derived Competitor Data (Page 11 Replication)
  const insights = competitorsData?.insight_analysis || {};
  const whyCompetitorsWin = insights.why_competitors_win || [];
  const radarDims = insights.radar_dimensions || {};
  const intentMatrix = insights.intent_matrix || [];

  const targetBiz = radarDims.target_business || { entity_strength: 0, content_depth: 0, topical_authority: 0, trust_eeat: 0, commercial_intent: 0 };
  const radarData = [
    { subject: "Entity Strength", Target: targetBiz.entity_strength, Comp1: 0, Comp2: 0 },
    { subject: "Content Depth", Target: targetBiz.content_depth, Comp1: 0, Comp2: 0 },
    { subject: "Topical Authority", Target: targetBiz.topical_authority, Comp1: 0, Comp2: 0 },
    { subject: "Trust & EEAT", Target: targetBiz.trust_eeat, Comp1: 0, Comp2: 0 },
    { subject: "Commercial Coverage", Target: targetBiz.commercial_intent, Comp1: 0, Comp2: 0 },
  ];
  const radarComps = radarDims.competitors || [];
  let comp1Name = "Competitor 1", comp2Name = "Competitor 2";
  if (radarComps.length > 0) {
    comp1Name = radarComps[0].company;
    ['entity_strength', 'content_depth', 'topical_authority', 'trust_eeat', 'commercial_intent'].forEach((k, i) => { radarData[i].Comp1 = radarComps[0][k]; });
  }
  if (radarComps.length > 1) {
    comp2Name = radarComps[1].company;
    ['entity_strength', 'content_depth', 'topical_authority', 'trust_eeat', 'commercial_intent'].forEach((k, i) => { radarData[i].Comp2 = radarComps[1][k]; });
  }
  const intentChartData = intentMatrix.map((m: any) => ({
    name: m.company.length > 12 ? m.company.slice(0, 11) + "…" : m.company,
    Commercial: m.scores.Commercial || 0,
    Informational: m.scores.Informational || 0,
    Location: m.scores.Location || 0,
  })).slice(0, 5);

  let won = 0, lost = 0;
  if (prompts) {
    prompts.forEach((p: any) => {
      let gpt = 0, gem = 0;
      if (p.playground_results?.live) {
        if (p.playground_results.live.openai) gpt = p.playground_results.live.openai.brand_mentions > 0 ? 100 : 0;
        if (p.playground_results.live.gemini) gem = p.playground_results.live.gemini.brand_mentions > 0 ? 100 : 0;
      }
      if ((gpt + gem) / 2 >= 45) won++; else lost++;
    });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32 animate-in fade-in duration-500 bg-gray-50/50">
      
      {/* Print Header */}
      <div className="flex items-center justify-between no-print mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Summary Report</h1>
          <p className="text-gray-500 mt-2">AI-Synthesized Intelligence Briefing</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm text-sm"
        >
          <Download className="w-4 h-4" />
          Export to PDF
        </button>
      </div>

      <div className="space-y-16 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
        
        {/* KPI Scorecard */}
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden print:break-inside-avoid">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black">Overall AI Visibility Score</h2>
              <p className="text-indigo-200 max-w-md">This composite score measures how well AI models discover, understand, and recommend your business. A score below 50 signals critical gaps in AI market presence.</p>
            </div>
            <div className="flex items-center gap-6 bg-white/10 px-8 py-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="text-6xl font-black">{overallScore}</div>
              <div className="text-indigo-200 text-lg font-medium leading-tight">Out of<br/>100</div>
            </div>
          </div>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-6 print:break-inside-avoid">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Building2 className="w-6 h-6" /></div>
            <h2 className="text-2xl font-bold text-gray-900">Business Overview</h2>
          </div>
          
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Extracted Structured Data</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Category</h4>
                <p className="text-gray-900 font-medium">{profile.industry || "Uncategorized"} • {profile.sub_industry}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Business Model</h4>
                <p className="text-gray-900 font-medium">{businessModel}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Box className="w-3.5 h-3.5" /> Core Offerings</h4>
                <div className="flex flex-wrap gap-2">
                  {[...products, ...services].slice(0, 6).map((item: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-200 shadow-sm">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed text-sm bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
             <div className="font-bold text-indigo-800 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Executive Insight</div>
             <ReactMarkdown>{data.overview}</ReactMarkdown>
          </div>
        </section>

        {/* Section 3: Competitor Analysis */}
        <section className="space-y-6 pt-8 border-t border-gray-100 print:break-before-page">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Compass className="w-6 h-6" /></div>
            <h2 className="text-2xl font-bold text-gray-900">Competitor Analysis</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-green-100 bg-green-50 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-green-900">Why Competitors Win</h3>
              </div>
              <div className="p-6 space-y-4">
                {whyCompetitorsWin.slice(0, 3).map((w: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs shrink-0">{i + 1}</div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{w.company}</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{w.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-900">Why You Lost The Citation</h3>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                <p className="text-sm text-red-900 font-medium leading-relaxed mb-4">
                  {insights.why_we_lost || data.competitor_analysis.substring(0, 200) + "..."}
                </p>
                {insights.opportunity_analysis && (
                  <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                    <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Priority Recovery Plan</h4>
                    <ul className="space-y-2">
                      {(insights.opportunity_analysis.priority_improvements || []).map((imp: string, i: number) => (
                        <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1" />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm">Competitive Dimension Radar</h3>
              </div>
              <div className="p-4 bg-gray-50/30">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: "#4b5563" }} />
                    <Radar name="You" dataKey="Target" stroke="#ec4899" fill="#ec4899" fillOpacity={0.2} strokeWidth={3} />
                    <Radar name={comp1Name} dataKey="Comp1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm">Competitor Intent Coverage</h3>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={intentChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#4b5563" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 500, paddingTop: '10px' }} />
                    <Bar dataKey="Commercial" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} barSize={30} />
                    <Bar dataKey="Informational" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="Location" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Revenue Impact & Failures */}
        <section className="space-y-6 pt-8 border-t border-gray-100 print:break-before-page">
          <div className="flex items-center gap-3 border-b border-red-100 pb-4">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Activity className="w-6 h-6" /></div>
            <h2 className="text-2xl font-bold text-gray-900">Revenue Impact</h2>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-indigo-50/50 border-b border-gray-100 flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <p className="text-sm font-medium text-gray-700"><strong className="text-indigo-900">Risk Assessment Model:</strong> This calculates Revenue Risk and Market Share Loss directly based on your competitive deficits.</p>
            </div>
            
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="text-red-500 text-sm font-bold uppercase tracking-wider mb-1">Revenue Risk</div>
                <div className="text-4xl font-black text-red-600">{100 - overallScore}/100</div>
              </div>
              <div className="bg-purple-50 border border-purple-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="text-purple-500 text-sm font-bold uppercase tracking-wider mb-1">Market Share Loss</div>
                <div className="text-4xl font-black text-purple-600">{marketShareLoss}%</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="text-yellow-600 text-sm font-bold uppercase tracking-wider mb-1">Critical Blockers</div>
                <div className="text-4xl font-black text-yellow-700">{criticalCount}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="text-emerald-600 text-sm font-bold uppercase tracking-wider mb-1">Live Win Rate</div>
                <div className="text-4xl font-black text-emerald-700">{won}/{won+lost}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Strategic Action Plan */}
        <section className="space-y-6 pt-8 border-t border-gray-100 print:break-before-page">
          <div className="flex items-center gap-3 border-b border-green-100 pb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Map className="w-6 h-6" /></div>
            <h2 className="text-2xl font-bold text-gray-900">Strategic Improvement Plan</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">AI Recommended Phases</h3>
              {data.improvement_plan.map((plan: string, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border-l-4 border-l-green-500 shadow-sm border border-gray-200">
                  <div className="text-green-700 font-bold mb-2 uppercase text-xs tracking-wider">Phase {idx + 1}</div>
                  <div className="text-gray-700 text-sm leading-relaxed"><ReactMarkdown>{plan}</ReactMarkdown></div>
                </div>
              ))}
            </div>
            
            <div className="space-y-4 bg-gray-900 rounded-3xl p-8 text-white shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-indigo-400" /> Immediate Technical Priorities
              </h3>
              {(recommendations || []).slice(0, 3).map((rec: any, idx: number) => (
                <div key={idx} className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-full border border-red-500/30">
                      CRITICAL
                    </span>
                    <h4 className="font-bold text-white">{rec.issue_type}</h4>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">{rec.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
"""

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("AISummaryReportView completely redesigned V2")
