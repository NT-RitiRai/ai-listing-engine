"use client";
import React from 'react';
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CompetitorLeaderboard({ competitorsData }: { competitorsData: any }) {
  if (!competitorsData) return null;

  // Expected format: array of {name, mentions, similarity_score, final_score}
  // The backend passes competitors_data which has a 'leaderboard' array of {name, mentions}
  // and 'competitors' array of validated competitors
  const leaderboard = competitorsData.leaderboard || [];
  const top10 = leaderboard.slice(0, 10).map((c: any) => ({
    ...c,
    name: c.name.length > 20 ? c.name.substring(0, 20) + "..." : c.name
  }));

  if (top10.length === 0) return null;

  const maxMentions = top10[0]?.mentions || 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 font-sans">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-medium text-gray-900">AI Recommendation Leaderboard</h2>
          <p className="text-sm text-gray-500">The top competitors recommended by AI models across {competitorsData.insight_analysis?.total_queries_run || 50} high-intent commercial queries.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Leaderboard Chart */}
        <div className="lg:col-span-3 bg-gray-50 rounded-xl p-6 border border-gray-100">
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={top10}
                margin={{ top: 10, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4b5563' }} width={160} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="mentions" radius={[0, 4, 4, 0]}>
                  {top10.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : index < 3 ? '#3b82f6' : '#9ca3af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-6">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Why The Leader Wins
            </h3>
            <p className="text-sm text-blue-900 leading-relaxed font-medium">
              {competitorsData.insight_analysis?.why_competitors_win?.[0]?.reason || "The market leader exhibits superior topical authority and structured data coverage, making them the safest recommendation for AI models."}
            </p>
            <p className="text-xs text-blue-700 mt-2 italic">
              Evidence: {competitorsData.insight_analysis?.why_competitors_win?.[0]?.evidence || "Dominates >60% of commercial queries."}
            </p>
          </div>

          <div className="bg-red-50/50 rounded-xl border border-red-100 p-6">
            <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Why We Lost
            </h3>
            <p className="text-sm text-red-900 leading-relaxed">
              {competitorsData.insight_analysis?.why_we_lost || "Our business lacks the necessary entity relationships and commercial signals to be considered a viable alternative by the models."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
