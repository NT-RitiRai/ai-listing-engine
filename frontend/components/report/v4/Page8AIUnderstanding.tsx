"use client";

import {
  Brain, CheckCircle, XCircle, AlertTriangle, AlertCircle,
  Star, MapPin, DollarSign, MessageSquare, Briefcase, BookOpen,
  FileText, Lightbulb, ShieldAlert, Zap, TrendingUp, Eye, EyeOff,
  HelpCircle, Building2, Tag
} from "lucide-react";

interface Page8Props { intelligence: any; scores: any; }

const SEV: Record<string, { bg: string; border: string; color: string; icon: any; label: string }> = {
  critical: { bg: "bg-red-50",    border: "border-red-200",    color: "text-red-700",    icon: AlertCircle,   label: "Critical"  },
  high:     { bg: "bg-orange-50", border: "border-orange-200", color: "text-orange-700", icon: AlertTriangle, label: "High"      },
  medium:   { bg: "bg-amber-50",  border: "border-amber-200",  color: "text-amber-700",  icon: AlertTriangle, label: "Medium"    },
  low:      { bg: "bg-blue-50",   border: "border-blue-200",   color: "text-blue-700",   icon: HelpCircle,    label: "Low"       },
};

function GapCard({ title, icon: Icon, iconColor, items, emptyMsg, accent }: {
  title: string; icon: any; iconColor: string; items: { label: string; detail?: string; severity?: string }[];
  emptyMsg: string; accent: string;
}) {
  const hasItems = items.length > 0;
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${accent}`}>
      <div className={`px-5 py-4 border-b flex items-center gap-2 ${hasItems ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
        <div className={`${iconColor}`}><Icon className="w-5 h-5" /></div>
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-black ${hasItems ? "bg-red-200 text-red-800" : "bg-emerald-200 text-emerald-800"}`}>
          {hasItems ? `${items.length} Missing` : "✓ Present"}
        </span>
      </div>
      <div className="p-4">
        {hasItems ? (
          <div className="space-y-2">
            {items.map((item, i) => {
              const sev = SEV[item.severity || "medium"];
              const SevIcon = sev.icon;
              return (
                <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${sev.bg} ${sev.border}`}>
                  <SevIcon className={`w-4 h-4 shrink-0 mt-0.5 ${sev.color}`} />
                  <div>
                    <span className={`text-sm font-semibold ${sev.color}`}>{item.label}</span>
                    {item.detail && <p className="text-xs mt-0.5 text-gray-500 leading-relaxed">{item.detail}</p>}
                  </div>
                  <span className={`ml-auto shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border ${sev.bg} ${sev.color} ${sev.border}`}>{sev.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-700 py-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">{emptyMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfidenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-black" style={{ color }}>{value}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div className="h-2.5 rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function Page8AIUnderstanding({ intelligence, scores }: Page8Props) {
  const profile  = intelligence || {};
  const breakdown = scores?.breakdown || {};
  const aeo = breakdown.aeo || {};
  const ai  = breakdown.ai  || {};
  const geo = breakdown.geo || {};

  const aeoIssues   = aeo.issues  || [];
  const aiIssues    = ai.issues   || [];
  const aiMissing   = ai.missing  || [];
  const geoMissing  = geo.missing || [];
  const geoIssues   = geo.issues  || [];
  const aeoSig      = aeo.signals || {};
  const aiSig       = ai.signals  || {};

  const services  = profile.services  || [];
  const products  = profile.products  || [];
  const locations = profile.locations || [];
  const brands    = profile.brands    || [];
  const entities  = profile.entities  || [];
  const topics    = profile.primary_topics || [];
  const usps      = profile.unique_selling_points || [];

  const hasReviews  = (aiSig.authority_signals?.reviews || 0) > 0;
  const hasPricing  = (aiSig.authority_signals?.pricing || 0) > 0;
  const faqPages    = aeoSig.faq_coverage?.pages || 0;
  const faqTotal    = aeoSig.faq_coverage?.total_faqs || 0;
  const schemaPct   = aeoSig.schema_coverage?.percentage || 0;
  const schemaTypes = aeoSig.schema_coverage?.schema_types || [];
  const totalPages  = aeoSig.schema_coverage?.total_pages || 0;

  // ── What AI UNDERSTANDS (from successfully extracted fields) ──────────────
  const understood: { label: string; value: string; icon: any }[] = [];
  if (services.length > 0)  understood.push({ label: "Core Services",      value: services.join(", "),       icon: Briefcase });
  if (profile.industry)     understood.push({ label: "Industry",            value: profile.industry,           icon: Tag });
  if (profile.sub_industry) understood.push({ label: "Sub-Industry",        value: profile.sub_industry,       icon: Tag });
  if (locations.length > 0) understood.push({ label: "Service Locations",   value: locations.join(", "),      icon: MapPin });
  if (entities.length > 0)  understood.push({ label: "Brand Entity",        value: entities.join(", "),       icon: Building2 });
  if (topics.length > 0)    understood.push({ label: "Primary Topics",      value: topics.slice(0,3).join(", "), icon: FileText });
  if (profile.target_audience) understood.push({ label: "Target Audience",  value: profile.target_audience,    icon: Eye });
  if (profile.business_summary) understood.push({ label: "Business Summary", value: "Extracted", icon: Brain });
  if (usps.length > 0)      understood.push({ label: "Unique Selling Props", value: usps.length + " identified", icon: Star });
  if (schemaPct > 0)        understood.push({ label: "Schema Markup",       value: `${schemaPct}% page coverage`, icon: CheckCircle });

  // ── What AI MISUNDERSTANDS (gaps, thin coverage, wrong signals) ──────────
  const misunderstood: { label: string; detail: string; severity: string }[] = [];

  const hasWeakEntity = aeoIssues.find((i: any) => i.type === "weak_entity_coverage");
  if (hasWeakEntity) misunderstood.push({ label: "Entity Coverage is Weak", detail: "AI models cannot reliably identify the core business entity. This means you are often not cited as a primary answer.", severity: "high" });
  const hasThinContent = aiIssues.find((i: any) => i.type === "thin_content");
  if (hasThinContent) misunderstood.push({ label: "Content Depth is Thin", detail: "AI models perceive your content as surface-level. Deep, authoritative content is needed for AI to confidently recommend you.", severity: "high" });
  const hasHeadingIssue = aeoIssues.find((i: any) => i.type === "missing_heading_hierarchy");
  if (hasHeadingIssue) misunderstood.push({ label: "Page Hierarchy Not Clear", detail: "AI cannot parse the topical hierarchy of your pages correctly due to inconsistent heading structure.", severity: "medium" });
  if (products.length === 0) misunderstood.push({ label: "Products Not Recognized", detail: "No product data was extracted. AI treats this as a service-only company, missing product recommendation opportunities.", severity: "medium" });
  if (!hasPricing) misunderstood.push({ label: "Pricing Model Unknown", detail: "AI has no pricing data to extract, so it cannot answer commercial queries like 'how much does it cost'.", severity: "medium" });

  // ── Missing sections ───────────────────────────────────────────────────────

  // Missing Products
  const missingProducts = products.length === 0
    ? [{ label: "No Products Detected", detail: "The website doesn't expose any product-level entities. AI models cannot recommend specific products.", severity: "high" }]
    : [];

  // Missing Services (services with no FAQ or schema coverage)
  const missingServices = services.length > 0 && faqPages < 5
    ? services.map((svc: string) => ({ label: `FAQ missing for: ${svc}`, detail: "No FAQ schema or Q&A content found for this service page. AI cannot answer questions about it.", severity: "medium" }))
    : [];

  // Missing Locations
  const missingLocations: { label: string; detail: string; severity: string }[] = [];
  const hasLocalSchema = geoIssues.find((i: any) => i.type === "missing_local_business_schema");
  if (hasLocalSchema) locations.forEach((loc: string) => {
    missingLocations.push({ label: `No Local Business Schema for ${loc}`, detail: "AI cannot verify your business operates in this location without LocalBusiness schema.", severity: "high" });
  });
  const hasLocationPages = geoIssues.find((i: any) => i.type === "missing_location_pages");
  if (hasLocationPages) missingLocations.push({ label: "Dedicated Location Pages Missing", detail: "You serve multiple cities but have no dedicated city/location landing pages.", severity: "high" });

  // Missing Brands
  const missingBrands = entities.length === 0
    ? [{ label: "No Brand Entity Detected", detail: "No Brand or Organization schema found. AI doesn't know who the business is.", severity: "critical" }]
    : !schemaTypes.includes("Organization")
    ? [{ label: "Organization Schema Missing", detail: "Without Organization schema, AI cannot reliably identify and cite your brand.", severity: "high" }]
    : [];

  // Missing Reviews
  const missingReviews = !hasReviews
    ? [
        { label: "No Customer Reviews Detected", detail: "AI models use reviews as trust signals. Zero reviews means AI classifies you as an unverified entity.", severity: "high" },
        { label: "Review Schema (AggregateRating) Missing", detail: "Without review schema, even if you have reviews elsewhere they are invisible to AI crawlers.", severity: "high" },
      ]
    : [];

  // Missing Pricing
  const missingPricing = !hasPricing
    ? [
        { label: "No Pricing Pages Found", detail: "AI cannot answer 'how much does it cost' queries for your services — driving purchase-intent traffic to competitors.", severity: "high" },
        { label: "Offer/Product Schema Missing", detail: "Structured pricing data (Offer schema) is absent, blocking commercial AI citations.", severity: "medium" },
      ]
    : [];

  // Missing FAQs
  const missingFaqs: { label: string; detail: string; severity: string }[] = [];
  if (faqPages < 10 && totalPages > 0) {
    missingFaqs.push({ label: `Only ${faqPages}/${totalPages} pages have FAQ content`, detail: `${totalPages - faqPages} pages have no FAQ or Q&A. AI assistants use FAQ content as primary source for conversational answers.`, severity: "critical" });
  }
  if (faqTotal < 20) {
    missingFaqs.push({ label: `Only ${faqTotal} FAQs total across the website`, detail: "AI models need rich Q&A content to generate confident answers. More FAQs = higher citation probability.", severity: "high" });
  }

  // Missing Case Studies
  const hasCaseStudies = schemaTypes.includes("Article") || schemaTypes.includes("BlogPosting");
  const missingCaseStudies = !hasCaseStudies
    ? [
        { label: "No Case Study Pages Detected", detail: "AI cannot demonstrate your proven results to buyers asking 'show me examples of your work'.", severity: "high" },
        { label: "CaseStudy / Article Schema Missing", detail: "Structured case study content helps AI models position you as an authority with proven results.", severity: "medium" },
      ]
    : [
        { label: "Case Studies Lack Client Outcomes", detail: "Detected articles/blog posts but no structured outcome data (ROI, %, testimonials) for AI to cite.", severity: "low" },
      ];

  // ── Knowledge Gaps (from all issues combined) ─────────────────────────────
  const allIssues = [...aeoIssues, ...aiIssues, ...geoIssues];
  const knowledgeGaps = allIssues.map((issue: any) => ({
    label: issue.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    detail: `Deduction: -${issue.deduction} points from AI readiness score.`,
    severity: issue.severity,
  }));

  // ── Hallucinations (likely wrong inferences) ──────────────────────────────
  const hallucinations: { label: string; detail: string; risk: string }[] = [];
  if (brands.length > 0 && brands.some((b: string) => b.length > 30)) {
    hallucinations.push({ label: "AI may confuse marketing slogans with brand names", detail: `Detected "${brands[0]}" as a brand signal — this is a marketing phrase, not a brand name.`, risk: "High" });
  }
  hallucinations.push({ label: "AI may classify website type incorrectly", detail: `Detected as "${profile.website_type}" with only ${profile.website_type_confidence}% confidence. AI may treat this as a blog rather than a business service provider.`, risk: "Medium" });
  if (!hasReviews) {
    hallucinations.push({ label: "AI may assume low authority due to no reviews", detail: "Without review signals, AI models make negative inferences about business credibility.", risk: "High" });
  }
  if (locations.length > 2) {
    hallucinations.push({ label: "AI may limit service area to primary city only", detail: `You serve ${locations.join(", ")} but without location pages, AI may only associate you with one city.`, risk: "Medium" });
  }

  // ── Confidence scores ──────────────────────────────────────────────────────
  const confidenceMetrics = [
    { label: "Entity Recognition Confidence",  value: Math.round((entities.length > 0 ? 60 : 20) + (schemaTypes.includes("Organization") ? 30 : 0)), color: "#6366f1" },
    { label: "Service Understanding",           value: Math.round(40 + Math.min(services.length * 8, 40) + (faqPages > 5 ? 10 : 0)),                 color: "#10b981" },
    { label: "Location Understanding",          value: Math.round((geo.signals?.local_schema?.present ? 50 : 15) + locations.length * 5),              color: "#3b82f6" },
    { label: "Authority Confidence",            value: Math.round(hasReviews ? 65 : 18),                                                               color: "#f59e0b" },
    { label: "Commercial Intent Confidence",    value: Math.round(hasPricing ? 55 : 15),                                                               color: "#f43f5e" },
    { label: "Overall AI Understanding",        value: Math.round(scores?.ai_readiness_score || 0),                                                    color: "#8b5cf6" },
  ].map(m => ({ ...m, value: Math.min(m.value, 100) }));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 8
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">AI Brand Comprehension</h1>
        <p className="text-xl text-gray-500">What AI models know, misunderstand, and are missing about your business.</p>
      </div>

      {/* Understanding vs Misunderstanding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What AI Understands */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-900 text-lg">What AI Understands ✓</h3>
            <span className="ml-auto text-xs font-black bg-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full">{understood.length} signals</span>
          </div>
          <div className="divide-y divide-gray-100">
            {understood.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="px-5 py-3.5 flex items-start gap-3 hover:bg-emerald-50/30">
                  <div className="bg-emerald-100 p-1.5 rounded-lg shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">{item.label}</span>
                    <p className="text-sm text-gray-800 font-medium mt-0.5 truncate">{item.value}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                </div>
              );
            })}
          </div>
        </div>

        {/* What AI Misunderstands */}
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-900 text-lg">What AI Misunderstands ✗</h3>
            <span className="ml-auto text-xs font-black bg-red-200 text-red-800 px-2.5 py-0.5 rounded-full">{misunderstood.length} issues</span>
          </div>
          <div className="divide-y divide-gray-100">
            {misunderstood.map((item, i) => {
              const sev = SEV[item.severity];
              const SevIcon = sev.icon;
              return (
                <div key={i} className="px-5 py-3.5 hover:bg-red-50/30">
                  <div className="flex items-center gap-2 mb-1">
                    <SevIcon className={`w-4 h-4 ${sev.color} shrink-0`} />
                    <span className="text-sm font-bold text-gray-900">{item.label}</span>
                    <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full border ${sev.bg} ${sev.color} ${sev.border}`}>{sev.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed ml-6">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Missing Data Grid — 8 sections */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500" /> Missing Data — What AI Cannot Find
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <GapCard title="Missing Products"      icon={Briefcase}     iconColor="text-orange-600" items={missingProducts}   emptyMsg="Products detected and recognized."  accent="border-gray-200" />
          <GapCard title="Missing Services FAQs" icon={MessageSquare} iconColor="text-red-600"    items={missingServices}  emptyMsg="All services have FAQ coverage."    accent="border-gray-200" />
          <GapCard title="Missing Locations"     icon={MapPin}        iconColor="text-teal-600"   items={missingLocations} emptyMsg="Location data is present."          accent="border-gray-200" />
          <GapCard title="Missing Brands"        icon={Building2}     iconColor="text-purple-600" items={missingBrands}    emptyMsg="Brand entity is properly defined."  accent="border-gray-200" />
          <GapCard title="Missing Reviews"       icon={Star}          iconColor="text-amber-600"  items={missingReviews}   emptyMsg="Reviews are present and indexed."   accent="border-gray-200" />
          <GapCard title="Missing Pricing"       icon={DollarSign}    iconColor="text-emerald-600"items={missingPricing}   emptyMsg="Pricing data is accessible to AI."  accent="border-gray-200" />
          <GapCard title="Missing FAQs"          icon={HelpCircle}    iconColor="text-blue-600"   items={missingFaqs}      emptyMsg="FAQ coverage is comprehensive."     accent="border-gray-200" />
          <GapCard title="Missing Case Studies"  icon={BookOpen}      iconColor="text-indigo-600" items={missingCaseStudies} emptyMsg="Case studies are present."       accent="border-gray-200" />
        </div>
      </div>

      {/* Knowledge Gaps */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-gray-900 text-lg">Knowledge Gaps</h3>
          <span className="ml-auto text-xs font-bold text-gray-500">{knowledgeGaps.length} detected gaps</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {knowledgeGaps.map((gap, i) => {
            const sev = SEV[gap.severity] || SEV.medium;
            const Icon = sev.icon;
            return (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${sev.bg} ${sev.border}`}>
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${sev.color}`} />
                <div>
                  <span className={`text-sm font-bold ${sev.color}`}>{gap.label}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{gap.detail}</p>
                </div>
                <span className={`ml-auto shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border ${sev.bg} ${sev.color} ${sev.border}`}>{sev.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hallucinations */}
      <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-purple-100 bg-purple-50 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-purple-900 text-lg">Potential AI Hallucinations</h3>
          <span className="ml-auto text-xs font-black bg-purple-200 text-purple-800 px-2.5 py-0.5 rounded-full">{hallucinations.length} risks</span>
        </div>
        <div className="p-5 space-y-3">
          {hallucinations.map((h, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black shrink-0">!</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-purple-900">{h.label}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${h.risk === "High" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{h.risk} Risk</span>
                </div>
                <p className="text-xs text-purple-700 leading-relaxed">{h.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence Scores */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-900 text-lg">AI Understanding Confidence</h3>
        </div>
        <div className="p-6 space-y-5">
          {confidenceMetrics.map(m => (
            <ConfidenceBar key={m.label} label={m.label} value={m.value} color={m.color} />
          ))}
        </div>

        {/* Confidence Summary */}
        <div className="mx-6 mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-sm text-indigo-900 leading-relaxed font-medium">
            <strong>AI Understanding Summary:</strong> AI models can identify the core services and industry of this business, but lack confidence in brand identity, pricing, and authority signals. The most critical gaps are missing review data, thin FAQ coverage, and absent product schema — all of which directly reduce AI recommendation probability.
          </p>
        </div>
      </div>
    </div>
  );
}
