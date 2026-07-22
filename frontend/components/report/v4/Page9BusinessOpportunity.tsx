"use client";

import { TrendingDown, CircleDollarSign, BarChart4, Users, AlertCircle } from "lucide-react";

export default function Page9BusinessOpportunity({ geoIntelligence }: { geoIntelligence: any }) {
  const opportunity = geoIntelligence?.revenue_opportunity;

  if (!opportunity) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-200">
        <CircleDollarSign className="w-12 h-12 mb-4 opacity-20" />
        <h3 className="text-xl font-medium">No Revenue Opportunity Data</h3>
        <p>Revenue and commercial opportunity analysis is not available.</p>
      </div>
    );
  }

  const { 
    commercial_visibility_status, 
    lost_recommendation_share, 
    expected_improvement 
  } = opportunity;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
        <h1>Brand Identity & Footprint</h1>
        <p className="text-xl text-gray-500">The commercial cost of low AI visibility.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-xl text-red-600 shrink-0 mt-1">
            <TrendingDown className="w-6 h-6"/>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Lost Recommendation Share</h3>
            <div className="text-5xl font-black text-red-500 mb-2">{lost_recommendation_share || "Significant"}</div>
            <p className="text-sm text-gray-500 leading-relaxed">
              This represents the estimated percentage of commercial queries where AI models recommend competitors instead of your business.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 shrink-0 mt-1">
            <BarChart4 className="w-6 h-6"/>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Expected Improvement</h3>
            <div className="text-2xl font-black text-emerald-600 mb-2 mt-2 leading-snug">
              {expected_improvement || "High potential for traffic recovery"}
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mt-2">
              Based on the priority fixes identified, implementing technical optimizations can quickly recapture this lost market share.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-10 text-white shadow-xl mt-8 relative overflow-hidden">
        <AlertCircle className="absolute -bottom-10 -right-10 w-48 h-48 text-indigo-500/20" />
        <h3 className="text-2xl font-bold mb-4 relative z-10 flex items-center gap-2">
          Commercial Visibility Status
        </h3>
        <p className="text-indigo-200 text-xl leading-relaxed max-w-4xl relative z-10 font-medium bg-white/10 p-6 rounded-xl border border-white/10">
          {commercial_visibility_status || "Critically losing commercial queries to primary competitors."}
        </p>
        
        <p className="text-indigo-300 mt-6 max-w-3xl relative z-10">
          As users rapidly transition from traditional search engines to conversational AI (ChatGPT, Perplexity), your current visibility gap directly translates to lost leads. 
          Competitors currently occupying the AI Knowledge Graph are capturing bottom-of-funnel traffic.
        </p>
      </div>
    </div>
  );
}
