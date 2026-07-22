"use client";

import { CheckCircle, AlertTriangle, Zap, Target, Clock, Activity, BarChart, ArrowUpRight } from "lucide-react";

export default function Page18ActionPlan({ recommendations }: { recommendations: any[] }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-200">
        <Target className="w-12 h-12 mb-4 opacity-20" />
        <h3 className="text-xl font-medium">No Actions Required</h3>
        <p>There are currently no recommended actions for this analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
        <h1>Strategic Recommendations</h1>
        <p className="text-xl text-gray-500">The prioritized roadmap to dominate AI search and secure your market share.</p>
      </div>

      <div className="space-y-8">
        {recommendations.map((action, i) => {
          const isCritical = action.priority_score === 1 || action.priority === "Critical" || action.severity === "critical";
          const isHigh = action.priority_score === 2 || action.priority === "High" || action.severity === "high";

          const headerColor = isCritical 
            ? "bg-red-50 border-red-100 text-red-900" 
            : isHigh 
            ? "bg-orange-50 border-orange-100 text-orange-900" 
            : "bg-indigo-50 border-indigo-100 text-indigo-900";
            
          const badgeColor = isCritical 
            ? "bg-red-200 text-red-800" 
            : isHigh 
            ? "bg-orange-200 text-orange-800" 
            : "bg-indigo-200 text-indigo-800";

          const visGain = action.estimated_visibility_increase || "Data Unavailable";
          const citGain = action.estimated_citation_increase || "Data Unavailable";
          const recGain = action.estimated_recommendation_increase || "Data Unavailable";
          const timeline = action.timeline || "Timeline Unavailable";

          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
              
              {/* Left Column: Problem & Solution */}
              <div className="flex-1 p-6 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100">
                
                <div className="flex items-center gap-3 mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider ${badgeColor}`}>
                    {action.priority || "Medium"} PRIORITY
                  </span>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> Core Objective
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Business Problem</h4>
                    <p className="text-xl font-bold text-gray-900 leading-snug">{action.problem || "Technical structure limiting visibility"}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Business Impact</h4>
                      <p className="text-sm font-medium text-gray-700">{action.business_impact || "Loss of commercial recommendations."}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Technical Cause</h4>
                      <p className="text-sm font-medium text-gray-700">{action.technical_cause || "Missing entity definitions."}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Evidence</h4>
                    <p className="text-sm text-gray-600 bg-white border border-dashed border-gray-300 p-4 rounded-lg">
                      {action.evidence || "Crawler analysis detected missing required signals."}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> Prescribed Solution
                    </h4>
                    <div className="text-emerald-900 font-bold bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      {action.solution || action.technical_cause || "Implement structured semantic markup."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: ROI & Specs */}
              <div className="w-full lg:w-[340px] bg-gray-50 flex flex-col">
                <div className={`px-6 py-5 border-b ${headerColor} flex items-center gap-2`}>
                  <Activity className="w-5 h-5 opacity-70" />
                  <h3 className="font-bold text-sm tracking-wider uppercase">Implementation Specs</h3>
                </div>
                
                <div className="p-6 space-y-6 flex-1">
                  
                  {/* Effort & Timeline */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Difficulty</div>
                      <div className="font-bold text-gray-900">{action.difficulty || "Moderate"}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Timeline</div>
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" /> {timeline}
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                  {/* Expected ROI */}
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expected ROI</div>
                    <div className="font-black text-2xl text-emerald-600 flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl">
                      <ArrowUpRight className="w-6 h-6" /> {action.expected_roi || "High"}
                    </div>
                  </div>

                  {/* Specific Gains */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-gray-600 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-500" /> Visibility Gain
                      </span>
                      <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">{visGain}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-gray-600 flex items-center gap-2">
                        <Target className="w-4 h-4 text-pink-500" /> Citation Gain
                      </span>
                      <span className="font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded text-[10px]">{citGain}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-gray-600 flex items-center gap-2">
                        <BarChart className="w-4 h-4 text-blue-500" /> Rec. Gain
                      </span>
                      <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px]">{recGain}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
