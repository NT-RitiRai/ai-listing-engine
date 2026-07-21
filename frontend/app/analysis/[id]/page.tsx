"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Download, LayoutDashboard, Briefcase, FileSearch } from "lucide-react";
import { getAnalysis, getScores, getIssues, getRecommendations, getIntelligence, getStrengthsWeaknesses, getPrompts, getGeoIntelligence, getCompetitors } from "@/lib/api";

import ExecutiveSummary from "@/components/report/ExecutiveSummary";
import RevenueOpportunity from "@/components/report/RevenueOpportunity";
import AIMarketShare from "@/components/report/AIMarketShare";
import AIConversationAnalysis from "@/components/report/AIConversationAnalysis";
import ConsultantRecommendations from "@/components/report/ConsultantRecommendations";
import GrowthRoadmap90Day from "@/components/report/GrowthRoadmap90Day";
import BlockedAnalysisPanel from "@/components/BlockedAnalysisPanel";

// New Competitor Components
import CompetitorLeaderboard from "@/components/report/competitor/CompetitorLeaderboard";
import CompetitorMatrix from "@/components/report/competitor/CompetitorMatrix";
import RadarComparison from "@/components/report/competitor/RadarComparison";
import OpportunityFunnel from "@/components/report/competitor/OpportunityFunnel";
import CompetitorHeatmap from "@/components/report/competitor/CompetitorHeatmap";

const COMPLETED = "completed";
const POLLING_STATUSES = ["pending", "crawling", "extracting", "analyzing", "analyzing_competitors", "scoring", "generating_prompts"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Queued...",
  crawling: "Crawling website...",
  extracting: "Extracting content...",
  analyzing: "Building intelligence profile...",
  analyzing_competitors: "Analyzing competitor visibility...",
  scoring: "Calculating scores...",
  generating_prompts: "Generating AI prompts...",
  completed: "Analysis complete",
  failed: "Analysis failed",
};

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();

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

  const { data: geoIntelligence } = useQuery({
    queryKey: ["geoIntelligence", id],
    queryFn: () => getGeoIntelligence(id),
    enabled: isComplete,
  });

  const { data: competitorsData } = useQuery({
    queryKey: ["competitors", id],
    queryFn: () => getCompetitors(id),
    enabled: isComplete,
  });

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium">Loading analysis...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      {/* Header - Hidden during print */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 no-print shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gray-900 p-2 rounded-lg text-white">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-gray-900 font-bold text-lg truncate max-w-xl leading-tight">Enterprise AI Strategy Report</h1>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">{analysis?.url}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isComplete && POLLING_STATUSES.includes(analysis?.status) && (
              <div className="flex items-center gap-2 text-blue-600 font-medium text-sm bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                <span className="animate-pulse w-2 h-2 bg-blue-600 rounded-full inline-block" />
                {STATUS_LABELS[analysis?.status] ?? "Processing"}
              </div>
            )}
            {analysis?.status === "failed" && (
              <span className="text-red-600 font-medium text-sm bg-red-50 px-3 py-1.5 rounded-full border border-red-100">{analysis.error}</span>
            )}
            {isComplete && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm text-sm"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar while running */}
      {POLLING_STATUSES.includes(analysis?.status) && (
        <div className="h-1 bg-gray-100 no-print">
          <div className="h-full bg-blue-600 animate-pulse w-1/2" />
        </div>
      )}

      {isComplete && (
        <main className="max-w-6xl mx-auto px-6 py-12">
          {analysis?.status === "failed" && analysis?.error?.includes("BLOCKED:") ? (
            <BlockedAnalysisPanel url={analysis.url} error={analysis.error} />
          ) : (
            <div id="report-container" className="space-y-4 print-m-0">
              
              <div className="mb-10 text-center print-only">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Enterprise AI Strategy Report</h1>
                <p className="text-gray-500 text-lg">{analysis?.url}</p>
                <p className="text-gray-400 text-sm mt-4">Generated on {new Date().toLocaleDateString()}</p>
              </div>

              {/* Step 1: Executive KPI Summary */}
              <ExecutiveSummary
                analysis={analysis}
                scores={scores}
                intelligence={intelligence}
                geoIntelligence={geoIntelligence}
              />

              {/* Step 2: Commercial Impact (The "Why Should I Care?") */}
              <RevenueOpportunity geoIntelligence={geoIntelligence} />

              {/* Step 3: Current State of Play */}
              <AIMarketShare aiVisibility={geoIntelligence?.evidence_object?.ai_visibility} />
              
              {/* Step 3.5: Enterprise Competitor Intelligence */}
              {competitorsData && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pt-12 pb-4">
                    <h2 className="text-3xl font-bold text-gray-900 border-b-2 border-indigo-500 pb-2">Competitive Intelligence</h2>
                  </div>
                  
                  <CompetitorLeaderboard competitorsData={competitorsData} />
                  <OpportunityFunnel competitorsData={competitorsData} />
                  <RadarComparison competitorsData={competitorsData} intelligence={intelligence} />
                  <CompetitorMatrix competitorsData={competitorsData} />
                  <CompetitorHeatmap competitorsData={competitorsData} />
                </div>
              )}

              {/* Step 4: AI Model Perception Analysis */}
              <AIConversationAnalysis geoIntelligence={geoIntelligence} />

              {/* Step 5: Strategic Business Solutions */}
              <ConsultantRecommendations recommendations={recommendations || []} />

              {/* Step 6: The Roadmap to Success */}
              <GrowthRoadmap90Day geoIntelligence={geoIntelligence} />

              {/* Footer */}
              <div className="mt-20 pt-8 border-t border-gray-200 text-center text-gray-400 text-sm pb-8">
                <p>AI Listing Engine &copy; {new Date().getFullYear()}</p>
                <p className="mt-1">CONFIDENTIAL - Executive Strategy Document</p>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
