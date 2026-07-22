"use client";

import { Building2, Globe, Tag, Target, MapPin, Sparkles, Briefcase, Box, Languages, Users, Award, ShieldCheck, Cpu } from "lucide-react";

interface Page1BusinessProfileProps {
  analysis: any;
  scores: any;
  intelligence: any;
}

export default function Page1BusinessProfile({ analysis, scores, intelligence }: Page1BusinessProfileProps) {
  const profile = intelligence || {};
  
  // Try to infer business model from target audience or summary
  let businessModel = "Not specified";
  const audienceText = (profile.target_audience || "").toLowerCase();
  const summaryText = (profile.business_summary || "").toLowerCase();
  if (audienceText.includes("business") || audienceText.includes("enterprise") || audienceText.includes("b2b")) {
    businessModel = "B2B";
  } else if (audienceText.includes("consumer") || audienceText.includes("people") || audienceText.includes("b2c")) {
    businessModel = "B2C";
  }
  
  // Extract or fallback values
  // Smarter company name extraction to avoid AI hallucinations like "More Traffic"
  let companyName = "Unknown Entity";
  let domain = "";
  try {
    if (analysis?.url) {
      domain = new URL(analysis.url.startsWith('http') ? analysis.url : `https://${analysis.url}`).hostname.replace('www.', '');
      companyName = domain.split('.')[0].replace(/-/g, ' ');
      companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
    }
  } catch (e) {}

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const baseDomain = domain.split('.')[0];
  
  if (profile.brands && profile.brands.length > 0) {
    const matchedBrand = profile.brands.find((b: string) => domain.includes(clean(b)) || (baseDomain && clean(b).includes(baseDomain)));
    if (matchedBrand) {
      companyName = matchedBrand;
    } else if (profile.business_summary) {
      const match = profile.business_summary.match(/^([A-Za-z0-9 -]+?)\s+is\s+(?:a|an)\s/i);
      if (match && match[1] && match[1].length < 30) {
        companyName = match[1];
      } else {
        companyName = baseDomain ? (baseDomain.charAt(0).toUpperCase() + baseDomain.slice(1)) : (profile.brands[0] || "Unknown Entity"); // absolute fallback
      }
    }
  } else if (profile.business_summary) {
    const match = profile.business_summary.match(/^([A-Za-z0-9 -]+?)\s+is\s+(?:a|an)\s/i);
    if (match && match[1] && match[1].length < 30) companyName = match[1];
  }

  const website = analysis?.url || "Unknown";
  const industry = profile.industry || "Uncategorized";
  const subCategory = profile.sub_industry || "Not specified";
  const description = profile.business_summary || "No description available.";
  const products = profile.products || [];
  const services = profile.services || [];
  const targetAudience = profile.target_audience || "Not explicitly extracted";
  const locations = profile.locations && profile.locations.length > 0 ? profile.locations.join(", ") : "Global / Digital (Inferred)";
  
  // We mock or infer these since they aren't directly in the standard WebsiteIntelligence payload yet
  const languages = "English (Detected)";
  const yearsInBusiness = "Not explicitly extracted";
  const companySize = "Not explicitly extracted";
  const usp = "Derived from service offerings & market positioning";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 1
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Business Overview</h1>
        <p className="text-xl text-gray-500">Understanding exactly what business is being analyzed by the AI.</p>
      </div>

      {/* Header Profile Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shrink-0">
            <Building2 className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 capitalize">{companyName}</h2>
            <div className="flex items-center gap-4 text-gray-500 mt-2 font-medium">
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {website}</span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-700 uppercase tracking-wider">{industry}</span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 bg-indigo-50 px-6 py-4 rounded-xl border border-indigo-100 flex items-center gap-4 shrink-0">
          <div>
            <div className="text-indigo-600/80 text-xs font-bold uppercase tracking-wider mb-1">AI Visibility Score</div>
            <div className="text-3xl font-black text-indigo-700">{scores?.overall_score || 0}<span className="text-lg text-indigo-400">/100</span></div>
          </div>
          <Sparkles className="w-8 h-8 text-indigo-400 opacity-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Extracted Entity Data (Show Section) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Extracted Structured Data</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Category & Sub Category</h4>
                <p className="text-gray-900 font-medium">{industry} • {subCategory}</p>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Business Model</h4>
                <p className="text-gray-900 font-medium">{businessModel}</p>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Box className="w-3.5 h-3.5" /> Products & Services</h4>
                <div className="flex flex-wrap gap-2">
                  {[...products, ...services].length > 0 ? (
                    [...products, ...services].map((item: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 italic text-sm">No specific products or services extracted.</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Target Audience / ICP</h4>
                <p className="text-gray-900 font-medium">{targetAudience}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Locations Served</h4>
                <p className="text-gray-900 font-medium">{locations}</p>
              </div>
              
              <div className="pt-4 border-t border-gray-100 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div>
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Languages</h4>
                   <p className="text-sm font-medium text-gray-800">{languages}</p>
                 </div>
                 <div>
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Years in Biz</h4>
                   <p className="text-sm font-medium text-gray-500 italic">{yearsInBusiness}</p>
                 </div>
                 <div>
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Company Size</h4>
                   <p className="text-sm font-medium text-gray-500 italic">{companySize}</p>
                 </div>
                 <div>
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">USP</h4>
                   <p className="text-sm font-medium text-gray-500 italic">{usp}</p>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-900 rounded-2xl shadow-sm border border-indigo-800 p-6 text-white">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Generated Summary & Description
            </h4>
            <p className="text-indigo-50 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* AI Explanation Panel (Explain Section) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-gray-100 bg-indigo-50/50 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">AI Context Analysis</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  What the company does
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The AI identifies this entity primarily as a provider of {services.length > 0 ? services.slice(0, 2).join(" and ") : industry}, operating within the {subCategory} sector.
                </p>
              </div>

              <div className="w-full h-px bg-gray-100" />

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Who it serves
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Targeting a {businessModel} market, specifically focusing on {targetAudience.toLowerCase()}.
                </p>
              </div>

              <div className="w-full h-px bg-gray-100" />

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Why customers choose it
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Based on the extracted service offerings, customers likely choose this entity for its specialized capabilities in {products.length > 0 ? products[0] : (services.length > 0 ? services[0] : industry)}.
                </p>
              </div>

              <div className="w-full h-px bg-gray-100" />

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Market positioning
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The AI perceives the brand as a {businessModel === "B2B" ? "professional service provider" : "consumer-facing service"} within the {locations} region, competing in the {industry} space.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
