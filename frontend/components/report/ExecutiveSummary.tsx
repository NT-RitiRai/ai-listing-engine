"use client";
import { CheckCircle, AlertTriangle, AlertCircle, TrendingUp } from "lucide-react";

export default function ExecutiveSummary({ 
  analysis, 
  scores, 
  intelligence, 
  recommendations 
}: { 
  analysis: any;
  scores: any; 
  intelligence: any; 
  recommendations: any[];
}) {
  const aiScore = scores?.ai_readiness_score || 0;
  
  let statusText = "Critical";
  let statusColor = "text-red-500";
  let bgColor = "bg-red-500/10";
  let summaryText = "Your website is currently difficult for AI assistants to recommend.";
  
  if (aiScore >= 80) {
    statusText = "Excellent";
    statusColor = "text-green-500";
    bgColor = "bg-green-500/10";
    summaryText = "Your website is highly visible and frequently recommended by AI assistants.";
  } else if (aiScore >= 60) {
    statusText = "Good";
    statusColor = "text-emerald-400";
    bgColor = "bg-emerald-500/10";
    summaryText = "Your website is reasonably visible, but some key information is missing for AI assistants.";
  } else if (aiScore >= 40) {
    statusText = "Average";
    statusColor = "text-yellow-500";
    bgColor = "bg-yellow-500/10";
    summaryText = "Your website is occasionally recommended, but requires significant improvements to build trust.";
  }

  const topPriority = recommendations?.find(r => r.priority === "High") || recommendations?.[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Module 1: Executive Summary */}
      <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Executive Summary</h2>
        <div className="mb-8">
          {(intelligence?.brands && intelligence.brands.length > 0) ? (
            <p className="text-gray-900 font-medium text-lg capitalize">{intelligence.brands[0]}</p>
          ) : (
            <p className="text-gray-900 font-medium text-lg capitalize">{analysis?.url ? new URL(analysis.url.startsWith('http') ? analysis.url : `https://${analysis.url}`).hostname.replace('www.', '').split('.')[0] : 'Company Overview'}</p>
          )}
          <a href={analysis?.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm mb-4 inline-block">{analysis?.url}</a>
          
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl border-l-2 border-blue-200 pl-3">
            {intelligence?.business_summary || 
             (intelligence?.industry ? `A business operating primarily in the ${intelligence.industry} industry.` : 
             "Comprehensive AI visibility and search presence report for this domain.")}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Overall AI Visibility</h3>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${bgColor} ${statusColor} font-medium`}>
              {statusText}
            </div>
            <p className="mt-3 text-lg text-gray-800">{summaryText}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Highest Priority Action</h3>
              <p className="text-gray-900 font-medium">{topPriority ? topPriority.action || topPriority.recommendation : "Review website content for missing information."}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Estimated Opportunity</h3>
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <TrendingUp className="w-5 h-5" />
                High
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module 3 & 11: Score & Business Impact */}
      <div className="space-y-6 print:break-inside-avoid">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center h-full">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6 w-full text-left">AI Visibility Score</h3>
          
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-100"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={statusColor}
                strokeWidth="3"
                strokeDasharray={`${aiScore}, 100`}
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-gray-900">{aiScore}</span>
              <span className="text-xs font-medium text-gray-400 mt-1">/ 100</span>
            </div>
          </div>
          
          <p className="mt-6 text-sm text-gray-600 font-medium">{statusText}</p>
        </div>
      </div>

      {/* Module 11: Business Impact */}
      <div className="md:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 flex flex-col sm:flex-row items-center gap-6 print:break-inside-avoid">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-50">
          <TrendingUp className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Business Impact</h3>
          <p className="text-gray-600">
            If these improvements are completed, your website is more likely to <strong className="text-gray-900">appear in AI answers</strong>, <strong className="text-gray-900">increase customer trust</strong>, and <strong className="text-gray-900">receive more qualified enquiries</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
