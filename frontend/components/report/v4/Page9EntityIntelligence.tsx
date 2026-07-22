"use client";

import {
  Building2, Package, Briefcase, Users, Globe, Cpu, MapPin,
  Tag, Award, ShieldCheck, Handshake, Calendar, Network,
  BarChart2, Zap, CheckCircle, XCircle, AlertCircle, Info
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Legend } from "recharts";

interface Page9Props { intelligence: any; scores: any; }

// Entity type configs
const ENTITY_TYPES: Record<string, { icon: any; color: string; bg: string; border: string; textColor: string; chartColor: string }> = {
  Brands:         { icon: Building2,  color: "bg-indigo-500",  bg: "bg-indigo-50",  border: "border-indigo-200",  textColor: "text-indigo-700",  chartColor: "#6366f1" },
  Products:       { icon: Package,    color: "bg-orange-500",  bg: "bg-orange-50",  border: "border-orange-200",  textColor: "text-orange-700",  chartColor: "#f97316" },
  Services:       { icon: Briefcase,  color: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", textColor: "text-emerald-700", chartColor: "#10b981" },
  People:         { icon: Users,      color: "bg-sky-500",     bg: "bg-sky-50",     border: "border-sky-200",     textColor: "text-sky-700",     chartColor: "#0ea5e9" },
  Organizations:  { icon: Globe,      color: "bg-blue-500",    bg: "bg-blue-50",    border: "border-blue-200",    textColor: "text-blue-700",    chartColor: "#3b82f6" },
  Technologies:   { icon: Cpu,        color: "bg-purple-500",  bg: "bg-purple-50",  border: "border-purple-200",  textColor: "text-purple-700",  chartColor: "#8b5cf6" },
  Locations:      { icon: MapPin,     color: "bg-teal-500",    bg: "bg-teal-50",    border: "border-teal-200",    textColor: "text-teal-700",    chartColor: "#14b8a6" },
  Industries:     { icon: Tag,        color: "bg-rose-500",    bg: "bg-rose-50",    border: "border-rose-200",    textColor: "text-rose-700",    chartColor: "#f43f5e" },
  Awards:         { icon: Award,      color: "bg-yellow-500",  bg: "bg-yellow-50",  border: "border-yellow-200",  textColor: "text-yellow-700",  chartColor: "#eab308" },
  Certifications: { icon: ShieldCheck,color: "bg-cyan-500",    bg: "bg-cyan-50",    border: "border-cyan-200",    textColor: "text-cyan-700",    chartColor: "#06b6d4" },
  Partners:       { icon: Handshake,  color: "bg-lime-500",    bg: "bg-lime-50",    border: "border-lime-200",    textColor: "text-lime-700",    chartColor: "#84cc16" },
  Events:         { icon: Calendar,   color: "bg-pink-500",    bg: "bg-pink-50",    border: "border-pink-200",    textColor: "text-pink-700",    chartColor: "#ec4899" },
};

function EntityCard({ type, items, present }: { type: string; items: string[]; present: boolean }) {
  const cfg = ENTITY_TYPES[type] || ENTITY_TYPES.Brands;
  const Icon = cfg.icon;
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${present ? cfg.border : "border-gray-200"}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${present ? cfg.bg : "bg-gray-50"} ${present ? cfg.border : "border-gray-200"} border-b`}>
        <div className={`${present ? cfg.color : "bg-gray-300"} text-white p-2 rounded-lg shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={`font-bold text-sm ${present ? "text-gray-900" : "text-gray-400"}`}>{type}</span>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black border ${present ? `${cfg.bg} ${cfg.textColor} ${cfg.border}` : "bg-gray-100 text-gray-400 border-gray-200"}`}>
          {present ? `${items.length}` : "0 Detected"}
        </span>
      </div>
      <div className="p-3">
        {present ? (
          <div className="flex flex-wrap gap-1.5">
            {items.map((item, i) => (
              <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.bg} ${cfg.textColor} ${cfg.border}`}>{item}</span>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-1 opacity-50">
            <XCircle className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Not detected in website data</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple SVG entity relationship graph
function EntityGraph({ entities }: { entities: Record<string, string[]> }) {
  const center = { x: 300, y: 220 };
  const radius = 160;
  const nodeTypes = Object.keys(entities).filter(k => entities[k].length > 0);
  const angleStep = (2 * Math.PI) / Math.max(nodeTypes.length, 1);

  const nodePositions = nodeTypes.map((type, i) => ({
    type,
    x: center.x + radius * Math.cos(i * angleStep - Math.PI / 2),
    y: center.y + radius * Math.sin(i * angleStep - Math.PI / 2),
    cfg: ENTITY_TYPES[type] || ENTITY_TYPES.Brands,
    count: entities[type].length,
  }));

  // Color map for inline SVG
  const COLOR_MAP: Record<string, string> = {
    Brands: "#6366f1", Products: "#f97316", Services: "#10b981", People: "#0ea5e9",
    Organizations: "#3b82f6", Technologies: "#8b5cf6", Locations: "#14b8a6",
    Industries: "#f43f5e", Awards: "#eab308", Certifications: "#06b6d4",
    Partners: "#84cc16", Events: "#ec4899",
  };

  return (
    <svg viewBox="0 0 600 440" className="w-full max-h-80" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Center node — the business */}
      <circle cx={center.x} cy={center.y} r={38} fill="#1e1b4b" opacity={0.95} />
      <circle cx={center.x} cy={center.y} r={38} fill="none" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 2" />
      <text x={center.x} y={center.y - 4} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">ENTITY</text>
      <text x={center.x} y={center.y + 8} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">CORE</text>

      {/* Edges */}
      {nodePositions.map((node, i) => (
        <line key={`edge-${i}`} x1={center.x} y1={center.y} x2={node.x} y2={node.y}
          stroke={COLOR_MAP[node.type] || "#9ca3af"} strokeWidth={1.5} opacity={0.35} strokeDasharray="4 2" />
      ))}

      {/* Entity nodes */}
      {nodePositions.map((node, i) => {
        const col = COLOR_MAP[node.type] || "#9ca3af";
        return (
          <g key={`node-${i}`}>
            <circle cx={node.x} cy={node.y} r={28} fill={col} opacity={0.15} />
            <circle cx={node.x} cy={node.y} r={22} fill={col} opacity={0.85} />
            <text x={node.x} y={node.y - 3} textAnchor="middle" fill="white" fontSize={7} fontWeight="bold">{node.type.slice(0, 8)}</text>
            <text x={node.x} y={node.y + 9} textAnchor="middle" fill="white" fontSize={9} fontWeight="900">{node.count}</text>
          </g>
        );
      })}

      {/* Entity labels */}
      {nodePositions.map((node, i) => {
        const labelY = node.y + (node.y > center.y ? 40 : -36);
        const col = COLOR_MAP[node.type] || "#9ca3af";
        return (
          <text key={`label-${i}`} x={node.x} y={labelY} textAnchor="middle" fill={col} fontSize={9} fontWeight="700">{node.type}</text>
        );
      })}
    </svg>
  );
}

export default function Page9EntityIntelligence({ intelligence, scores }: Page9Props) {
  const p = intelligence || {};
  const aeoSig    = scores?.breakdown?.aeo?.signals || {};
  const aiSig     = scores?.breakdown?.ai?.signals  || {};

  const schemaTypes     = aeoSig.schema_coverage?.schema_types || [];
  const schemaCoverage  = aeoSig.schema_coverage?.percentage   || 0;
  const entityPts       = aeoSig.entity_coverage?.points       || 0;
  const faqCoverage     = aeoSig.faq_coverage?.percentage      || 0;
  const authorityPts    = aiSig.authority_signals?.points      || 0;
  const contentDepth    = aeoSig.content_depth?.avg_word_count || 0;

  // ── Extract & classify all detected entities ─────────────────────────────
  const entities: Record<string, string[]> = {
    Brands:         (p.entities || []).length > 0 ? p.entities : [],
    Products:       p.products || [],
    Services:       p.services || [],
    People:         [], // not extracted — show as gap
    Organizations:  schemaTypes.includes("Organization") ? (p.entities || []) : [],
    Technologies:   p.secondary_topics?.filter((t: string) => /AI|tech|software|platform|tool|ML|SEO/i.test(t)) || [],
    Locations:      p.locations || [],
    Industries:     [p.industry, p.sub_industry].filter(Boolean) as string[],
    Awards:         [], // not extracted
    Certifications: [], // not extracted
    Partners:       [], // not extracted
    Events:         [], // not extracted
  };

  const presentEntities = Object.entries(entities).filter(([, v]) => v.length > 0);
  const missingEntities = Object.entries(entities).filter(([, v]) => v.length === 0);

  const totalEntities = Object.values(entities).flat().length;

  // ── Entity Strength (0–100 per type) ────────────────────────────────────
  const strengthData = Object.entries(entities).map(([type, items]) => {
    let strength = 0;
    if (items.length > 0) strength = Math.min(30 + items.length * 12, 100);
    if (type === "Services" && faqCoverage > 0) strength = Math.min(strength + faqCoverage * 0.3, 100);
    if (type === "Brands"   && schemaTypes.includes("Organization")) strength = Math.min(strength + 20, 100);
    if (type === "Locations"&& schemaTypes.includes("LocalBusiness")) strength = Math.min(strength + 25, 100);
    return { type: type.slice(0, 9), fullType: type, strength: Math.round(strength), fill: (ENTITY_TYPES[type] || {chartColor:"#9ca3af"}).chartColor };
  });

  // ── Entity Coverage (% of schema-backed entities) ────────────────────────
  const coverageData = [
    { name: "Schema",   value: Math.round(schemaCoverage),                       fill: "#6366f1" },
    { name: "FAQ",      value: Math.round(faqCoverage),                           fill: "#10b981" },
    { name: "Entity",   value: Math.min(Math.round((entityPts / 20) * 100), 100),fill: "#3b82f6" },
    { name: "Authority",value: Math.min(Math.round((authorityPts / 20) * 100), 100), fill: "#f59e0b" },
  ];

  // ── Entity Confidence per category ───────────────────────────────────────
  const confidenceData = [
    { metric: "Brands",        score: entities.Brands.length > 0 ? (schemaTypes.includes("Organization") ? 75 : 35) : 0 },
    { metric: "Services",      score: entities.Services.length > 0 ? Math.min(40 + faqCoverage, 100) : 0 },
    { metric: "Locations",     score: entities.Locations.length > 0 ? (schemaTypes.includes("LocalBusiness") ? 70 : 40) : 0 },
    { metric: "Technologies",  score: entities.Technologies.length > 0 ? 50 : 0 },
    { metric: "Organizations", score: schemaTypes.includes("Organization") ? 80 : 20 },
    { metric: "Industries",    score: entities.Industries.length > 0 ? 65 : 0 },
  ];

  const entityCoverageScore = Math.min(Math.round((presentEntities.length / 12) * 100), 100);
  const entityStrengthScore = Math.round(strengthData.filter(d => d.strength > 0).reduce((a, d) => a + d.strength, 0) / Math.max(strengthData.filter(d=>d.strength>0).length, 1));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 9
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Brand Identity & Footprint</h1>
        <p className="text-xl text-gray-500">Every entity AI can identify about your business, and the gaps in your knowledge graph.</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Entities Detected", value: totalEntities,               icon: Network,    color: "text-indigo-700", bg: "bg-indigo-50"  },
          { label: "Entity Categories",        value: `${presentEntities.length}/12`, icon: Tag,    color: "text-emerald-700",bg: "bg-emerald-50" },
          { label: "Entity Coverage Score",    value: `${entityCoverageScore}%`,  icon: BarChart2,  color: "text-blue-700",   bg: "bg-blue-50"    },
          { label: "Avg Entity Strength",      value: `${entityStrengthScore}%`,  icon: Zap,        color: "text-purple-700", bg: "bg-purple-50"  },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className={`${s.bg} ${s.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Entity Relationship Graph + Knowledge Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Entity Relationship Graph</h3>
          </div>
          <div className="p-4 bg-gray-50/30">
            <EntityGraph entities={entities} />
          </div>
        </div>

        {/* Entity Strength bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Entity Strength by Type</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={strengthData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 10, fontWeight: 700 }} width={72} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb" }} formatter={(v: any) => [`${v}%`, "Strength"]} />
                <Bar isAnimationActive={false} dataKey="strength" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {strengthData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Entity Coverage + Confidence radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coverage bars */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Knowledge Graph Coverage</h3>
          </div>
          <div className="p-6 space-y-4">
            {coverageData.map(c => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-gray-900">{c.name} Coverage</span>
                  <span className="text-sm font-black" style={{ color: c.fill }}>{c.value}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all duration-1000" style={{ width: `${c.value}%`, backgroundColor: c.fill }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Entity Confidence radar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Entity Confidence by Category</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={confidenceData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fontWeight: 700, fill: "#6b7280" }} />
                <Radar isAnimationActive={false} name="Confidence" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip formatter={(v: any) => [`${v}%`]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* All 12 Entity Type Cards */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4" /> All Entity Types — Extracted from Website
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(entities).map(([type, items]) => (
            <EntityCard key={type} type={type} items={items} present={items.length > 0} />
          ))}
        </div>
      </div>

      {/* Missing Entities — Gaps */}
      {missingEntities.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-amber-900">Missing Entity Categories — Knowledge Graph Gaps</h3>
            <span className="ml-auto text-xs font-black bg-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full">{missingEntities.length} gaps</span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {missingEntities.map(([type]) => {
              const cfg = ENTITY_TYPES[type] || ENTITY_TYPES.Brands;
              const Icon = cfg.icon;
              const GAP_MESSAGES: Record<string, string> = {
                People:         "No named individuals (founders, team, experts) detected. AI cannot associate expertise with your brand.",
                Awards:         "No awards or recognition data found. Awards are strong authority signals for AI trust scoring.",
                Certifications: "No certifications detected. Certifications increase AI confidence in your expertise claims.",
                Partners:       "No partner or client brands detected. Co-citation with known brands boosts AI authority.",
                Events:         "No event data found. Events signal an active, credible business presence.",
                Products:       "No products extracted. AI cannot recommend specific products from your catalog.",
              };
              return (
                <div key={type} className="flex items-start gap-3 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                  <div className="bg-gray-200 p-2 rounded-lg shrink-0">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-600">{type}</span>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{GAP_MESSAGES[type] || `No ${type.toLowerCase()} data detected in crawled website content.`}</p>
                  </div>
                  <XCircle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entity Confidence Summary */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-300" /> Entity Intelligence Summary
          </h3>
          <p className="text-indigo-200 leading-relaxed">
            AI models have successfully identified <strong className="text-white">{totalEntities} entities</strong> across {presentEntities.length} of 12 possible categories. The knowledge graph is strongest for <strong className="text-white">{presentEntities.slice(0, 2).map(([t]) => t).join(" and ")}</strong>. {missingEntities.length} entity types are completely absent from the website's data, creating knowledge gaps that reduce AI recommendation confidence. Adding People, Awards, and Certifications entities would have the highest impact on AI trust signals.
          </p>
        </div>
      </div>
    </div>
  );
}
