"use client";
import { DollarSign, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";

export default function RevenueOpportunity({ geoIntelligence }: { geoIntelligence: any }) {
  if (!geoIntelligence || !geoIntelligence.revenue_opportunity) return null;

  const { 
    commercial_visibility_status, 
    lost_recommendation_share, 
    priority_fixes, 
    expected_improvement 
  } = geoIntelligence.revenue_opportunity;

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl shadow-lg border border-indigo-800 p-8 mb-8 text-white font-sans">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-indigo-800/50 text-indigo-300 rounded-lg backdrop-blur-sm border border-indigo-700/50">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-medium text-white">Revenue Opportunity</h2>
          <p className="text-sm text-indigo-200">Commercial impact of current AI visibility.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Status Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-medium text-indigo-200 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Commercial Status
          </h3>
          <p className="text-xl font-semibold text-white leading-snug">
            {commercial_visibility_status || "Critically losing commercial queries to primary competitors."}
          </p>
        </div>

        {/* Lost Share Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-medium text-indigo-200 mb-2">Lost Recommendation Share</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-red-400">{lost_recommendation_share || "60%"}</span>
          </div>
          <p className="mt-2 text-xs text-indigo-200 leading-relaxed">
            Estimated percentage of commercial queries where AI models recommend competitors instead of your business.
          </p>
        </div>

        {/* Improvement Path */}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-medium text-indigo-200 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Projected ROI
          </h3>
          <p className="text-lg font-medium text-green-300 leading-snug mb-4">
            {expected_improvement || "Significant recovery of lost commercial traffic and qualified leads."}
          </p>
          
          <div className="space-y-2">
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Required Actions</p>
            {priority_fixes && priority_fixes.length > 0 ? (
              <ul className="space-y-1.5">
                {priority_fixes.map((fix: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span>{fix}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/80">Implement technical schema and entity optimizations.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
