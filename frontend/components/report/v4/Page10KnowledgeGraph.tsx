"use client";

import {
  Network, Code, LayoutTemplate, Box, MapPin, Briefcase, Building2,
  CheckCircle, XCircle, FileJson, Share2, Globe, Activity, Zap
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface Page10Props { intelligence: any; scores: any; }

function IdentityCard({ title, icon: Icon, score, status, details, colorClass, bgClass, borderClass }: any) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${borderClass}`}>
      <div className={`px-5 py-4 border-b flex items-center gap-3 ${bgClass} ${borderClass}`}>
        <div className={`p-2 rounded-lg text-white shadow-sm ${colorClass.replace('text-', 'bg-')}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${colorClass}`}>{title}</h3>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{status}</p>
        </div>
        <div className="ml-auto text-right">
          <div className={`text-3xl font-black ${score > 70 ? 'text-emerald-600' : score > 40 ? 'text-amber-500' : 'text-red-500'}`}>{score}%</div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        {details.map((d: any, i: number) => (
          <div key={i} className="flex items-start gap-2">
            {d.present ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
            <div>
              <span className={`text-sm font-semibold ${d.present ? 'text-gray-900' : 'text-gray-500'}`}>{d.label}</span>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{d.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page10KnowledgeGraph({ intelligence, scores }: Page10Props) {
  const p = intelligence || {};
  const aeoSig    = scores?.breakdown?.aeo?.signals || {};
  const geoSig    = scores?.breakdown?.geo?.signals || {};
  const geoIssues = scores?.breakdown?.geo?.issues || [];
  
  const schemaTypes    = aeoSig.schema_coverage?.schema_types || [];
  const schemaCoverage = aeoSig.schema_coverage?.percentage || 0;
  const faqCoverage    = aeoSig.faq_coverage?.percentage || 0;
  const entityPts      = aeoSig.entity_coverage?.points || 0;
  
  const services  = p.services || [];
  const locations = p.locations || [];
  const entities  = p.entities || [];
  const products  = p.products || [];

  const hasOrgSchema   = schemaTypes.includes("Organization");
  const hasLocalSchema = schemaTypes.includes("LocalBusiness") || geoSig.local_schema?.present;
  const hasFaqSchema   = schemaTypes.includes("FAQPage");
  const hasProdSchema  = schemaTypes.includes("Product");
  const hasReviewSchema= schemaTypes.includes("Review") || schemaTypes.includes("AggregateRating");

  // ── Identities ────────────────────────────────────────────────────────────
  const brandScore = Math.min(Math.round((entities.length > 0 ? 50 : 0) + (hasOrgSchema ? 50 : 0)), 100);
  const brandStatus = brandScore === 100 ? "Fully Defined" : brandScore > 0 ? "Partially Defined" : "Undefined";
  const brandDetails = [
    { label: "Organization Schema", desc: hasOrgSchema ? "Organization schema is present." : "Missing Organization schema.", present: hasOrgSchema },
    { label: "Brand Entity Extraction", desc: entities.length > 0 ? `Detected: ${entities[0]}` : "No clear brand entity found.", present: entities.length > 0 },
  ];

  const serviceScore = Math.min(Math.round((services.length > 0 ? 40 : 0) + (hasFaqSchema ? 30 : 0) + (faqCoverage > 20 ? 30 : 0)), 100);
  const serviceStatus = serviceScore > 80 ? "Fully Defined" : serviceScore > 40 ? "Partially Defined" : "Weakly Defined";
  const serviceDetails = [
    { label: "Service Catalog", desc: services.length > 0 ? `${services.length} services detected.` : "No services extracted.", present: services.length > 0 },
    { label: "FAQ Schema", desc: hasFaqSchema ? "FAQ schema supports service definitions." : "Missing FAQ schema for services.", present: hasFaqSchema },
  ];

  const locScore = Math.min(Math.round((locations.length > 0 ? 40 : 0) + (hasLocalSchema ? 60 : 0)), 100);
  const locStatus = locScore === 100 ? "Fully Defined" : locScore > 0 ? "Partially Defined" : "Undefined";
  const hasLocPages = !geoIssues.find((i: any) => i.type === "missing_location_pages");
  const locDetails = [
    { label: "LocalBusiness Schema", desc: hasLocalSchema ? "Local schema is present." : "Missing LocalBusiness schema.", present: !!hasLocalSchema },
    { label: "Location Pages", desc: hasLocPages ? "Location-specific pages found." : "Missing dedicated location pages.", present: hasLocPages },
    { label: "Locations Extracted", desc: locations.length > 0 ? `${locations.join(", ")}` : "No locations detected.", present: locations.length > 0 },
  ];

  const bizScore = Math.round((brandScore + serviceScore + locScore) / 3);
  const bizStatus = bizScore > 80 ? "Strong Identity" : bizScore > 40 ? "Fragmented Identity" : "Weak Identity";

  // ── Entities ──────────────────────────────────────────────────────────────
  const recognizedEntities = [
    ...(entities.length > 0 ? ["Brand Name"] : []),
    ...(services.length > 0 ? ["Services"] : []),
    ...(locations.length > 0 ? ["Locations"] : []),
    ...(p.industry ? ["Industry"] : []),
    ...(p.unique_selling_points?.length > 0 ? ["Value Propositions"] : []),
  ];

  const missingEntities = [
    ...(products.length === 0 ? ["Products"] : []),
    ...(entities.length === 0 ? ["Brand"] : []),
    ...(!hasReviewSchema ? ["Customer Reviews"] : []),
    ...(!schemaTypes.includes("Person") ? ["People (Founders/Team)"] : []),
    ...(!schemaTypes.includes("Event") ? ["Events"] : []),
  ];

  const kgCoverage = Math.min(Math.round((recognizedEntities.length / (recognizedEntities.length + missingEntities.length)) * 100), 100);
  const aiScore = scores?.ai_readiness_score || 0;

  // ── Pie Chart Data ────────────────────────────────────────────────────────
  const kgData = [
    { name: "Recognized", value: recognizedEntities.length, fill: "#10b981" },
    { name: "Missing", value: missingEntities.length, fill: "#f43f5e" }
  ];

  const structuredDataCoverage = [
    { name: "Schema Covered", value: schemaCoverage, fill: "#6366f1" },
    { name: "No Schema", value: 100 - schemaCoverage, fill: "#e5e7eb" }
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 10
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Digital Knowledge Network</h1>
        <p className="text-xl text-gray-500">How AI models map, connect, and structure the semantic data of your business.</p>
      </div>

      {/* Hero Strip */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-fuchsia-400/20 rounded-full blur-3xl" />
        
        <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-6 relative z-10">Knowledge Graph Overview</p>
        
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "AI Understanding Score", value: `${aiScore}/100`, color: "text-white" },
            { label: "Knowledge Graph Coverage", value: `${kgCoverage}%`, color: "text-indigo-300" },
            { label: "Business Identity Strength", value: `${bizScore}/100`, color: "text-fuchsia-300" },
            { label: "Schema Page Coverage", value: `${schemaCoverage}%`, color: "text-purple-300" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
              <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-white/60 text-xs font-bold uppercase tracking-wider mt-2 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Identities Grid */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Share2 className="w-4 h-4" /> Core Semantic Identities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <IdentityCard 
            title="Brand Identity" icon={Building2} score={brandScore} status={brandStatus} details={brandDetails}
            colorClass="text-indigo-700" bgClass="bg-indigo-50" borderClass="border-indigo-200"
          />
          <IdentityCard 
            title="Service Identity" icon={Briefcase} score={serviceScore} status={serviceStatus} details={serviceDetails}
            colorClass="text-emerald-700" bgClass="bg-emerald-50" borderClass="border-emerald-200"
          />
          <IdentityCard 
            title="Location Identity" icon={MapPin} score={locScore} status={locStatus} details={locDetails}
            colorClass="text-teal-700" bgClass="bg-teal-50" borderClass="border-teal-200"
          />
        </div>
      </div>

      {/* Coverage Charts & Structured Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Structured Data / Schema Types */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Structured Data (Schema Types)</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">
              AI models rely heavily on semantic structured data to map entities. The following schema types were detected on your website:
            </p>
            {schemaTypes.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {schemaTypes.map((type: string) => (
                  <div key={type} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <FileJson className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold text-indigo-900">{type}</span>
                  </div>
                ))}
                
                {/* Missing critical schema types shown as ghosts */}
                {["Organization", "LocalBusiness", "FAQPage", "Product", "Review"].filter(t => !schemaTypes.includes(t)).map(type => (
                  <div key={type} className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl opacity-60">
                    <XCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-500">{type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center p-6 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-sm font-semibold text-red-800">No structured data (Schema.org) detected. This severely impacts the Knowledge Graph.</span>
              </div>
            )}
            
            <div className="mt-6 flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-12 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie isAnimationActive={false} data={structuredDataCoverage} cx="50%" cy="50%" innerRadius={14} outerRadius={24} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                      {structuredDataCoverage.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Schema Page Coverage: {schemaCoverage}%</h4>
                <p className="text-xs text-gray-500 mt-0.5">Percentage of crawled pages containing valid structured data markup.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge Graph Coverage Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Entity Map Status</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie isAnimationActive={false} data={kgData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                    {kgData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value, "Entities"]} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">
              Based on the {recognizedEntities.length + missingEntities.length} core knowledge graph entity categories required for complete AI visibility.
            </p>
          </div>
        </div>

      </div>

      {/* Recognized vs Missing Entities List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-900">Recognized Entities</h3>
            <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-200 px-2.5 py-0.5 rounded-full">{recognizedEntities.length}</span>
          </div>
          <div className="p-5 space-y-2">
            {recognizedEntities.map((entity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-semibold text-emerald-900">{entity}</span>
                <span className="ml-auto text-xs text-emerald-600 font-bold">Mapped</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-900">Missing Entities</h3>
            <span className="ml-auto text-xs font-bold text-red-700 bg-red-200 px-2.5 py-0.5 rounded-full">{missingEntities.length}</span>
          </div>
          <div className="p-5 space-y-2">
            {missingEntities.length > 0 ? missingEntities.map((entity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm font-semibold text-red-900">{entity}</span>
                <span className="ml-auto text-xs text-red-600 font-bold">Unmapped Gap</span>
              </div>
            )) : (
              <p className="text-sm text-gray-500 italic py-4 text-center">No major entity categories are missing.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
