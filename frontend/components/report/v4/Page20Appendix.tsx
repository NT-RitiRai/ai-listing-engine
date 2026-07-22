"use client";

import { useState } from "react";
import { Database, Code2, Search, Users, Activity, FileText, ChevronRight } from "lucide-react";

interface Page20Props { 
  prompts: any[]; 
  competitorsData: any; 
  scores: any; 
  intelligence: any; 
  recommendations: any[];
  crawlData: any;
}

export default function Page20Appendix({ prompts, competitorsData, scores, intelligence, recommendations, crawlData }: Page20Props) {
  const [activeTab, setActiveTab] = useState("prompts");

  const tabs = [
    { id: "prompts", label: "Prompts & Responses", icon: Search },
    { id: "entities", label: "Extracted Entities", icon: Code2 },
    { id: "competitors", label: "Competitors & Citations", icon: Users },
    { id: "logs", label: "Crawler Evidence & Logs", icon: FileText },
    { id: "models", label: "Model Confidence Scores", icon: Activity },
  ];

  // Helper to render pretty JSON
  const renderJSON = (data: any) => (
    <pre className="text-[10px] text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto p-4 leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-140px)] flex flex-col">
      <div className="text-center max-w-3xl mx-auto space-y-2 shrink-0">
        <h1>Appendix</h1>
        <p className="text-sm text-gray-500">Unfiltered technical payload outputs supporting the executive analysis.</p>
      </div>

      <div className="flex-1 bg-gray-900 rounded-3xl border border-gray-800 shadow-xl overflow-hidden flex flex-col lg:flex-row">
        
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 bg-gray-950 border-r border-gray-800 shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto p-4 gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all whitespace-nowrap text-left ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold tracking-wide">{tab.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 hidden lg:block" />}
              </button>
            );
          })}
        </div>

        {/* Data View */}
        <div className="flex-1 bg-gray-900 overflow-y-auto custom-scrollbar relative">
          <div className="sticky top-0 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-6 py-3 flex items-center justify-between z-10">
            <div className="text-xs font-bold text-gray-400 tracking-wider uppercase flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              {activeTab}.json
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-700"></div>
              <div className="w-3 h-3 rounded-full bg-gray-700"></div>
              <div className="w-3 h-3 rounded-full bg-gray-700"></div>
            </div>
          </div>

          <div className="p-2">
            {activeTab === "prompts" && (
              renderJSON(prompts.map(p => ({
                id: p.id,
                query: p.prompt_text,
                context: p.rationale,
                intent: p.intent,
                responses: p.playground_results?.responses || null,
              })))
            )}
            
            {activeTab === "entities" && (
              renderJSON({
                services: intelligence?.services,
                locations: intelligence?.locations,
                brands: [intelligence?.business_name],
                extracted_details: intelligence?.summary
              })
            )}

            {activeTab === "competitors" && (
              renderJSON({
                detected_competitors: competitorsData?.competitors,
                citations: scores?.breakdown?.aeo?.signals?.entity_coverage,
                insight_analysis: competitorsData?.insight_analysis
              })
            )}

            {activeTab === "logs" && (
              renderJSON(crawlData || {
                crawler_evidence: recommendations,
                business_identity_mapped: intelligence?.business_summary,
                services_mapped: intelligence?.services
              })
            )}

            {activeTab === "models" && (
              renderJSON(prompts.map(p => ({
                query: p.prompt_text,
                predictive_confidence: p.playground_results?.model_probabilities || { status: "Awaiting Evaluation" },
                live_api_results: p.playground_results?.live ? {
                    openai: p.playground_results.live.openai ? { 
                        valid: p.playground_results.live.openai.validation?.valid, 
                        brand_mentions: p.playground_results.live.openai.brand_mentions,
                        citation_found: p.playground_results.live.openai.citation_found
                    } : null,
                    gemini: p.playground_results.live.gemini ? { 
                        valid: p.playground_results.live.gemini.validation?.valid, 
                        brand_mentions: p.playground_results.live.gemini.brand_mentions,
                        citation_found: p.playground_results.live.gemini.citation_found
                    } : null,
                } : { status: "Awaiting Evaluation" },
              })))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
