"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { generateSummaryReport, getSummaryReport, getScores, getCompetitors, getPrompts, getRecommendations, getIntelligence } from "@/lib/api";
import { Download, Sparkles, Building2, Lightbulb, Compass, Target, Map, Activity, ArrowRight, ShieldCheck, Cpu, Tag, Briefcase, Box, MapPin, Crosshair, AlertTriangle, ShieldAlert, Link, MessageCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';

// Import all exact full-report components
import Page2ExecutiveInsights from "./Page2ExecutiveInsights";
import Page3VisibilityOverview from "./Page3VisibilityOverview";
import Page11CompetitorIntelligence from "./Page11CompetitorIntelligence";
import Page15CommercialOpportunity from "./Page15CommercialOpportunity";
import Page16RevenueImpact from "./Page16RevenueImpact";

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
        <p className="text-gray-500 max-w-md text-center">We are generating a highly detailed visual executive summary...</p>
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
        <p className="text-gray-500 max-w-lg text-center text-lg">Generate a concise executive summary that distills all modules into actionable visual intelligence.</p>
        <button 
          onClick={() => generateMutation.mutate()}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" /> Generate AI Summary
        </button>
      </div>
    );
  }

  const profile = intelligence || {};
  let businessModel = "Not specified";
  const audienceText = (profile.target_audience || "").toLowerCase();
  if (audienceText.includes("business") || audienceText.includes("enterprise") || audienceText.includes("b2b")) businessModel = "B2B";
  else if (audienceText.includes("consumer") || audienceText.includes("people") || audienceText.includes("b2c")) businessModel = "B2C";
  const products = profile.products || [];
  const services = profile.services || [];

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
        
        {/* 1. Business Overview */}
        <section className="space-y-6 print:break-inside-avoid">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-lg">1</div>
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
             <div className="font-bold text-indigo-800 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> AI Assessment</div>
             <ReactMarkdown>{data.overview}</ReactMarkdown>
          </div>
        </section>

        {/* 2 & 3. AI Visibility Score & Key Insights (Page 2) */}
        <section className="space-y-6 pt-8 border-t border-gray-100 print:break-before-page">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg font-bold text-lg">2</div>
            <h2 className="text-2xl font-bold text-gray-900">AI Visibility Score & Key Insights</h2>
          </div>
          
          <div className="[&>div>div:first-child]:hidden -mt-10">
            <Page2ExecutiveInsights intelligence={intelligence} recommendations={recommendations} scores={scores} />
          </div>
        </section>

        {/* 4. Competitor Analysis (Page 11) */}
        <section className="space-y-6 pt-8 border-t border-gray-100 print:break-before-page">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-lg">3</div>
            <h2 className="text-2xl font-bold text-gray-900">Competitor Analysis</h2>
          </div>

          <div className="[&>div>div:first-child]:hidden -mt-10">
            <Page11CompetitorIntelligence competitorsData={competitorsData} prompts={prompts} scores={scores} intelligence={intelligence} recommendations={recommendations} />
          </div>
          
          <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed text-sm bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-6">
             <div className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Target className="w-4 h-4"/> Market Stance (AI Synthesized)</div>
             <ReactMarkdown>{data.competitor_analysis}</ReactMarkdown>
          </div>
        </section>

        {/* 5. Citation & Growth Opportunities (Page 15) */}
        <section className="space-y-6 pt-8 border-t border-gray-100 print:break-before-page">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-lg">4</div>
            <h2 className="text-2xl font-bold text-gray-900">Citation & Commercial Deficits</h2>
          </div>
          
          <div className="[&>div>div:first-child]:hidden -mt-10">
            <Page15CommercialOpportunity prompts={prompts} scores={scores} />
          </div>
        </section>

        {/* 6. Multi LLM Analysis (Page 3) */}
        <section className="space-y-6 pt-8 border-t border-gray-100 print:break-before-page">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg font-bold text-lg">5</div>
            <h2 className="text-2xl font-bold text-gray-900">Multi-LLM Based Analysis (ChatGPT vs Gemini)</h2>
          </div>
          
          <div className="[&>div>div:first-child]:hidden -mt-10">
            <Page3VisibilityOverview prompts={prompts} />
          </div>
        </section>

        {/* 7. Revenue Impact (Page 16) */}
        <section className="space-y-6 pt-8 border-t border-gray-100 print:break-before-page">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg font-bold text-lg">6</div>
            <h2 className="text-2xl font-bold text-gray-900">Revenue Impact</h2>
          </div>
          
          <div className="[&>div>div:first-child]:hidden -mt-10">
            <Page16RevenueImpact scores={scores} recommendations={recommendations} />
          </div>
        </section>

        {/* 8. Strategic Action Plan */}
        <section className="space-y-6 pt-8 border-t border-gray-100 print:break-before-page">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg font-bold text-lg">7</div>
            <h2 className="text-2xl font-bold text-gray-900">Recommendations: How to Fix Issues</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Strategic Phases</h3>
              {data.improvement_plan.map((plan: string, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border-l-4 border-l-green-500 shadow-sm border border-gray-200">
                  <div className="text-green-700 font-bold mb-2 uppercase text-xs tracking-wider">Phase {idx + 1}</div>
                  <div className="text-gray-700 text-sm leading-relaxed"><ReactMarkdown>{plan}</ReactMarkdown></div>
                </div>
              ))}
            </div>
            
            <div className="space-y-4 bg-gray-900 rounded-3xl p-8 text-white shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-indigo-400" /> Immediate Technical Fixes
              </h3>
              {(recommendations || []).slice(0, 3).map((rec: any, idx: number) => (
                <div key={idx} className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-full border border-red-500/30">
                      CRITICAL
                    </span>
                    <h4 className="font-bold text-white">{rec.problem || rec.issue_type || "Technical Issue"}</h4>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">{rec.technical_cause || rec.recommendation || "Needs technical review."}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
