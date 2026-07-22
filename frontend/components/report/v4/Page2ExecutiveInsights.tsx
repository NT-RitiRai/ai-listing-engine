"use client";

import {
  Activity, AlertTriangle, CheckCircle, TrendingDown, TrendingUp,
  Lightbulb, Zap, BarChart2, ShieldCheck, Star, Globe, Link,
  Brain, Award, Target
} from "lucide-react";

interface Page2ExecutiveInsightsProps {
  intelligence: any;
  recommendations: any[];
  scores: any;
}

function ScoreGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const clamp = Math.min(Math.max(Math.round(value || 0), 0), 100);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (clamp / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} stroke="#e5e7eb" strokeWidth="8" fill="none" />
          <circle
            cx="48" cy="48" r={radius}
            stroke={color} strokeWidth="8" fill="none"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-gray-900">{clamp}</span>
        </div>
      </div>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide text-center leading-tight">{label}</span>
    </div>
  );
}

export default function Page2ExecutiveInsights({ intelligence, recommendations, scores }: Page2ExecutiveInsightsProps) {
  const breakdown = scores?.breakdown || {};

  // --- Derive all KPI scores from the actual backend data ---
  const overallScore     = Math.round(scores?.overall_score || 0);
  const aiReadinessScore = Math.round(scores?.ai_readiness_score || 0);
  const seoScore         = Math.round(scores?.seo_score || 0);
  const aeoScore         = Math.round(scores?.aeo_score || 0);
  const geoScore         = Math.round(scores?.geo_score || 0);

  // Derived from breakdown signals since backend doesn't store them individually
  const schemaCoverage   = breakdown?.aeo?.signals?.schema_coverage?.percentage || 0;
  const entityCoverage   = breakdown?.aeo?.signals?.entity_coverage?.points      || 0; // 0–20 range
  const faqCoverage      = breakdown?.aeo?.signals?.faq_coverage?.percentage      || 0;
  const reviewsPresent   = breakdown?.geo?.signals?.reviews_authority?.pages      || 0;
  const authorityPts     = breakdown?.ai?.signals?.authority_signals?.points      || 0; // 0–20
  const contentDepth     = breakdown?.aeo?.signals?.content_depth?.avg_word_count || 0;

  // Use only exact scores provided by the backend
  const kpis = [
    { label: "AI Visibility Score",    value: overallScore,     color: "#6366f1", icon: Activity },
    { label: "AI Readiness Score",     value: aiReadinessScore, color: "#8b5cf6", icon: Brain },
    { label: "SEO Architecture",       value: seoScore,         color: "#10b981", icon: Target },
    { label: "AEO Entity Signal",      value: aeoScore,         color: "#3b82f6", icon: Link },
    { label: "GEO Local Setup",        value: geoScore,         color: "#0ea5e9", icon: Globe },
  ];

  // --- Generate Executive Insights automatically from real data ---
  const allInsights: { type: "positive" | "warning" | "danger" | "opportunity"; icon: any; text: string }[] = [];

  // Positive signals
  if (schemaCoverage > 90) {
    allInsights.push({ type: "positive", icon: CheckCircle, text: "AI understands your structured entity signals — schema coverage is strong across your website." });
  }
  if (contentDepth > 700) {
    allInsights.push({ type: "positive", icon: CheckCircle, text: "Your content depth is recognized by AI — average word count signals topical authority." });
  }
  if (geoScore > 40) {
    allInsights.push({ type: "positive", icon: CheckCircle, text: "Local AI presence is established — your contact and location signals are indexed by AI crawlers." });
  }

  // Warning signals
  if (aeoScore < 20) {
    allInsights.push({ type: "danger", icon: AlertTriangle, text: "AI ignores your commercial pages — your purchase-intent and transactional content is invisible to AI recommendation engines." });
  }
  if (faqCoverage < 15) {
    allInsights.push({ type: "warning", icon: TrendingDown, text: "Conversational AI fails to answer queries about you — FAQ & Q&A schema is critically missing." });
  }
  if (reviewsPresent === 0) {
    allInsights.push({ type: "warning", icon: TrendingDown, text: "Citation signals are missing — no external reviews or authority mentions detected. AI models deprioritize unverified entities." });
  }
  if (schemaCoverage < 20) {
    allInsights.push({ type: "danger", icon: AlertTriangle, text: "Your competitors dominate purchase intent — AI recommendation engines are missing your core AEO signals." });
  }

  // Opportunities
  const criticalRecs = (recommendations || []).filter(r => r.priority_score === 1);
  const totalVisibilityIncrease = (recommendations || []).reduce((sum: number, r: any) => {
    const match = (r.estimated_visibility_increase || "").match(/\+(\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);

  if (totalVisibilityIncrease > 0) {
    allInsights.push({ type: "opportunity", icon: TrendingUp, text: `Commercial opportunity is high — fixing ${criticalRecs.length} critical gaps could unlock up to +${totalVisibilityIncrease}% AI visibility lift.` });
  }
  if (overallScore < 50) {
    allInsights.push({ type: "opportunity", icon: Lightbulb, text: "Low base visibility means every optimization delivers outsized ROI — this is the best time to capture AI share of mind." });
  }

  const typeConfig = {
    positive:    { bg: "bg-emerald-50", border: "border-emerald-200", iconColor: "text-emerald-600", label: "Strength",   labelBg: "bg-emerald-100 text-emerald-700" },
    warning:     { bg: "bg-amber-50",   border: "border-amber-200",   iconColor: "text-amber-600",   label: "Risk",       labelBg: "bg-amber-100 text-amber-700" },
    danger:      { bg: "bg-red-50",     border: "border-red-200",     iconColor: "text-red-600",     label: "Critical",   labelBg: "bg-red-100 text-red-700" },
    opportunity: { bg: "bg-indigo-50",  border: "border-indigo-200",  iconColor: "text-indigo-600",  label: "Opportunity",labelBg: "bg-indigo-100 text-indigo-700" },
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 2
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Executive Summary</h1>
        <p className="text-xl text-gray-500">A complete AI visibility scorecard for leadership decision-making.</p>
      </div>

      {/* Overall Score Hero */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -top-8 -right-8 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-3">Primary KPI</p>
            <h2 className="text-2xl font-bold text-white mb-2">Overall AI Visibility Score</h2>
            <p className="text-indigo-200 max-w-md leading-relaxed">This composite score measures how well AI models discover, understand, and recommend your business. A score below 50 signals critical gaps in AI market presence.</p>
          </div>
          <div className="relative shrink-0">
            <div className="w-40 h-40 rounded-full border-8 border-indigo-400/30 flex items-center justify-center bg-white/5 backdrop-blur-sm shadow-inner">
              <div className="text-center">
                <div className="text-5xl font-black text-white">{overallScore}</div>
                <div className="text-indigo-300 text-sm font-bold tracking-wider">/100</div>
              </div>
            </div>
            <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-black tracking-widest ${overallScore < 40 ? 'bg-red-500' : overallScore < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}>
              {overallScore < 40 ? 'CRITICAL' : overallScore < 60 ? 'MODERATE' : 'STRONG'}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-lg">KPI Scorecard</h3>
          </div>
          <span className="text-xs font-medium text-gray-500">Derived from live extraction data</span>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 justify-items-center">
            {kpis.map((kpi) => (
              <ScoreGauge key={kpi.label} value={kpi.value} label={kpi.label} color={kpi.color} />
            ))}
          </div>
        </div>
      </div>

      {/* Executive Insights */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-900 text-xl">Executive Insights</h3>
        </div>
        
        {allInsights.length === 0 && (
          <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-500">
            <Lightbulb className="w-10 h-10 opacity-20 mx-auto mb-3" />
            <p className="font-medium">Insights will appear once analysis is complete.</p>
          </div>
        )}

        <div className="space-y-3">
          {allInsights.map((insight, i) => {
            const cfg = typeConfig[insight.type];
            const Icon = insight.icon;
            return (
              <div key={i} className="break-inside-avoid">
                <div className={`${cfg.bg} ${cfg.border} border rounded-xl p-4 flex items-start gap-4`}>
                  <div className={`shrink-0 mt-0.5 ${cfg.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium leading-relaxed">{insight.text}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.labelBg}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
