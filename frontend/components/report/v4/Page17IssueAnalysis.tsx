"use client";

import { useState } from "react";
import { 
  AlertOctagon, AlertTriangle, Info, ChevronDown, ChevronUp,
  FileText, Link, Target, Briefcase, Zap, Bot, ShieldAlert,
  ArrowRight
} from "lucide-react";

interface Page17Props { recommendations: any[]; intelligence: any; }

export default function Page17IssueAnalysis({ recommendations, intelligence }: Page17Props) {
  const [expandedId, setExpandedId] = useState<number | null>(0);
  const services = intelligence?.services || ["All core services"];

  const criticalIssues = recommendations.filter(r => r.priority_score === 1 || r.priority === 'Critical' || r.severity === 'critical');
  const highIssues = recommendations.filter(r => r.priority_score === 2 || r.priority === 'High' || r.severity === 'high');
  const mediumIssues = recommendations.filter(r => r.priority_score > 2 || r.priority === 'Medium' || r.severity === 'medium');

  const sortedRecs = [...criticalIssues, ...highIssues, ...mediumIssues];

  const getAffectedIntent = (category: string) => {
    if (!category) return "Commercial & Recommendation";
    if (category.toLowerCase() === "aeo") return "Commercial, Recommendation, Informational";
    if (category.toLowerCase() === "geo") return "Local, Commercial";
    if (category.toLowerCase() === "ai") return "All Intents";
    return "Commercial";
  };

  const getAffectedModels = () => {
    return ["ChatGPT", "Gemini"];
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module 17
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Critical Issues</h1>
        <p className="text-xl text-gray-500">Technical crawl blockers translated into direct business and revenue impacts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-red-100 text-red-600 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-red-700">{criticalIssues.length}</div>
            <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Critical Issues</div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-orange-100 text-orange-600 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-orange-700">{highIssues.length}</div>
            <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">High Priority</div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-amber-100 text-amber-600 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700">{mediumIssues.length}</div>
            <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Medium Priority</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedRecs.map((rec: any, i: number) => {
          const isExpanded = expandedId === i;
          const isCritical = rec.priority_score === 1 || rec.priority === 'Critical';
          const isHigh = rec.priority_score === 2 || rec.priority === 'High';
          
          const colorTheme = isCritical 
            ? { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-500", badge: "bg-red-100 text-red-800" }
            : isHigh 
            ? { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-500", badge: "bg-orange-100 text-orange-800" }
            : { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-500", badge: "bg-amber-100 text-amber-800" };

          const pages = rec.affected_pages || [];
          const affectedServices = services.length > 0 ? services.slice(0, 3) : ["All Services"];

          return (
            <div key={i} className={`bg-white rounded-2xl border ${isExpanded ? colorTheme.border : 'border-gray-200'} shadow-sm overflow-hidden transition-all duration-300`}>
              
              {/* Header (Clickable) */}
              <button 
                onClick={() => setExpandedId(isExpanded ? null : i)}
                className={`w-full px-6 py-5 flex items-start gap-4 text-left hover:bg-gray-50/50 transition-colors ${isExpanded ? colorTheme.bg : ''}`}
              >
                <div className={`mt-1 shrink-0 ${colorTheme.icon}`}>
                  {isCritical ? <AlertOctagon className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${colorTheme.badge}`}>
                      {rec.priority || "Medium"} Priority
                    </span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {rec.category} Engine
                    </span>
                  </div>
                  <h3 className={`font-bold text-lg ${isExpanded ? colorTheme.text : 'text-gray-900'}`}>
                    {rec.problem}
                  </h3>
                </div>
                <div className="shrink-0 mt-2 text-gray-400">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                    
                    {/* Left Column: Impact & Evidence */}
                    <div className="space-y-6">
                      
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                          <Target className="w-4 h-4 text-indigo-500" /> Business Impact
                        </h4>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-sm text-gray-700 leading-relaxed font-medium">
                            {rec.business_impact}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                          <Zap className="w-4 h-4 text-emerald-500" /> Revenue Impact / Expected ROI
                        </h4>
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                          <ArrowRight className="w-5 h-5 text-emerald-600 shrink-0" />
                          <p className="text-sm text-emerald-900 font-bold">
                            {rec.expected_roi || "High - Immediate revenue recovery potential by unblocking AI recommendations."}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                          <ShieldAlert className="w-4 h-4 text-gray-400" /> Technical Evidence
                        </h4>
                        <p className="text-sm text-gray-600 bg-white border border-dashed border-gray-300 p-3 rounded-lg">
                          {rec.evidence}
                        </p>
                      </div>

                    </div>

                    {/* Right Column: Affected Surfaces */}
                    <div className="space-y-6">
                      
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                          <Link className="w-4 h-4 text-blue-500" /> Affected Pages ({pages.length})
                        </h4>
                        <div className="bg-blue-50 rounded-xl border border-blue-100 p-1 max-h-32 overflow-y-auto">
                          {pages.length > 0 ? (
                            <ul className="divide-y divide-blue-100/50">
                              {pages.map((p: string, idx: number) => (
                                <li key={idx} className="px-3 py-2 text-xs font-medium text-blue-800 truncate">
                                  {p.replace(/https?:\/\/(www\.)?/, '')}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="p-3 text-xs text-blue-600 italic">Sitewide configuration issue.</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            <Briefcase className="w-3.5 h-3.5" /> Affected Services
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {affectedServices.map((svc: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md border border-gray-200">
                                {svc}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            <Target className="w-3.5 h-3.5" /> Affected Intent
                          </h4>
                          <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                            {getAffectedIntent(rec.category)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          <Bot className="w-3.5 h-3.5" /> Blocked AI Models
                        </h4>
                        <div className="flex items-center gap-2">
                          {getAffectedModels().map((m, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-gray-800 text-white text-[10px] font-bold rounded-full">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
