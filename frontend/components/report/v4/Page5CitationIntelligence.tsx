"use client";

import {
  Link, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown,
  FileText, Star, BarChart2, BookOpen, Globe, MapPin, Search, Clock,
  Shield, Zap, Info
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";

interface Page5Props {
  intelligence: any;
  scores: any;
  prompts?: any[];
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    label: "Critical"  },
  high:     { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", label: "High"      },
  medium:   { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  label: "Medium"    },
  low:      { color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   label: "Low"       },
};

function CircleGauge({ value, label, color, size = "lg" }: { value: number; label: string; color: string; size?: "sm" | "lg" }) {
  const r = size === "lg" ? 44 : 28;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(value, 100) / 100) * circ;
  const dim  = size === "lg" ? 112 : 72;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={dim/2} cy={dim/2} r={r} stroke="#e5e7eb" strokeWidth={size === "lg" ? 9 : 7} fill="none" />
          <circle cx={dim/2} cy={dim/2} r={r} stroke={color} strokeWidth={size === "lg" ? 9 : 7} fill="none"
            strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-black ${size === "lg" ? "text-2xl" : "text-base"} text-gray-900`}>{value}</span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide text-center leading-tight">{label}</span>
    </div>
  );
}

export default function Page5CitationIntelligence({ intelligence, scores, prompts = [] }: Page5Props) {
  const aeo      = scores?.breakdown?.aeo    || {};
  const ai       = scores?.breakdown?.ai     || {};
  const seo      = scores?.breakdown?.seo    || {};
  const geo      = scores?.breakdown?.geo    || {};
  const signals  = aeo.signals               || {};
  const aiSig    = ai.signals                || {};
  const seoSig   = seo.signals              || {};
  const geoSig   = geo.signals               || {};
  const issues   = aeo.issues                || [];

  const services  = intelligence?.services   || [];
  const locations = intelligence?.locations  || [];
  const topics    = intelligence?.primary_topics || [];

  // ── Core citation scores ───────────────────────────────────────────────────
  const schemaPct     = signals.schema_coverage?.percentage    || 0;
  const faqPct        = signals.faq_coverage?.percentage       || 0;
  const faqTotal      = signals.faq_coverage?.total_faqs       || 0;
  const faqPages      = signals.faq_coverage?.pages            || 0;
  const schemaPages   = signals.schema_coverage?.pages         || 0;
  const totalPages    = signals.schema_coverage?.total_pages   || 1;
  const schemaTypes   = signals.schema_coverage?.schema_types  || [];
  const entityPts     = signals.entity_coverage?.points        || 0;
  const contentDepth  = signals.content_depth?.avg_word_count  || 0;
  const authorityPts  = aiSig.authority_signals?.points        || 0;
  const reviewCount   = geoSig.reviews_authority?.pages        || 0;

  let totalEvaluated = 0;
  let totalCitationScore = 0;
  prompts.forEach(p => {
    const pr = p.playground_results;
    if (pr && pr.citation_readiness) {
      totalEvaluated++;
      totalCitationScore += pr.citation_readiness.overall_score || 0;
    }
  });

  const hasLiveData = totalEvaluated > 0;
  const liveCitationRate = totalEvaluated > 0 ? Math.round(totalCitationScore / totalEvaluated) : 0;

  // Derived citation score (0-100)
  const citationScore = hasLiveData ? liveCitationRate : Math.min(Math.round(schemaPct * 0.35 + faqPct * 0.30 + (entityPts / 20) * 20 + (authorityPts / 20) * 15), 100);
  const citationRate  = hasLiveData ? liveCitationRate : Math.min(Math.round((schemaPct + faqPct) / 2), 100);
  const qualityScore  = hasLiveData ? (liveCitationRate > 0 ? Math.min(Math.round(schemaPct * 0.5 + (entityPts / 20) * 30 + (reviewCount > 0 ? 20 : 0)), 100) : 0) : Math.min(Math.round(schemaPct * 0.5 + (entityPts / 20) * 30 + (reviewCount > 0 ? 20 : 0)), 100);
  const growthPotential = 100 - citationScore;

  // Helper to get real live citation score
  const getLiveScore = (p: any) => {
    const pr = p.playground_results;
    if (pr && pr.citation_readiness) return pr.citation_readiness.overall_score || 0;
    return 0;
  };

  // ── Citation by prompt (from playground) ───────────────────────────────────
  const promptCitations = prompts.map(p => ({
    text: p.prompt_text,
    intent: p.intent,
    citation: getLiveScore(p),
    isPending: !p.playground_results,
  }));

  // ── Citation by AI model (real data from prompts) ───────────────────────────
  let chatGptCitations = 0;
  let geminiCitations = 0;
  let gptTotal = 0;
  let gemTotal = 0;

  prompts.forEach(p => {
    const live = p.playground_results?.live;
    if (live) {
      if (live.openai) {
        gptTotal++;
        if (live.openai.citation_found) chatGptCitations++;
      }
      if (live.gemini) {
        gemTotal++;
        if (live.gemini.citation_found) geminiCitations++;
      }
    }
  });

  const modelCitationData = [
    { model: "ChatGPT", score: gptTotal > 0 ? Math.round((chatGptCitations / gptTotal) * 100) : 0, color: "#10b981" },
    { model: "Gemini",  score: gemTotal > 0 ? Math.round((geminiCitations / gemTotal) * 100) : 0, color: "#3b82f6" },
  ];

  // ── Citation by intent ──────────────────────────────────────────────────────
  const intentGroups: Record<string, number[]> = {};
  prompts.forEach(p => {
    const intent = p.intent || "General";
    const score  = getLiveScore(p);
    if (!intentGroups[intent]) intentGroups[intent] = [];
    intentGroups[intent].push(score);
  });
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
  const intentCitationData = Object.keys(intentGroups).map(intent => ({
    intent, score: avg(intentGroups[intent]) // strict average
  }));

  // ── Citation by service (derived from related intent scores) ────
  const commScore = intentGroups["Commercial"] ? avg(intentGroups["Commercial"]) : 0;
  const recScore = intentGroups["Recommendation"] ? avg(intentGroups["Recommendation"]) : 0;
  const fallbackSvc = Math.round(schemaPct * 0.5 + faqPct * 0.5);
  const avgServiceScore = (commScore + recScore) > 0 ? Math.round((commScore + recScore) / 2) : (promptCitations.some(p => !p.isPending) ? 0 : fallbackSvc);

  const serviceCitationData = services.map((svc: string) => ({
    name: svc.length > 18 ? svc.slice(0, 16) + "…" : svc,
    fullName: svc,
    score: avgServiceScore,
    color: "#6366f1",
  }));

  // ── Citation by location ────────────────────────────────────────────────────
  const localScore = intentGroups["Local"] ? avg(intentGroups["Local"]) : (promptCitations.some(p => !p.isPending) ? 0 : (geoSig.local_schema?.present ? 100 : 0));
  const locationCitationData = locations.map((loc: string) => ({
    location: loc,
    score: localScore,
  }));

  // ── Missing citations ───────────────────────────────────────────────────────
  const missingCitations = [
    !issues.find((i: any) => i.type === "missing_review_schema") ? null : { item: "Review & Rating Schema", impact: "High", reason: "AI models deprioritize businesses without social proof signals" },
    faqPct < 20 ? { item: "FAQ Schema for Commercial Pages", impact: "Critical", reason: `Only ${faqPages}/${totalPages} pages have FAQ content. AI can't answer queries about you.` } : null,
    !schemaTypes.includes("Product") ? { item: "Product Schema", impact: "High", reason: "Products are not machine-readable, blocking commercial AI citations" } : null,
    !schemaTypes.includes("Article") ? { item: "Article / Content Schema", impact: "Medium", reason: "Blog and content pages lack Article schema, reducing citation in informational queries" } : null,
    reviewCount === 0 ? { item: "External Review Citations", impact: "High", reason: "No third-party reviews detected. AI models use reviews as trust signals for citations." } : null,
    !schemaTypes.includes("BreadcrumbList") ? { item: "Breadcrumb Schema", impact: "Low", reason: "Navigation structure not exposed to AI, reducing contextual understanding" } : null,
  ].filter(Boolean) as { item: string; impact: string; reason: string }[];

  // Trend line data (strictly flatlined to current real score, no simulated history)
  const trendData = [
    { month: "Month 1", citation: citationScore },
    { month: "Month 2", citation: citationScore },
    { month: "Month 3", citation: citationScore },
    { month: "Current", citation: citationScore },
    { month: "Projected", citation: citationScore },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 5
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Brand Mentions</h1>
        <p className="text-xl text-gray-500">How often, where, and why AI models cite your business in their responses.</p>
      </div>

      {/* Hero KPI Row */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
        <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-6">Citation Overview</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
          <CircleGauge value={citationScore}    label="Citation Score"    color="#6366f1" />
          <CircleGauge value={citationRate}     label="Citation Rate"     color="#3b82f6" />
          <CircleGauge value={qualityScore}     label="Citation Quality"  color="#10b981" />
          <CircleGauge value={growthPotential}  label="Growth Potential"  color="#f59e0b" />
        </div>
      </div>

      {/* Schema & Signal Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Schema Coverage",  value: `${schemaPct}%`,  sub: `${schemaPages}/${totalPages} pages`, icon: Shield,   color: "text-indigo-600", bg: "bg-indigo-50"  },
          { label: "FAQ Coverage",     value: `${faqPct}%`,     sub: `${faqTotal} FAQs on ${faqPages} pages`, icon: BookOpen, color: "text-blue-600",   bg: "bg-blue-50"    },
          { label: "Entity Coverage",  value: `${Math.round((entityPts/20)*100)}%`, sub: `${entityPts} / 20 pts`, icon: Globe,    color: "text-emerald-600",bg: "bg-emerald-50" },
          { label: "Content Depth",    value: `${contentDepth}`,sub: "Avg words / page",   icon: FileText, color: "text-purple-600", bg: "bg-purple-50"  },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className={`${card.bg} ${card.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-gray-900">{card.value}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">{card.label}</div>
              <div className="text-xs text-gray-500 mt-1">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Citation Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Citation Trend & Projection</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} formatter={(v: any) => [`${v}%`]} />
                <Line isAnimationActive={false} type="monotone" dataKey="citation" stroke="#6366f1" strokeWidth={3} dot={{ fill: "#6366f1", r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Citation Distribution (Pie) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Citation Distribution</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie isAnimationActive={false} data={[
                  { name: "Schema",  value: Math.round(schemaPct * 0.35) },
                  { name: "FAQ",     value: Math.round(faqPct * 0.30) },
                  { name: "Entity",  value: Math.round((entityPts / 20) * 20) },
                  { name: "Missing", value: Math.max(0, 100 - citationScore) },
                ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {["#6366f1","#3b82f6","#10b981","#e5e7eb"].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}%`]} />
                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Citation by AI Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Citation by AI Model</h3>
            <span className="ml-auto text-xs text-gray-400">Connected APIs only</span>
          </div>
          <div className="p-6 space-y-4">
            {modelCitationData.map(m => (
              <div key={m.model}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-gray-900">{m.model}</span>
                  <span className="text-sm font-black" style={{ color: m.color }}>{m.score}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full transition-all duration-1000" style={{ width: `${m.score}%`, backgroundColor: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Citation by Service */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Star className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Citation by Service</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={serviceCitationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} width={110} />
                <Tooltip contentStyle={{ borderRadius: 10 }} formatter={(v: any) => [`${v}%`, "Citation"]} />
                <Bar isAnimationActive={false} dataKey="score" radius={[0,6,6,0]} maxBarSize={18}>
                  {serviceCitationData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Citation by Intent + Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Citation by Intent</h3>
          </div>
          <div className="p-6 space-y-3">
            {intentCitationData.length > 0 ? intentCitationData.map(r => (
              <div key={r.intent}>
                <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-gray-800">{r.intent}</span><span className="font-bold text-indigo-600">{r.score}%</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full bg-indigo-500" style={{ width: `${r.score}%` }} /></div>
              </div>
            )) : <p className="text-gray-400 text-sm italic">Pending evaluation — intent citation data will populate after AI playground runs.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Citation by Location</h3>
          </div>
          <div className="p-6 space-y-3">
            {locationCitationData.map((r: any) => (
              <div key={r.location}>
                <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-gray-800">{r.location}</span><span className="font-bold text-teal-600">{r.score}%</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full bg-teal-500" style={{ width: `${r.score}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Citation by Prompt */}
      {promptCitations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Citation by Prompt</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {promptCitations.map((p, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">"{p.text}"</p>
                  <span className="text-xs text-indigo-600 font-bold mt-0.5 block">{p.intent}</span>
                </div>
                <div className="shrink-0 text-right">
                  {p.isPending ? (
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
                  ) : (
                    <>
                      <div className={`text-lg font-black ${p.citation > 50 ? "text-emerald-600" : p.citation > 25 ? "text-amber-500" : "text-red-500"}`}>{p.citation}%</div>
                      <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${p.citation}%` }} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citation Sources */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Link className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-900">Citation Sources — Schema Types Detected</h3>
        </div>
        <div className="p-6">
          {schemaTypes.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {schemaTypes.map((type: string) => (
                <div key={type} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-bold text-indigo-800">{type}</span>
                </div>
              ))}
              {["Product","Review","BreadcrumbList","Article","HowTo","VideoObject"].filter(t => !schemaTypes.includes(t)).map(type => (
                <div key={type} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-xl opacity-60">
                  <XCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-400">{type}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 italic text-sm">No schema types detected.</p>}
        </div>
      </div>

      {/* Missing Citations & Business Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-900">Missing Citations</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {missingCitations.map((item, i) => {
              const sev = SEVERITY_CONFIG[item.impact.toLowerCase()] || SEVERITY_CONFIG.medium;
              return (
                <div key={i} className="px-5 py-4 flex items-start gap-3">
                  <XCircle className={`w-4 h-4 mt-0.5 shrink-0 ${sev.color}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{item.item}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${sev.bg} ${sev.color} ${sev.border} border`}>{sev.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {/* Business Impact */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <h4 className="flex items-center gap-2 font-bold text-red-900 mb-3"><TrendingDown className="w-5 h-5"/> Business Impact of Missing Citations</h4>
            <ul className="space-y-2 text-sm text-red-800">
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">•</span>AI models cannot confidently cite your business in transactional queries — buyers go to competitors.</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">•</span>No review signals means AI treats you as an unverified entity, reducing recommendation confidence.</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">•</span>Missing FAQ schema means conversational AI cannot extract direct answers about your services.</li>
            </ul>
          </div>

          {/* Expected Improvement */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <h4 className="flex items-center gap-2 font-bold text-emerald-900 mb-3"><TrendingUp className="w-5 h-5"/> Expected Improvement</h4>
            <div className="space-y-3">
              {[
                { fix: "Add Review Schema",       gain: "+12% citation rate" },
                { fix: "Expand FAQ to all pages", gain: "+18% AI answer coverage" },
                { fix: "Add Product Schema",      gain: "+8% commercial citations" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-800">{r.fix}</span>
                  <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">{r.gain}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
