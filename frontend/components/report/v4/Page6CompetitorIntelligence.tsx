"use client";

import { Trophy, ShieldAlert, Target, Users, Zap, SearchX } from "lucide-react";

export default function Page6CompetitorIntelligence({ competitorsData }: { competitorsData: any }) {
  const leaderboard = competitorsData?.leaderboard || [];
  const top10 = leaderboard.slice(0, 10);
  
  const whyWeLost = competitorsData?.insight_analysis?.why_we_lost || "Our business lacks the necessary entity relationships and commercial signals to be considered a viable alternative by the models.";
  const whyTheyWon = competitorsData?.insight_analysis?.why_competitors_win?.[0] || {
    reason: "The market leader exhibits superior topical authority and structured data coverage.",
    evidence: "Dominates high-intent queries."
  };

  if (!competitorsData || top10.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-200">
        <SearchX className="w-12 h-12 mb-4 opacity-20" />
        <h3 className="text-xl font-medium">No Competitor Data Available</h3>
        <p>Competitor analysis has not been completed or yielded no results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
        <h1>AI Recommendations</h1>
        <p className="text-xl text-gray-500">Who AI prefers when users search for your services.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4 text-indigo-600">
              <Trophy className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900">Recommendation Leaderboard</h3>
            </div>
            <p className="text-gray-500 text-sm mb-6">AI models consistently recommend these brands over yours for commercial queries.</p>
            
            <div className="space-y-4">
              {top10.map((comp: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-900 shadow-sm border border-gray-200 shrink-0">
                      {idx + 1}
                    </div>
                    <span className="font-bold text-gray-900 truncate" title={comp.name}>{comp.name}</span>
                  </div>
                  <span className="font-bold text-indigo-600">{comp.mentions} mentions</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Why AI Selected Them (And Ignored Us)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100%-4rem)]">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col">
              <div className="flex items-center gap-2 text-emerald-700 font-bold mb-4">
                <ShieldAlert className="w-6 h-6" />
                Their Advantage
              </div>
              <p className="text-emerald-900 font-medium leading-relaxed mb-4 flex-1">
                {whyTheyWon.reason}
              </p>
              <div className="bg-white/60 p-4 rounded-lg border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1">Evidence</h4>
                <p className="text-sm text-emerald-900">{whyTheyWon.evidence}</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex flex-col">
              <div className="flex items-center gap-2 text-red-700 font-bold mb-4">
                <Target className="w-6 h-6" />
                Our Vulnerability
              </div>
              <p className="text-red-900 font-medium leading-relaxed flex-1">
                {whyWeLost}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
