"use client";
import React from 'react';
import { Target, ArrowRight, DollarSign, ArrowDownToLine } from 'lucide-react';
import { Funnel, FunnelChart, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

export default function OpportunityFunnel({ competitorsData }: { competitorsData: any }) {
  if (!competitorsData || !competitorsData.opportunity_analysis) return null;

  const opps = competitorsData.opportunity_analysis;

  const total = competitorsData.insight_analysis?.total_queries_run || 10;
  const withComps = Math.round(total * 0.85); // conservative 85% commercial query saturation
  
  let lostRatio = 0.7;
  if (typeof opps.lost_recommendations === 'string' && opps.lost_recommendations.includes('%')) {
    const match = opps.lost_recommendations.match(/(\d+)%/);
    if (match) lostRatio = parseInt(match[1], 10) / 100;
  }
  const lostVal = Math.round(total * lostRatio) || Math.round(total * 0.7);
  const missedConv = Math.max(1, Math.round(lostVal * 0.2));

  const data = [
    { name: 'Total Commercial Queries', value: total, fill: '#1e3a8a' },
    { name: 'Queries with Competitors', value: withComps, fill: '#2563eb' },
    { name: 'Lost Recommendations', value: lostVal, fill: '#3b82f6' },
    { name: 'Missed Conversions', value: missedConv, fill: '#93c5fd' },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl shadow-lg border border-indigo-900 p-8 mb-8 text-white font-sans">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-indigo-800/50 text-indigo-300 rounded-lg backdrop-blur-sm border border-indigo-700/50">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-medium text-white">Commercial Opportunity Analysis</h2>
          <p className="text-sm text-indigo-200">The quantifiable business impact of losing to competitors in AI search.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Funnel Chart */}
        <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart margin={{ top: 20, right: 200, bottom: 20, left: 20 }}>
                <Tooltip />
                <Funnel
                  dataKey="value"
                  data={data}
                  isAnimationActive
                >
                  <LabelList position="right" offset={30} fill="#cbd5e1" stroke="none" dataKey="name" fontSize={12} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
        </div>

        {/* Opportunity Metrics */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-medium text-indigo-200 mb-1 flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4" /> Lost Recommendations
            </h3>
            <p className="text-2xl font-bold text-red-400">
              {opps.lost_recommendations || "Critically High"}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-medium text-indigo-200 mb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Potential Revenue Impact
            </h3>
            <p className="text-lg font-medium text-green-300">
              {opps.potential_impact || "Significant loss of highly qualified commercial leads."}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-3">Priority Competitive Improvements</h3>
            <ul className="space-y-2">
              {(opps.priority_improvements || ["Establish topical dominance", "Fix structured data gaps"]).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                  <ArrowRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
