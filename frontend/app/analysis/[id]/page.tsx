"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Download, Building2, Lightbulb, Activity, MessageSquare, Link, Users, Compass, BrainCircuit, TrendingUp, Target, Network, Map, Database } from "lucide-react";
import { getAnalysis, getScores, getRecommendations, getIntelligence, getGeoIntelligence, getCompetitors, getPrompts, getCrawlData } from "@/lib/api";

import Page1BusinessProfile from "@/components/report/v4/Page1BusinessProfile";
import Page2ExecutiveInsights from "@/components/report/v4/Page2ExecutiveInsights";
import Page3VisibilityOverview from "@/components/report/v4/Page3VisibilityOverview";
import Page4PromptAnalysis from "@/components/report/v4/Page4PromptAnalysis";
import Page5CitationIntelligence from "@/components/report/v4/Page5CitationIntelligence";
import Page6AIRecommendation from "@/components/report/v4/Page6AIRecommendation";
import Page7IntentAnalysis from "@/components/report/v4/Page7IntentAnalysis";
import Page8AIUnderstanding from "@/components/report/v4/Page8AIUnderstanding";
import Page9EntityIntelligence from "@/components/report/v4/Page9EntityIntelligence";
import Page10KnowledgeGraph from "@/components/report/v4/Page10KnowledgeGraph";
import Page11CompetitorIntelligence from "@/components/report/v4/Page11CompetitorIntelligence";
import Page12CompetitorComparison from "@/components/report/v4/Page12CompetitorComparison";
import Page13AISearchPerformance from "@/components/report/v4/Page13AISearchPerformance";
import Page14BuyerJourney from "@/components/report/v4/Page14BuyerJourney";
import Page15CommercialOpportunity from "@/components/report/v4/Page15CommercialOpportunity";
import Page16RevenueImpact from "@/components/report/v4/Page16RevenueImpact";
import Page17IssueAnalysis from "@/components/report/v4/Page17IssueAnalysis";
import Page18ActionPlan from "@/components/report/v4/Page18ActionPlan";
import Page19Roadmap from "@/components/report/v4/Page19Roadmap";
import Page20Appendix from "@/components/report/v4/Page20Appendix";
import AISummaryReportView from "@/components/report/v4/AISummaryReportView";
import BlockedAnalysisPanel from "@/components/BlockedAnalysisPanel";

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

const SECTIONS = [
  { id: "s1", title: "Business Overview", icon: Building2 },
  { id: "s2", title: "Executive Summary", icon: Lightbulb },
  { id: "s3", title: "AI Visibility Score", icon: Activity },
  { id: "s4", title: "AI Search Queries", icon: MessageSquare },
  { id: "s5", title: "Brand Mentions", icon: Link },
  { id: "s6", title: "AI Recommendations", icon: Users },
  { id: "s7", title: "User Search Intent", icon: Compass },
  { id: "s8", title: "AI Brand Comprehension", icon: BrainCircuit },
  { id: "s9", title: "Brand Identity & Footprint", icon: TrendingUp },
  { id: "s10", title: "Digital Knowledge Network", icon: Network },
  { id: "s11", title: "Competitor Analysis", icon: Users },
  { id: "s12", title: "Competitor Comparison", icon: Compass },
  { id: "s13", title: "AI Search Performance", icon: Activity },
  { id: "s14", title: "Buyer Journey", icon: Compass },
  { id: "s15", title: "Growth Opportunities", icon: TrendingUp },
  { id: "s16", title: "Revenue Impact", icon: Activity },
  { id: "s17", title: "Critical Issues", icon: Target },
  { id: "s18", title: "Strategic Recommendations", icon: Target },
  { id: "s19", title: "Action Plan & Roadmap", icon: Map },
  { id: "s20", title: "Appendix / Data", icon: Database },
];

export default function AnalysisPage() {
  const { id } = useParams() as { id: string };
  const [activeSection, setActiveSection] = useState("s1");
  const [isExporting, setIsExporting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const { data: analysis, isLoading } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => getAnalysis(id),
    refetchInterval: (query) =>
      POLLING_STATUSES.includes(query.state.data?.status) ? 3000 : false,
  });

  const isComplete = analysis?.status === COMPLETED;

  const { data: scores } = useQuery({ queryKey: ["scores", id], queryFn: () => getScores(id), enabled: isComplete });
  const { data: recommendations } = useQuery({ queryKey: ["recommendations", id], queryFn: () => getRecommendations(id), enabled: isComplete });
  const { data: intelligence } = useQuery({ queryKey: ["intelligence", id], queryFn: () => getIntelligence(id), enabled: isComplete });
  const { data: geoIntelligence } = useQuery({ queryKey: ["geoIntelligence", id], queryFn: () => getGeoIntelligence(id), enabled: isComplete });
  const { data: competitorsData } = useQuery({ queryKey: ["competitors", id], queryFn: () => getCompetitors(id), enabled: isComplete });
  const { data: prompts } = useQuery({ queryKey: ["prompts", id], queryFn: () => getPrompts(id), enabled: isComplete });
  const { data: crawlData } = useQuery({ queryKey: ["crawlData", id], queryFn: () => getCrawlData(id), enabled: isComplete });

  const handlePrint = () => {
    setIsExporting(true);
    // Allow React time to render all components to the DOM
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 800);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium">Loading analysis...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 flex flex-col print:block">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 shadow-sm no-print">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2.5 rounded-xl text-white shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-gray-900 font-bold text-lg md:text-xl tracking-tight">Executive AI Visibility Report</h1>
              <p className="text-sm text-gray-500 font-medium truncate max-w-[280px] md:max-w-md">{analysis?.url}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
            {!isComplete && POLLING_STATUSES.includes(analysis?.status) && (
              <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                <span className="animate-pulse w-2 h-2 bg-indigo-600 rounded-full inline-block" />
                {STATUS_LABELS[analysis?.status] ?? "Processing"}
              </div>
            )}
            {analysis?.status === "failed" && (
              <span className="text-red-600 font-medium text-sm bg-red-50 px-3 py-1.5 rounded-full border border-red-100">{analysis.error}</span>
            )}
            {isComplete && (
              <>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm text-sm"
              >
                <Download className="w-4 h-4" />
                Export Executive PDF
              </button>
              <button onClick={() => setShowSummary(!showSummary)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm text-sm"><Lightbulb className="w-4 h-4" /> {showSummary ? "Back to Full Report" : "Generate AI Summary"}</button>
              </>
            )}
          </div>
        </div>
      </div>

      {POLLING_STATUSES.includes(analysis?.status) && (
        <div className="h-1 bg-gray-100 no-print">
          <div className="h-full bg-indigo-600 animate-pulse w-1/2" />
        </div>
      )}

      {isComplete && analysis?.status !== "failed" && (
        <div className="flex-1 max-w-[1400px] mx-auto w-full flex flex-col md:flex-row mt-6 gap-8 px-6 pb-12 print:block">
          
          {showSummary ? (<div className="w-full max-w-[1400px] mx-auto py-8 px-6"><AISummaryReportView analysisId={id} /></div>) : (<>
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0 no-print overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <div className="flex md:flex-col md:sticky md:top-28 space-x-2 md:space-x-0 md:space-y-1 bg-white rounded-2xl p-2 md:p-4 shadow-sm border border-gray-100 min-w-max md:min-w-0">
              {SECTIONS.map((sec, idx) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 hidden md:block ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
                    <span className="text-left whitespace-nowrap">{idx + 1}. {sec.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 bg-white/50 rounded-3xl p-6 md:p-8 min-h-[800px] print:p-0 print:bg-transparent print:border-none print:block shadow-sm border border-gray-100">
            {(activeSection === "s1" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page1BusinessProfile analysis={analysis} scores={scores} intelligence={intelligence} /></div>}
            {(activeSection === "s2" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page2ExecutiveInsights intelligence={intelligence} recommendations={recommendations} scores={scores} /></div>}
            {(activeSection === "s3" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page3VisibilityOverview prompts={prompts || []} /></div>}
            {(activeSection === "s4" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page4PromptAnalysis prompts={prompts || []} /></div>}
            {(activeSection === "s5" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page5CitationIntelligence intelligence={intelligence} scores={scores} prompts={prompts || []} /></div>}
            {(activeSection === "s6" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page6AIRecommendation prompts={prompts || []} intelligence={intelligence} recommendations={recommendations} /></div>}
            {(activeSection === "s7" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page7IntentAnalysis prompts={prompts || []} /></div>}
            {(activeSection === "s8" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page8AIUnderstanding intelligence={intelligence} scores={scores} /></div>}
            {(activeSection === "s9" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page9EntityIntelligence intelligence={intelligence} scores={scores} /></div>}
            {(activeSection === "s10" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page10KnowledgeGraph intelligence={intelligence} scores={scores} /></div>}
            {(activeSection === "s11" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page11CompetitorIntelligence competitorsData={competitorsData} /></div>}
            {(activeSection === "s12" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page12CompetitorComparison competitorsData={competitorsData} /></div>}
            {(activeSection === "s13" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page13AISearchPerformance prompts={prompts || []} scores={scores} /></div>}
            {(activeSection === "s14" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page14BuyerJourney prompts={prompts || []} /></div>}
            {(activeSection === "s15" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page15CommercialOpportunity prompts={prompts || []} scores={scores} /></div>}
            {(activeSection === "s16" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page16RevenueImpact competitorsData={competitorsData} scores={scores} recommendations={recommendations} /></div>}
            {(activeSection === "s17" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page17IssueAnalysis recommendations={recommendations} intelligence={intelligence} /></div>}
            {(activeSection === "s18" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page18ActionPlan recommendations={recommendations} /></div>}
            {(activeSection === "s19" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page19Roadmap recommendations={recommendations} /></div>}
            {(activeSection === "s20" || isExporting) && <div className={isExporting ? "mb-16 print:break-after-page" : ""}><Page20Appendix prompts={prompts || []} competitorsData={competitorsData} scores={scores} intelligence={intelligence} recommendations={recommendations} crawlData={crawlData} /></div>}
          </main>

        </>)}
        </div>
      )}
      
      {analysis?.status === "failed" && analysis?.error?.includes("BLOCKED:") && (
        <div className="max-w-4xl mx-auto mt-12 px-6"><BlockedAnalysisPanel url={analysis.url} error={analysis.error} /></div>
      )}
    </div>
  );
}

function IconForSection({ id }: { id: string }) {
  const sec = SECTIONS.find(s => s.id === id);
  if (!sec) return null;
  const Icon = sec.icon;
  return <Icon className="w-16 h-16 opacity-20" />;
}
