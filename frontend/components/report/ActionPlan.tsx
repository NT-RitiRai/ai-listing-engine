"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, ArrowRight, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ActionPlan({ 
  recommendations, 
  prompts 
}: { 
  recommendations: any[]; 
  prompts: any[] 
}) {
  const [expandedRecs, setExpandedRecs] = useState<Record<number, boolean>>({});
  const [expandedPages, setExpandedPages] = useState<Record<number, boolean>>({});
  const [expandedSnippets, setExpandedSnippets] = useState<Record<number, boolean>>({});

  const toggleSnippet = (idx: number) => {
    setExpandedSnippets(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleRec = (idx: number) => {
    setExpandedRecs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const togglePages = (idx: number) => {
    setExpandedPages(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Collect all unique citations
  const citations = new Map<string, any>();
  if (prompts) {
    prompts.forEach(p => {
      if (p.playground_results?.live) {
        Object.entries(p.playground_results.live).forEach(([engine, data]: [string, any]) => {
          if (data.citations && Array.isArray(data.citations)) {
            data.citations.forEach((cit: any) => {
              if (cit.url) {
                // Use URL + engine as unique key in case same URL is cited by both
                const key = `${cit.url}-${engine}`;
                if (!citations.has(key)) {
                  citations.set(key, { ...cit, engine });
                }
              }
            });
          }
        });
      }
    });
  }
  const citationsList = Array.from(citations.values());

  return (
    <div className="space-y-12 mb-12">
      
      {/* Module 10 & 12: Improvement Plan & AI Evidence */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Recommended Actions</h2>
          <p className="text-gray-500 mt-1 text-sm">Prioritized steps to improve your AI visibility based on real evidence.</p>
        </div>

        {(!recommendations || recommendations.length === 0) ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No recommendations available at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, idx) => {
              const severityStr = rec.severity ? rec.severity.charAt(0).toUpperCase() + rec.severity.slice(1) : "Medium";
              const priorityClass = 
                (severityStr === "Critical" || severityStr === "High") ? "bg-red-50 text-red-700 border-red-200" :
                severityStr === "Medium" ? "bg-orange-50 text-orange-700 border-orange-200" :
                "bg-blue-50 text-blue-700 border-blue-200";

              return (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:break-after-avoid">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${priorityClass} uppercase tracking-wider`}>
                            {severityStr} Priority
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{rec.action || rec.recommendation}</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Expected Impact</p>
                        <p className="text-gray-900 font-semibold">{rec.expected_gain || rec.impact || "Increase trust and visibility."}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Estimated Effort</p>
                        <p className="text-gray-900 font-semibold capitalize">{rec.fix_difficulty || "Low"}</p>
                      </div>
                    </div>

                    {/* AI Evidence Toggle (Module 12) */}
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <button 
                        onClick={() => toggleRec(idx)}
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {expandedRecs[idx] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {expandedRecs[idx] ? "Hide Evidence" : "View Supporting Evidence"}
                      </button>

                      {expandedRecs[idx] && (
                        <div className="mt-4 bg-blue-50/50 p-5 rounded-xl border border-blue-100 text-sm">
                          <p className="font-semibold text-gray-900 mb-2">Why we recommend this:</p>
                          <p className="text-gray-700 mb-4">{rec.rationale || "Our analysis detected this gap in your content."}</p>
                          
                          {(rec.affected_pages && rec.affected_pages.length > 0) ? (
                            <div>
                              <p className="font-semibold text-gray-900 mb-2">Affected Pages Detected:</p>
                              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                                {rec.affected_pages.slice(0, expandedPages[idx] ? rec.affected_pages.length : 5).map((p: string, i: number) => (
                                  <li key={i} className="truncate"><a href={p} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{p}</a></li>
                                ))}
                                {rec.affected_pages.length > 5 && (
                                  <li>
                                    <button onClick={() => togglePages(idx)} className="text-blue-600 hover:underline text-sm font-medium mt-1">
                                      {expandedPages[idx] ? "Show less" : `...and ${rec.affected_pages.length - 5} more`}
                                    </button>
                                  </li>
                                )}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-gray-600 italic">This is a site-wide recommendation.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Module 13: Citations */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Extracted Citations</h2>
          <p className="text-gray-500 mt-1 text-sm">Sources that AI explicitly referenced when answering queries about your business.</p>
        </div>

        {citationsList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <ExternalLink className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No citations were extracted from the AI responses.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-medium">
                    <th className="p-4">Engine</th>
                    <th className="p-4">Website Title</th>
                    <th className="p-4">Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {citationsList.map((cit, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${cit.engine === 'openai' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                          {cit.engine}
                        </span>
                      </td>
                      <td className="p-4">
                        <a href={cit.url} target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline flex items-start gap-1 break-all">
                          {cit.title || cit.url}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="p-4 text-sm text-gray-600 max-w-md align-top">
                        {cit.snippet ? (
                          <div 
                            onClick={() => toggleSnippet(idx)}
                            className={`bg-blue-50 border border-blue-200 border-l-4 border-l-blue-600 rounded-md p-4 shadow-sm prose prose-sm max-w-none prose-p:my-1 prose-headings:font-bold prose-headings:text-gray-900 cursor-pointer hover:bg-blue-100 transition-colors relative group ${expandedSnippets[idx] ? '' : 'max-h-28 overflow-hidden'}`}
                            title="Click to read full snippet"
                          >
                            <ReactMarkdown>{cit.snippet}</ReactMarkdown>
                            {/* Optional fade out effect */}
                            {!expandedSnippets[idx] && (
                              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-blue-50 to-transparent pointer-events-none group-hover:from-blue-100"></div>
                            )}
                          </div>
                        ) : (
                          <span className="italic opacity-50">No snippet provided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
