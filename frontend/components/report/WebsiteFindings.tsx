"use client";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { useState } from "react";

export default function WebsiteFindings({ 
  intelligence, 
  issues, 
  strengthsWeaknesses 
}: { 
  intelligence: any; 
  issues: any[]; 
  strengthsWeaknesses: any 
}) {
  const strengths = strengthsWeaknesses?.strengths || [];
  const weaknesses = strengthsWeaknesses?.weaknesses || [];
  
  // Aggregate missing info from weaknesses and issues
  const missingInfo = new Set<string>();
  weaknesses.forEach((w: any) => missingInfo.add(w.title));
  issues?.forEach((issue: any) => {
    if (issue.issue_type === "missing" || issue.category === "Content Gaps") {
      missingInfo.add(issue.element || issue.recommendation);
    }
  });

  const missingList = Array.from(missingInfo).slice(0, 6);

  // Aggregate found info
  const foundInfo = strengths.map((s: any) => s.title).slice(0, 6);

  // Brand Visibility
  const brands = intelligence?.brands || [];
  const products = intelligence?.products || [];
  
  // Basic heuristic filter to remove common non-geographical words extracted by LLM
  const rawLocations = intelligence?.locations || [];
  const blocklist = new Set([
    "graphics", "instead", "present", "django", "laravel", "philosophy", 
    "branded", "professional", "scale", "design", "development", "software",
    "web", "app", "marketing", "digital", "agency", "company", "business",
    "services", "solutions", "technology", "tech", "platform", "system",
    "about", "contact", "home", "portfolio", "blog", "news", "events",
    "station", "checkups", "make", "treatmentsfor", "health", "integrity", "orchid"
  ]);
  const locations = rawLocations.filter((l: string) => !blocklist.has(l.toLowerCase()));

  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);

  const displayedProducts = showAllProducts ? products : products.slice(0, 5);
  const displayedLocations = showAllLocations ? locations : locations.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      
      {/* Module 6: What We Found */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">What We Found On Your Website</h2>
        {foundInfo.length > 0 ? (
          <ul className="space-y-4">
            {foundInfo.map((item: string, idx: number) => (
              <li key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-700 font-medium text-sm">{item}</span>
                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-md text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Available
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <HelpCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Unable to determine from available data.</p>
          </div>
        )}
      </div>

      {/* Module 9: Missing Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Information Missing</h2>
        {missingList.length > 0 ? (
          <ul className="space-y-4">
            {missingList.map((item: string, idx: number) => (
              <li key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-700 font-medium text-sm line-clamp-1 pr-2" title={item}>{item}</span>
                <span className="inline-flex shrink-0 items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-md text-xs font-semibold">
                  <XCircle className="w-3.5 h-3.5" /> Missing
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No major missing information detected.</p>
          </div>
        )}
      </div>

      {/* Module 7: Brand Visibility */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Brand Visibility Details</h2>
        
        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Brands Mentioned</p>
            <div className="flex flex-wrap gap-2">
              {brands.length > 0 ? brands.map((b: string, i: number) => (
                <span key={i} className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-md text-sm font-medium">{b}</span>
              )) : <span className="text-gray-400 text-sm italic">None detected</span>}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Products & Services ({products.length})</p>
            <div className="flex flex-wrap gap-2">
              {products.length > 0 ? displayedProducts.map((p: string, i: number) => (
                <span key={i} className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-md text-xs font-medium">{p}</span>
              )) : <span className="text-gray-400 text-sm italic">None detected</span>}
              
              {!showAllProducts && products.length > 5 && (
                <button 
                  onClick={() => setShowAllProducts(true)}
                  className="bg-gray-50 hover:bg-gray-100 transition-colors text-gray-500 px-2 py-1 rounded-md text-xs font-medium border border-gray-200 cursor-pointer"
                >
                  +{products.length - 5} more
                </button>
              )}
              {showAllProducts && products.length > 5 && (
                <button 
                  onClick={() => setShowAllProducts(false)}
                  className="bg-gray-50 hover:bg-gray-100 transition-colors text-gray-500 px-2 py-1 rounded-md text-xs font-medium border border-gray-200 cursor-pointer"
                >
                  Show less
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Locations Mentioned ({locations.length})</p>
            <div className="flex flex-wrap gap-2">
              {locations.length > 0 ? displayedLocations.map((l: string, i: number) => (
                <span key={i} className="bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-md text-xs font-medium">{l}</span>
              )) : <span className="text-gray-400 text-sm italic">None detected</span>}

              {!showAllLocations && locations.length > 5 && (
                <button 
                  onClick={() => setShowAllLocations(true)}
                  className="bg-purple-50/50 hover:bg-purple-50 transition-colors text-purple-600 px-2 py-1 rounded-md text-xs font-medium border border-purple-100 cursor-pointer"
                >
                  +{locations.length - 5} more
                </button>
              )}
              {showAllLocations && locations.length > 5 && (
                <button 
                  onClick={() => setShowAllLocations(false)}
                  className="bg-purple-50/50 hover:bg-purple-50 transition-colors text-purple-600 px-2 py-1 rounded-md text-xs font-medium border border-purple-100 cursor-pointer"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
