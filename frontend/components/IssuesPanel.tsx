"use client";
import { useState } from "react";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-900 text-red-300 border-red-800",
  high: "bg-orange-900 text-orange-300 border-orange-800",
  medium: "bg-yellow-900 text-yellow-300 border-yellow-800",
  low: "bg-gray-800 text-gray-300 border-gray-700",
};

const SEVERITY_ICONS: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "⚪",
};

const CATEGORY_FILTERS = ["all", "seo", "aeo", "ai", "geo"];
const CATEGORY_LABELS: Record<string, string> = {
  seo: "SEO",
  aeo: "AEO",
  ai: "AI Readiness",
  geo: "Local/GEO",
};

export default function IssuesPanel({ issues }: { issues: any[] }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === "all" ? issues : issues.filter((i) => i.category === filter);

  const counts = CATEGORY_FILTERS.reduce((acc, cat) => {
    acc[cat] = cat === "all" ? issues.length : issues.filter((i) => i.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const severityCounts = {
    critical: issues.filter((i) => i.severity === "critical").length,
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs uppercase">Total Issues</p>
          <p className="text-2xl font-bold text-white mt-1">{issues.length}</p>
        </div>
        {severityCounts.critical > 0 && (
          <div className="bg-red-900 border border-red-800 rounded-lg p-3">
            <p className="text-red-300 text-xs uppercase">Critical</p>
            <p className="text-2xl font-bold text-red-200 mt-1">{severityCounts.critical}</p>
          </div>
        )}
        {severityCounts.high > 0 && (
          <div className="bg-orange-900 border border-orange-800 rounded-lg p-3">
            <p className="text-orange-300 text-xs uppercase">High</p>
            <p className="text-2xl font-bold text-orange-200 mt-1">{severityCounts.high}</p>
          </div>
        )}
        {severityCounts.medium > 0 && (
          <div className="bg-yellow-900 border border-yellow-800 rounded-lg p-3">
            <p className="text-yellow-300 text-xs uppercase">Medium</p>
            <p className="text-2xl font-bold text-yellow-200 mt-1">{severityCounts.medium}</p>
          </div>
        )}
        {severityCounts.low > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <p className="text-gray-400 text-xs uppercase">Low</p>
            <p className="text-2xl font-bold text-gray-300 mt-1">{severityCounts.low}</p>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {cat === "all" ? "ALL" : CATEGORY_LABELS[cat]} ({counts[cat]})
          </button>
        ))}
      </div>

      {/* Issues list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">✓ No issues found in this category</p>
            <p className="text-sm mt-2">Great job! Keep monitoring for new issues.</p>
          </div>
        ) : (
          filtered.map((issue, idx) => (
            <div
              key={`${issue.category}-${issue.issue_type}-${idx}`}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800 transition-colors"
                onClick={() =>
                  setExpanded(
                    expanded === `${issue.category}-${issue.issue_type}-${idx}`
                      ? null
                      : `${issue.category}-${issue.issue_type}-${idx}`
                  )
                }
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-lg">{SEVERITY_ICONS[issue.severity]}</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      SEVERITY_COLORS[issue.severity]
                    }`}
                  >
                    {issue.severity.toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {issue.issue_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">{issue.impact}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {issue.affected_pages?.length > 0 && (
                    <div className="text-right">
                      <p className="text-gray-400 text-xs font-mono">
                        {issue.affected_pages.length} pages
                      </p>
                    </div>
                  )}
                  <span className="text-gray-500 text-xs">
                    {expanded === `${issue.category}-${issue.issue_type}-${idx}` ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {expanded === `${issue.category}-${issue.issue_type}-${idx}` && (
                <div className="px-5 pb-5 border-t border-gray-800 pt-4 space-y-4">
                  {/* Element */}
                  {issue.element && (
                    <div>
                      <p className="text-gray-500 text-xs uppercase mb-2">HTML Element</p>
                      <p className="text-xs font-mono bg-gray-800 px-3 py-2 rounded text-gray-300 inline-block">
                        {issue.element}
                      </p>
                    </div>
                  )}

                  {/* Recommendation & Impact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-xs uppercase mb-2">Recommendation</p>
                      <p className="text-sm text-gray-200 leading-relaxed">
                        {issue.recommendation}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase mb-2">Why It Matters</p>
                      <p className="text-sm text-gray-200 leading-relaxed">{issue.impact}</p>
                    </div>
                  </div>

                  {/* Fix Difficulty */}
                  <div className="flex items-center gap-2">
                    <p className="text-gray-500 text-xs uppercase">Fix Difficulty:</p>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        issue.fix_difficulty === "easy"
                          ? "bg-green-900 text-green-300"
                          : issue.fix_difficulty === "medium"
                          ? "bg-yellow-900 text-yellow-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {issue.fix_difficulty.toUpperCase()}
                    </span>
                  </div>

                  {/* Affected Pages */}
                  {issue.affected_pages?.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs uppercase mb-2">
                        Affected Pages ({issue.affected_pages.length})
                      </p>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {issue.affected_pages.map((page: string, i: number) => (
                          <a
                            key={i}
                            href={page}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-gray-800 text-blue-400 px-2 py-1 rounded hover:bg-gray-700 truncate max-w-xs transition-colors"
                            title={page}
                          >
                            {page.length > 40 ? page.substring(0, 40) + "..." : page}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                    <span className="text-gray-500 text-xs uppercase">Category:</span>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-800 text-gray-300">
                      {CATEGORY_LABELS[issue.category]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {issues.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm">
            All issues are detected from your crawled data. Fix critical and high-priority issues first.
          </p>
        </div>
      )}
    </div>
  );
}
