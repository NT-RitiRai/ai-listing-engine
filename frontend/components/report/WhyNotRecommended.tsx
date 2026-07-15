"use client";
import { AlertCircle, Target, Users, ArrowRight } from "lucide-react";

export default function WhyNotRecommended({ prompts }: { prompts: any[] }) {
  if (!prompts || prompts.length === 0) return null;

  const livePrompts = prompts.filter(p => p.playground_results?.live && Object.keys(p.playground_results.live).length > 0);
  if (livePrompts.length === 0) return null;

  // Aggregate why it failed and competitors
  const failureReasons = new Set<string>();
  const competitorsMap = new Map<string, number>();

  livePrompts.forEach(prompt => {
    Object.values(prompt.playground_results.live).forEach((data: any) => {
      // Collect reasons
      if (data.validation?.valid === false && data.validation?.reason) {
        failureReasons.add(data.validation.reason);
      }
      if (data.remediation_note?.status && !data.remediation_note.status.includes("Intercepted")) {
        // Strip out jargon like "Absorption Gate" if it accidentally sneaks in from backend
        let reason = data.remediation_note.status
          .replace(/Absorption Gate/gi, "")
          .replace(/Remediation/gi, "")
          .trim();
        if (reason) failureReasons.add(reason);
      }

      // Collect competitors
      if (data.competitors && Array.isArray(data.competitors)) {
        data.competitors.forEach((c: any) => {
          if (c.name) {
            const count = competitorsMap.get(c.name) || 0;
            competitorsMap.set(c.name, count + (c.count || 1));
          }
        });
      }
    });
  });

  const reasonsList = Array.from(failureReasons).slice(0, 5); // top 5
  const topCompetitors = Array.from(competitorsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (reasonsList.length === 0 && topCompetitors.length === 0) {
    return null; // Nothing to show here
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
      {/* Module 5: Why AI Didn't Recommend Your Website */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-50 p-2 rounded-lg text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Why AI Didn't Recommend You</h2>
        </div>
        
        <p className="text-gray-600 mb-6 text-sm">
          For recent searches, AI selected other websites instead of yours. Here are the primary reasons why:
        </p>

        {reasonsList.length > 0 ? (
          <ul className="space-y-4">
            {reasonsList.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <Target className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-700 text-sm">{reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
            <p className="text-gray-500 text-sm">No specific rejection reasons detected.</p>
          </div>
        )}
      </div>

      {/* Module 8: Competitor Analysis */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Competitor Analysis</h2>
        </div>
        
        <p className="text-gray-600 mb-6 text-sm">
          When AI didn't recommend your business, it preferred these competitors instead:
        </p>

        {topCompetitors.length > 0 ? (
          <div className="space-y-4">
            {topCompetitors.map(([name, count], idx) => (
              <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs uppercase">
                    {name.charAt(0)}
                  </div>
                  <span className="font-semibold text-gray-900">{name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Recommended</span>
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{count} times</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
            <p className="text-gray-500 text-sm">No competitors detected in the AI responses.</p>
          </div>
        )}
      </div>
    </div>
  );
}
