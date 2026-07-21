"use client";
import { AlertCircle, ArrowUpRight, Wrench, Zap, DollarSign } from "lucide-react";

export default function ConsultantRecommendations({ recommendations }: { recommendations: any[] }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 font-sans">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-medium text-gray-900">Strategic Recommendations</h2>
          <p className="text-sm text-gray-500">Prioritized actions to recover lost AI search market share.</p>
        </div>
      </div>

      <div className="space-y-6">
        {recommendations.map((rec, i) => {
          const isCritical = rec.priority_score === 1 || rec.priority === "Critical";
          const isHigh = rec.priority_score === 2 || rec.priority === "High";
          
          return (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:border-gray-200 transition-colors">
              <div className={`px-6 py-4 border-b ${isCritical ? 'bg-red-50/50 border-red-100' : isHigh ? 'bg-orange-50/50 border-orange-100' : 'bg-gray-50 border-gray-100'} flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                    isCritical ? 'bg-red-100 text-red-700' : 
                    isHigh ? 'bg-orange-100 text-orange-700' : 
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {rec.priority || "Medium"} Priority
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    Expected ROI: <span className="text-gray-900">{rec.expected_roi}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
                  <ArrowUpRight className="w-4 h-4" />
                  Visibility {rec.estimated_visibility_increase}
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Problem & Impact */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Business Problem
                    </h4>
                    <p className="text-gray-900 text-sm leading-relaxed font-medium">
                      {rec.problem}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Revenue Impact
                    </h4>
                    <p className="text-red-600 text-sm leading-relaxed">
                      {rec.business_impact}
                    </p>
                  </div>
                </div>

                {/* Technical Cause & Fix */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" /> Technical Solution
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {rec.technical_cause}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Evidence</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {rec.evidence}
                    </p>
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
