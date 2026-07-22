"use client";

import { CheckCircle, Clock, TrendingUp, Zap, Target, ArrowRight, Activity, Map } from "lucide-react";

interface Page19Props { recommendations: any[]; }

export default function Page19Roadmap({ recommendations }: Page19Props) {
  // Buckets
  const days30: any[] = [];
  const days60: any[] = [];
  const days90: any[] = [];

  let totVis30 = 0, totCit30 = 0, totRec30 = 0;
  let totVis60 = 0, totCit60 = 0, totRec60 = 0;
  let totVis90 = 0, totCit90 = 0, totRec90 = 0;

  recommendations?.forEach(r => {
    const isCritical = r.priority_score === 1 || r.priority === 'Critical';
    const isHigh = r.priority_score === 2 || r.priority === 'High';
    
    // Simulate parseable numbers from string like "+15-25%"
    const parseGain = (str: string, defaultVal: number) => {
      if (!str) return defaultVal;
      const match = str.match(/\d+/);
      return match ? parseInt(match[0], 10) : defaultVal;
    };

    const vGain = parseGain(r.estimated_visibility_increase, 0);
    const cGain = parseGain(r.estimated_citation_increase, 0);
    const rGain = parseGain(r.estimated_recommendation_increase, 0);

    const timeline = r.timeline ? r.timeline.toLowerCase() : "";

    if (isCritical || timeline.includes("week") || timeline.includes("day")) {
      days30.push(r);
      totVis30 += vGain; totCit30 += cGain; totRec30 += rGain;
    } else if (isHigh || timeline.includes("1-2 month") || timeline.includes("2 month")) {
      days60.push(r);
      totVis60 += vGain; totCit60 += cGain; totRec60 += rGain;
    } else {
      days90.push(r);
      totVis90 += vGain; totCit90 += cGain; totRec90 += rGain;
    }
  });

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
        <h1>Action Plan & Roadmap</h1>
        <p className="text-xl text-gray-500">Your structured timeline to achieve AI visibility dominance.</p>
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Continuous Line */}
        <div className="absolute left-8 top-12 bottom-12 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full hidden md:block"></div>

        <div className="space-y-12">
          
          {/* 30 Days: Quick Wins */}
          <div className="relative flex flex-col md:flex-row gap-8">
            <div className="hidden md:flex shrink-0 w-16 h-16 rounded-full bg-white border-4 border-indigo-500 items-center justify-center z-10 shadow-sm relative -ml-7.5 mt-4">
              <Zap className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden group hover:border-indigo-300 transition-colors">
              <div className="bg-indigo-50 border-b border-indigo-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-indigo-900">30 Days — Quick Wins</h3>
                  <p className="text-indigo-700 font-medium">Critical structural fixes and immediate visibility unblockers.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-200 shadow-sm shrink-0">
                  <div className="text-center px-3 border-r border-gray-100">
                    <div className="text-lg font-black text-indigo-600">+{totVis30}%</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Visibility</div>
                  </div>
                  <div className="text-center px-3 border-r border-gray-100">
                    <div className="text-lg font-black text-pink-600">+{totCit30}%</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Citations</div>
                  </div>
                  <div className="text-center px-3">
                    <div className="text-lg font-black text-emerald-600">+{totRec30}%</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Recs</div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-4">
                  {days30.length > 0 ? days30.map((r, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-900">{r.problem}</h4>
                        <p className="text-sm text-gray-500 mt-1">{r.solution || r.technical_cause}</p>
                      </div>
                    </li>
                  )) : (
                    <li className="text-gray-400 italic">No critical 30-day items detected. AI foundation is solid.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* 60 Days: Authority Building */}
          <div className="relative flex flex-col md:flex-row gap-8">
            <div className="hidden md:flex shrink-0 w-16 h-16 rounded-full bg-white border-4 border-purple-500 items-center justify-center z-10 shadow-sm relative -ml-7.5 mt-4">
              <Activity className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden group hover:border-purple-300 transition-colors">
              <div className="bg-purple-50 border-b border-purple-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-purple-900">60 Days — Authority Building</h3>
                  <p className="text-purple-700 font-medium">Deepening entity relationships and scaling citations.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-purple-200 shadow-sm shrink-0">
                  <div className="text-center px-3 border-r border-gray-100">
                    <div className="text-lg font-black text-indigo-600">+{totVis60}%</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Visibility</div>
                  </div>
                  <div className="text-center px-3 border-r border-gray-100">
                    <div className="text-lg font-black text-pink-600">+{totCit60}%</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Citations</div>
                  </div>
                  <div className="text-center px-3">
                    <div className="text-lg font-black text-emerald-600">+{totRec60}%</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Recs</div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-4">
                  {days60.length > 0 ? days60.map((r, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-900">{r.problem}</h4>
                        <p className="text-sm text-gray-500 mt-1">{r.solution || r.technical_cause}</p>
                      </div>
                    </li>
                  )) : (
                    <li className="text-gray-400 italic">Expand local citations and launch targeted informational content campaigns.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* 90 Days: AI Optimization */}
          <div className="relative flex flex-col md:flex-row gap-8">
            <div className="hidden md:flex shrink-0 w-16 h-16 rounded-full bg-white border-4 border-pink-500 items-center justify-center z-10 shadow-sm relative -ml-7.5 mt-4">
              <TrendingUp className="w-6 h-6 text-pink-500" />
            </div>
            <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden group hover:border-pink-300 transition-colors">
              <div className="bg-pink-50 border-b border-pink-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-pink-900">90 Days — AI Optimization</h3>
                  <p className="text-pink-700 font-medium">Fine-tuning commercial recommendations and dominating intent categories.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-pink-200 shadow-sm shrink-0">
                  <div className="text-center px-3 border-r border-gray-100">
                    <div className="text-lg font-black text-indigo-600">+{totVis90}%</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Visibility</div>
                  </div>
                  <div className="text-center px-3 border-r border-gray-100">
                    <div className="text-lg font-black text-pink-600">+{totCit90}%</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Citations</div>
                  </div>
                  <div className="text-center px-3">
                    <div className="text-lg font-black text-emerald-600">+{totRec90}%</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Recs</div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-4">
                  {days90.length > 0 ? days90.map((r, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <ArrowRight className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-900">{r.problem}</h4>
                        <p className="text-sm text-gray-500 mt-1">{r.solution || r.technical_cause}</p>
                      </div>
                    </li>
                  )) : (
                    <li className="text-gray-400 italic">Continuous algorithmic alignment, content gap closure, and brand dominance.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
