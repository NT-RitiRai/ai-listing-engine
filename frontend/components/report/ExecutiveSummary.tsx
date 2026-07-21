"use client";
import { TrendingUp, Activity, CheckCircle, Search, Target, Shield, Zap } from "lucide-react";

export default function ExecutiveSummary({ 
  analysis, 
  scores, 
  intelligence, 
  geoIntelligence
}: { 
  analysis: any;
  scores: any; 
  intelligence: any; 
  geoIntelligence?: any;
}) {
  const brandName = (intelligence?.business_context?.business_name) 
    ? intelligence.business_context.business_name 
    : (intelligence?.brands && intelligence.brands.length > 0) 
      ? intelligence.brands[0] 
      : (analysis?.url ? new URL(analysis.url.startsWith('http') ? analysis.url : `https://${analysis.url}`).hostname.replace('www.', '').split('.')[0] : 'Company Overview');

  const industry = intelligence?.business_context?.industry || intelligence?.industry || "Unknown Industry";
  
  // KPIs
  const visibilityRate = geoIntelligence?.evidence_object?.ai_visibility?.visibility_rate || 0;
  const commercialReadiness = scores?.ai_readiness_score || 0;
  const trustScore = scores?.aeo_score || 0;
  const entities = intelligence?.entities?.length || 0;

  return (
    <div className="space-y-8 mb-12 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight capitalize mb-2">{brandName}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Target className="w-4 h-4" /> {industry}</span>
            <span className="text-gray-300">|</span>
            <a href={analysis?.url} target="_blank" rel="noreferrer" className="hover:text-black transition-colors">{analysis?.url}</a>
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Executive AI Report</p>
          <p className="text-sm text-gray-400">{new Date(analysis?.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Summary Text */}
      <div className="max-w-4xl">
        <p className="text-xl text-gray-700 leading-relaxed font-light">
          {geoIntelligence?.executive_summary || "Analyzing commercial visibility across leading AI Search engines (ChatGPT, Gemini, Perplexity) to determine revenue risks and growth opportunities."}
        </p>
      </div>

      {/* KPI Cards (Stripe/Linear aesthetic) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Visibility */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">AI Visibility Score</h3>
            <div className={`p-2 rounded-lg ${visibilityRate >= 70 ? 'bg-green-50 text-green-600' : visibilityRate >= 40 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-gray-900">{visibilityRate}%</span>
          </div>
          <div className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
            Percentage of high-intent queries won
          </div>
        </div>

        {/* KPI 2: Commercial Readiness */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Commercial Readiness</h3>
            <div className={`p-2 rounded-lg ${commercialReadiness >= 75 ? 'bg-green-50 text-green-600' : commercialReadiness >= 50 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-gray-900">{commercialReadiness}</span>
            <span className="text-sm font-medium text-gray-500">/100</span>
          </div>
          <div className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
            Readiness for AI commercial extraction
          </div>
        </div>

        {/* KPI 3: Trust & Authority */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Trust & Authority</h3>
            <div className={`p-2 rounded-lg ${trustScore >= 80 ? 'bg-green-50 text-green-600' : trustScore >= 50 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-gray-900">{trustScore}</span>
            <span className="text-sm font-medium text-gray-500">/100</span>
          </div>
          <div className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
            EEAT signals verified by AI models
          </div>
        </div>

        {/* KPI 4: Entity Graph */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500">Knowledge Graph</h3>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-gray-900">{entities}</span>
          </div>
          <div className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
            Distinct corporate entities recognized
          </div>
        </div>

      </div>
    </div>
  );
}
