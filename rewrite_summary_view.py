import os

path = r"c:\Users\ASUS\Downloads\ai-listing-engine\frontend\components\report\v4\AISummaryReportView.tsx"

content = """"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { generateSummaryReport, getSummaryReport, getScores, getCompetitors, getPrompts, getRecommendations, getIntelligence } from "@/lib/api";
import { Download, Sparkles, Building2, Lightbulb, Compass, Target, Map, Activity, ShieldAlert, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface AISummaryReportViewProps {
  analysisId: string;
}

export default function AISummaryReportView({ analysisId }: AISummaryReportViewProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["summary-report", analysisId],
    queryFn: () => getSummaryReport(analysisId),
    retry: false
  });

  const generateMutation = useMutation({
    mutationFn: () => generateSummaryReport(analysisId),
    onSuccess: () => refetch()
  });

  const { data: scores } = useQuery({ queryKey: ['scores', analysisId], queryFn: () => getScores(analysisId) });
  const { data: competitors } = useQuery({ queryKey: ['competitors', analysisId], queryFn: () => getCompetitors(analysisId) });
  const { data: prompts } = useQuery({ queryKey: ['prompts', analysisId], queryFn: () => getPrompts(analysisId) });
  const { data: recommendations } = useQuery({ queryKey: ['recommendations', analysisId], queryFn: () => getRecommendations(analysisId) });
  const { data: intelligence } = useQuery({ queryKey: ['intelligence', analysisId], queryFn: () => getIntelligence(analysisId) });

  const handlePrint = () => {
    window.print();
  };

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

  // Derived Data for Charts
  const scoreData = scores ? [
    { subject: 'SEO', A: scores.seo_score, fullMark: 100 },
    { subject: 'AEO', A: scores.aeo_score, fullMark: 100 },
    { subject: 'GEO', A: scores.geo_score, fullMark: 100 },
    { subject: 'AI Readiness', A: scores.ai_readiness_score, fullMark: 100 }
  ] : [];

  const compData = competitors?.competitors ? competitors.competitors.slice(0, 5).map((c: any) => ({
    name: c.company || c.name || "Unknown",
    sov: c.share_of_voice || c.mentions || 0
  })) : [];

  let won = 0, lost = 0;
  if (prompts) {
    prompts.forEach((p: any) => {
      let gpt = 0, gem = 0;
      if (p.playground_results?.live) {
        const live = p.playground_results.live;
        if (live.openai) gpt = live.openai.brand_mentions > 0 && live.openai.validation?.valid ? 100 : 0;
        if (live.gemini) gem = live.gemini.brand_mentions > 0 && live.gemini.validation?.valid ? 100 : 0;
      }
      const avg = (gpt + gem) / 2;
      if (avg >= 45) won++; else lost++;
    });
  }
  const pieData = [
    { name: 'Won', value: won, color: '#10b981' },
    { name: 'Lost', value: lost, color: '#ef4444' }
  ];

  const overallScore = scores?.overall_score || 0;
  const aiScore = scores?.ai_readiness_score || 0;
  const marketShareLoss = Math.max(0, 100 - aiScore);
  const criticalCount = (recommendations || []).filter((r: any) => r.priority_score === 1 || r.priority === 'Critical' || r.severity === 'Critical').length;
  const highCount = (recommendations || []).filter((r: any) => r.priority_score === 2 || r.priority === 'High' || r.severity === 'High').length;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32 animate-in fade-in duration-500">
      
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

      <div className="space-y-16 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
        
        {/* KPI Scorecard */}
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden print:break-inside-avoid">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black">Overall AI Visibility Score</h2>
              <p className="text-indigo-200 max-w-md">This composite score measures how well AI models discover, understand, and recommend your business.</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Business Overview & Intelligence</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 prose prose-indigo max-w-none text-gray-700 leading-relaxed text-lg">
              <ReactMarkdown>{data.overview}</ReactMarkdown>
            </div>
            <div className="h-64 bg-gray-50 rounded-2xl border border-gray-100 p-4 flex flex-col items-center justify-center shadow-inner">
              <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Visibility Breakdown</h3>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={scoreData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#6b7280', fontSize: 12}} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Section 2: Key Insights */}
        <section className="space-y-6 pt-8 border-t border-gray-100 print:break-before-page">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Lightbulb className="w-6 h-6" /></div>
            <h2 className="text-2xl font-bold text-gray-900">Key AI Insights</h2>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.key_insights.map((insight: string, idx: number) => (
              <li key={idx} className="flex gap-4 items-start bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="text-gray-700 leading-relaxed text-sm"><ReactMarkdown>{insight}</ReactMarkdown></div>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3: Competitor Analysis */}
        <section className="space-y-6 pt-8 border-t border-gray-100 print:break-before-page">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Compass className="w-6 h-6" /></div>
            <h2 className="text-2xl font-bold text-gray-900">Competitor Analysis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed">
              <ReactMarkdown>{data.competitor_analysis}</ReactMarkdown>
            </div>
            <div className="h-[400px] bg-white rounded-2xl border border-gray-100 p-6 flex flex-col shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 mb-6 text-center uppercase tracking-wider">Top Competitor Share of Voice</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#374151', fontSize: 12, fontWeight: 600}} width={120} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="sov" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                      {compData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : '#93c5fd'} />
                      ))}
                    </Bar>
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
            <h2 className="text-2xl font-bold text-gray-900">Revenue Impact & Critical Gaps</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="text-red-500 text-sm font-bold uppercase tracking-wider mb-1">Revenue Risk Score</div>
              <div className="text-3xl font-black text-red-600">{100 - overallScore}/100</div>
            </div>
            <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="text-orange-500 text-sm font-bold uppercase tracking-wider mb-1">Market Share Loss</div>
              <div className="text-3xl font-black text-orange-600">{marketShareLoss}%</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="text-yellow-600 text-sm font-bold uppercase tracking-wider mb-1">Critical Blockers</div>
              <div className="text-3xl font-black text-yellow-700">{criticalCount}</div>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm p-5 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Live Win Rate</div>
              <div className="text-3xl font-black text-gray-900">{won}/{won+lost}</div>
            </div>
          </div>

          <div className="prose prose-red max-w-none text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <ReactMarkdown>{data.failures_analysis}</ReactMarkdown>
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
                <div key={idx} className="bg-white p-5 rounded-2xl border-l-4 border-l-green-500 shadow-sm border border-gray-100">
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
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                    <ArrowRight className="w-4 h-4" /> Action Required
                  </div>
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

print("AISummaryReportView completely redesigned")
