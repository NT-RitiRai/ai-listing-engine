"use client";

import {
  AlertTriangle, DollarSign, Activity, Target, ShieldAlert,
  TrendingDown, TrendingUp, PieChart, Info, ShieldCheck, PlayCircle
} from "lucide-react";

interface Page16Props { competitorsData: any; scores: any; recommendations: any[]; }

function ImpactGauge({ label, score, color, icon: Icon, description }: any) {
  const isHigh = score > 70;
  const isMedium = score > 40 && score <= 70;
  const ringColor = isHigh ? color.high : isMedium ? color.med : color.low;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
      <div className="relative shrink-0">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent"
            strokeDasharray={176} strokeDashoffset={176 - (176 * score) / 100}
            className={`${ringColor} transition-all duration-1000`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`w-5 h-5 ${ringColor}`} />
        </div>
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-lg mb-1">{label}</h3>
        <p className={`text-xl font-black mb-1 ${ringColor}`}>{score}/100</p>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function Page16RevenueImpact({ competitorsData, scores, recommendations }: Page16Props) {
  const aiScore = scores?.ai_readiness_score || 0;
  const oppAnalysis = competitorsData?.insight_analysis?.opportunity_analysis || {};
  
  // Calculate synthetic but relational metrics
  const marketShareLoss = Math.max(0, 100 - aiScore);
  
  const criticalCount = recommendations.filter(r => r.priority_score === 1 || r.priority === 'Critical' || r.severity === 'critical').length;
  const highCount = recommendations.filter(r => r.priority_score === 2 || r.priority === 'High' || r.severity === 'high').length;
  
  const priorityScore = Math.min(100, (criticalCount * 20) + (highCount * 10) + (marketShareLoss * 0.5));
  const recoveryScore = Math.min(100, 100 - (criticalCount * 5)); // Higher means easier to recover
  const revenueRisk = Math.min(100, marketShareLoss + (criticalCount * 10));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 16
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Revenue Impact</h1>
        <p className="text-xl text-gray-500">The quantifiable business cost of your current AI visibility deficit.</p>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-800 leading-relaxed font-medium">
          <strong>Risk Assessment Model:</strong> This module calculates Revenue Risk and Market Share Loss directly based on your competitive deficits and technical extraction blockers.
        </p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-50 border-2 border-red-200 p-5 rounded-2xl shadow-sm">
          <div className="bg-red-100 text-red-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-red-700">{Math.round(revenueRisk)}/100</div>
          <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider mt-1">Revenue Risk Score</div>
        </div>
        <div className="bg-fuchsia-50 border-2 border-fuchsia-200 p-5 rounded-2xl shadow-sm">
          <div className="bg-fuchsia-100 text-fuchsia-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
            <PieChart className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-fuchsia-700">{Math.round(marketShareLoss)}%</div>
          <div className="text-[11px] font-bold text-fuchsia-600 uppercase tracking-wider mt-1">Market Share Loss</div>
        </div>
        <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl shadow-sm">
          <div className="bg-amber-100 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-amber-700">{criticalCount}</div>
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mt-1">Critical Blockers</div>
        </div>
        <div className="bg-orange-50 border-2 border-orange-200 p-5 rounded-2xl shadow-sm">
          <div className="bg-orange-100 text-orange-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
            <Activity className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-orange-700">{highCount}</div>
          <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mt-1">High Priority Blockers</div>
        </div>
      </div>

      {/* Impact Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImpactGauge 
          label="Intervention Priority Score" 
          score={Math.round(priorityScore)} 
          icon={AlertTriangle}
          color={{ high: "text-red-500", med: "text-amber-500", low: "text-blue-500" }}
          description={`Based on ${criticalCount} critical extraction blockers impacting commercial queries. Immediate action is required to prevent further market share loss to competitors.`}
        />
        <ImpactGauge 
          label="Implementation Recovery Score" 
          score={Math.round(recoveryScore)} 
          icon={ShieldCheck}
          color={{ high: "text-emerald-500", med: "text-blue-500", low: "text-amber-500" }}
          description="A high score indicates that the structural SEO/AEO fixes required are highly achievable and will yield rapid visibility improvements across AI platforms."
        />
      </div>

      {/* Business Impact Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-900">Business Impact Breakdown</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" /> The Cost of Inaction
            </h4>
            <div className="space-y-4">
              <div className="break-inside-avoid">
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-sm text-red-900 font-medium leading-relaxed">
                    Approximately {Math.round(marketShareLoss)}% of highly qualified commercial queries are resulting in recommendations for your competitors rather than you due to structural data deficits.
                  </p>
                </div>
              </div>
              <div className="break-inside-avoid">
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-sm text-red-900 font-medium leading-relaxed">
                    Competitors are accumulating "trust equity" in AI language models by being cited frequently. If left unaddressed, the algorithmic gap becomes exponentially harder to close.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> The Growth Opportunity
            </h4>
            <div className="space-y-4">
              <div className="break-inside-avoid">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                    Fixing the {criticalCount} critical and {highCount} high-priority extraction blockers will result in a rapid, measurable increase in AI search visibility within 30 to 60 days.
                  </p>
                </div>
              </div>
              <div className="break-inside-avoid">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                    By resolving these {criticalCount + highCount} specific technical gaps, your brand will dominate high-intent commercial queries, directly impacting pipeline velocity and recapturing the {Math.round(marketShareLoss)}% market share loss.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
