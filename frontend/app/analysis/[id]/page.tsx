"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getAnalysis, getScores, getIssues, getRecommendations, getIntelligence, getStrengthsWeaknesses, getPrompts } from "@/lib/api";
import ScoresPanel from "@/components/ScoresPanel";
import IssuesPanel from "@/components/IssuesPanel";
import IntelligencePanel from "@/components/IntelligencePanel";
import RecommendationsPanel from "@/components/RecommendationsPanel";
import PromptsPanel from "@/components/PromptsPanel";
import WebsiteOverviewPanel from "@/components/WebsiteOverviewPanel";
import BlockedAnalysisPanel from "@/components/BlockedAnalysisPanel";

const TABS = ["Overview", "Issues", "Intelligence", "Recommendations", "Prompts"];
const COMPLETED = "completed";
const POLLING_STATUSES = ["pending", "crawling", "extracting", "analyzing", "scoring", "generating_prompts"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Queued...",
  crawling: "Crawling website...",
  extracting: "Extracting content...",
  analyzing: "Building intelligence profile...",
  scoring: "Calculating scores...",
  generating_prompts: "Generating AI prompts...",
  completed: "Analysis complete",
  failed: "Analysis failed",
};

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState("Overview");

  const { data: analysis, isLoading } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => getAnalysis(id),
    refetchInterval: (query) =>
      POLLING_STATUSES.includes(query.state.data?.status) ? 3000 : false,
  });

  const isComplete = analysis?.status === COMPLETED;

  const { data: scores } = useQuery({
    queryKey: ["scores", id],
    queryFn: () => getScores(id),
    enabled: isComplete,
  });

  const { data: issues } = useQuery({
    queryKey: ["issues", id],
    queryFn: () => getIssues(id),
    enabled: isComplete,
  });

  const { data: recommendations } = useQuery({
    queryKey: ["recommendations", id],
    queryFn: () => getRecommendations(id),
    enabled: isComplete,
  });

  const { data: intelligence } = useQuery({
    queryKey: ["intelligence", id],
    queryFn: () => getIntelligence(id),
    enabled: isComplete,
  });

  const { data: strengthsWeaknesses } = useQuery({
    queryKey: ["strengthsWeaknesses", id],
    queryFn: () => getStrengthsWeaknesses(id),
    enabled: isComplete,
  });

  const { data: prompts } = useQuery({
    queryKey: ["prompts", id],
    queryFn: () => getPrompts(id),
    enabled: isComplete,
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-semibold text-lg truncate max-w-xl">{analysis?.url}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{STATUS_LABELS[analysis?.status] ?? analysis?.status}</p>
          </div>
          {!isComplete && POLLING_STATUSES.includes(analysis?.status) && (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <span className="animate-pulse w-2 h-2 bg-blue-400 rounded-full inline-block" />
              Processing
            </div>
          )}
          {analysis?.status === "failed" && (
            <span className="text-red-400 text-sm">{analysis.error}</span>
          )}
        </div>
      </div>

      {/* Progress bar while running */}
      {POLLING_STATUSES.includes(analysis?.status) && (
        <div className="h-1 bg-gray-800">
          <div className="h-1 bg-blue-500 animate-pulse w-1/2" />
        </div>
      )}

      {isComplete && (
        <>
          {/* Check if analysis was blocked */}
          {analysis?.status === "failed" && analysis?.error?.includes("BLOCKED:") ? (
            <BlockedAnalysisPanel url={analysis.url} error={analysis.error} />
          ) : (
            <>
          {/* Tabs */}
          <div className="border-b border-gray-800 bg-gray-900 px-6">
            <div className="max-w-7xl mx-auto flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === t
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {t}
                  {t === "Issues" && issues && (
                    <span className="ml-2 bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">
                      {issues.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            {tab === "Overview" && (
              <div className="space-y-8">
                <ScoresPanel scores={scores} />
                <WebsiteOverviewPanel intelligence={intelligence} issues={issues ?? []} strengthsWeaknesses={strengthsWeaknesses} />
              </div>
            )}
            {tab === "Issues" && <IssuesPanel issues={issues ?? []} />}
            {tab === "Intelligence" && <IntelligencePanel intelligence={intelligence} />}
            {tab === "Recommendations" && <RecommendationsPanel recommendations={recommendations ?? []} />}
            {tab === "Prompts" && <PromptsPanel prompts={prompts ?? []} analysisId={id} />}
          </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
