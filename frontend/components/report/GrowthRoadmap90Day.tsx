"use client";
import { Clock, CheckCircle, ArrowRight } from "lucide-react";

export default function GrowthRoadmap90Day({ geoIntelligence }: { geoIntelligence: any }) {
  if (!geoIntelligence || !geoIntelligence.roadmap_90_day) return null;

  const roadmap = geoIntelligence.roadmap_90_day;

  // Expected structure is either weeks/months as keys.
  const phases = Object.entries(roadmap).map(([key, value]: [string, any]) => ({
    title: key.replace('_', ' '),
    theme: value.theme || "Strategic Execution",
    actions: value.actions || []
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 font-sans">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-medium text-gray-900">90-Day AI Growth Roadmap</h2>
          <p className="text-sm text-gray-500">Step-by-step execution plan to dominate AI commercial queries.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {phases.map((phase, i) => (
          <div key={i} className="relative">
            {/* Connection Line */}
            {i < phases.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-100 z-0"></div>
            )}
            
            <div className="bg-white border border-gray-100 rounded-xl p-6 h-full shadow-sm hover:shadow-md transition-shadow relative z-10 hover:border-emerald-200">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                {phase.title}
              </div>
              <h4 className="text-base font-semibold text-gray-900 mb-4 pb-4 border-b border-gray-100">
                {phase.theme}
              </h4>
              <ul className="space-y-3">
                {phase.actions.map((action: string, j: number) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      
      {geoIntelligence.expected_outcomes && geoIntelligence.expected_outcomes.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Projected ROI Map</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {geoIntelligence.expected_outcomes.map((outcome: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">{outcome.timeframe}</div>
                <div className="text-sm font-medium text-gray-900 mb-1">{outcome.metric}</div>
                <div className="text-sm text-emerald-600 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" /> {outcome.outcome}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
