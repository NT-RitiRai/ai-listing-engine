"use client";
import { MessageSquare, AlertCircle, CheckCircle, HelpCircle, XCircle } from "lucide-react";

export default function AIConversationAnalysis({ geoIntelligence }: { geoIntelligence: any }) {
  if (!geoIntelligence || !geoIntelligence.ai_conversation_analysis) return null;

  const analysis = geoIntelligence.ai_conversation_analysis;
  
  const getConfidenceColor = (level: string) => {
    switch(level?.toLowerCase()) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 font-sans">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-medium text-gray-900">AI Conversation Analysis</h2>
          <p className="text-sm text-gray-500">How LLMs perceive and converse about your brand.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Description */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Model Perception</h3>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <p className="text-gray-800 leading-relaxed font-medium">
                {analysis.how_ai_describes_company || "Insufficient data for models to form a coherent description."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-orange-500" /> Misunderstood Services
              </h3>
              <ul className="space-y-2">
                {analysis.misunderstood_services && analysis.misunderstood_services.length > 0 ? (
                  analysis.misunderstood_services.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500 italic">No misunderstood services detected.</li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" /> Missing Knowledge
              </h3>
              <ul className="space-y-2">
                {analysis.missing_knowledge && analysis.missing_knowledge.length > 0 ? (
                  analysis.missing_knowledge.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-red-50/50 p-3 rounded-lg border border-red-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500 italic">No major knowledge gaps detected.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Confidence Scores */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Recommendation Metrics</h3>
          
          <div className={`p-5 rounded-xl border ${getConfidenceColor(analysis.overall_confidence)}`}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">Extraction Confidence</div>
            <div className="text-2xl font-bold">{analysis.overall_confidence?.toUpperCase() || "UNKNOWN"}</div>
            <p className="mt-2 text-xs opacity-80 leading-relaxed">
              How confident models are in extracting accurate information about your business.
            </p>
          </div>

          <div className={`p-5 rounded-xl border ${getConfidenceColor(analysis.recommendation_probability)}`}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">Recommendation Probability</div>
            <div className="text-2xl font-bold">{analysis.recommendation_probability?.toUpperCase() || "UNKNOWN"}</div>
            <p className="mt-2 text-xs opacity-80 leading-relaxed">
              Likelihood of the model suggesting your business for a commercial query over a competitor.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
