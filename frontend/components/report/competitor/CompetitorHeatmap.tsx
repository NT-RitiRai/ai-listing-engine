"use client";
import React from 'react';
import { LayoutGrid } from 'lucide-react';

export default function CompetitorHeatmap({ competitorsData }: { competitorsData: any }) {
  if (!competitorsData || !competitorsData.competitors) return null;

  const topCompetitors = competitorsData.competitors.slice(0, 5);
  if (topCompetitors.length === 0) return null;
  const intents = ['Commercial', 'Informational', 'Comparison', 'Transactional', 'Location'];

  const getScore = (compName: string, intent: string) => {
    const matrix = competitorsData.insight_analysis?.intent_matrix;
    if (!matrix) return 50;
    
    const compData = matrix.find((m: any) => m.company.toLowerCase() === compName.toLowerCase());
    if (compData && compData.scores && typeof compData.scores[intent] === 'number') {
      return compData.scores[intent];
    }
    return 50;
  };

  const getColorClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-500 text-white';
    if (score >= 60) return 'bg-emerald-300 text-emerald-900';
    if (score >= 40) return 'bg-amber-300 text-amber-900';
    if (score >= 20) return 'bg-red-300 text-red-900';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 font-sans overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
          <LayoutGrid className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-medium text-gray-900">Intent Dominance Heatmap</h2>
          <p className="text-sm text-gray-500">Identifies which competitors dominate specific types of AI search queries.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4 rounded-tl-xl border-b border-gray-100">Competitor</th>
              {intents.map(intent => (
                <th key={intent} className="px-6 py-4 border-b border-gray-100 text-center">{intent}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topCompetitors.map((comp: any, i: number) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{comp.company_name}</td>
                {intents.map((intent, j) => {
                  const score = getScore(comp.company_name, intent);
                  return (
                    <td key={j} className="px-6 py-3 text-center">
                      <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center font-bold text-xs ${getColorClass(score)}`}>
                        {Math.round(score)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex items-center justify-end gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500"></div> Very Weak</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-300"></div> Moderate</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500"></div> Dominant</span>
      </div>
    </div>
  );
}
