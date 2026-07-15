"use client";
import { X, Check } from "lucide-react";

export default function QueryMatrix({ 
  prompts, 
  scores, 
  analysis 
}: { 
  prompts: any[]; 
  scores: any;
  analysis: any;
}) {
  if (!prompts || prompts.length === 0) return null;

  const livePrompts = prompts.filter(p => p.playground_results?.live && Object.keys(p.playground_results?.live).length > 0);
  if (livePrompts.length === 0) return null;

  let gptCitations = 0;
  let geminiCitations = 0;
  let gptTotal = 0;
  let geminiTotal = 0;

  livePrompts.forEach(prompt => {
    const gptData = prompt.playground_results?.live?.['openai'];
    const geminiData = prompt.playground_results?.live?.['gemini'];
    
    if (gptData) {
      gptTotal++;
      if (gptData.validation?.valid && (gptData.brand_mentions > 0 || gptData.product_mentions > 0)) gptCitations++;
    }
    if (geminiData) {
      geminiTotal++;
      if (geminiData.validation?.valid && (geminiData.brand_mentions > 0 || geminiData.product_mentions > 0)) geminiCitations++;
    }
  });

  const totalQueries = gptTotal + geminiTotal;
  const avgVisibility = totalQueries > 0 ? Math.round(((gptCitations + geminiCitations) / totalQueries) * 100) : 0;

  const getStatus = (data: any) => {
    if (!data) return { text: "-", color: "text-gray-400", icon: null };
    const isRecommended = data.validation?.valid && (data.brand_mentions > 0 || data.product_mentions > 0);
    if (isRecommended) {
      return { text: "Mentioned", color: "text-green-600 font-medium", icon: <Check className="w-4 h-4 mr-1.5" /> };
    } else {
      return { text: "Not cited", color: "text-red-500 font-medium", icon: <X className="w-4 h-4 mr-1.5" /> };
    }
  };

  const domainName = analysis?.url ? new URL(analysis.url.startsWith('http') ? analysis.url : `https://${analysis.url}`).hostname.replace('www.', '') : 'your website';

  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          We ran the audit. Here's what AI says about {domainName} today.
        </h2>
        <p className="text-gray-500 mt-2">
          We tested high-intent queries across ChatGPT and Gemini. Results below are indicative of your current AI visibility.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden mb-8 print:break-inside-avoid">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0f172a] text-white">
              <tr>
                <th className="px-6 py-4 font-semibold">Query</th>
                <th className="px-6 py-4 font-semibold w-40 text-center">ChatGPT</th>
                <th className="px-6 py-4 font-semibold w-40 text-center">Gemini</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {livePrompts.map((prompt, idx) => {
                const gptData = prompt.playground_results?.live?.['openai'];
                const geminiData = prompt.playground_results?.live?.['gemini'];

                const gptStatus = getStatus(gptData);
                const geminiStatus = getStatus(geminiData);

                return (
                  <tr key={idx} className="print:break-inside-avoid hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-700 font-medium">{prompt.prompt_text}</td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center justify-center ${gptStatus.color}`}>
                        {gptStatus.icon}{gptStatus.text}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center justify-center ${geminiStatus.color}`}>
                        {geminiStatus.icon}{geminiStatus.text}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score */}
        <div className="bg-red-50/50 rounded-xl border border-red-100 p-6 text-center shadow-sm">
          <div className="text-4xl font-bold text-red-600 mb-2">{avgVisibility}<span className="text-2xl text-red-400">%</span></div>
          <div className="font-semibold text-gray-900 mb-1">Average Visibility Rate</div>
          <div className="text-sm text-gray-500">
            Across {totalQueries} AI queries
          </div>
        </div>

        {/* ChatGPT Rate */}
        <div className="bg-orange-50/50 rounded-xl border border-orange-100 p-6 text-center shadow-sm">
          <div className="text-4xl font-bold text-orange-600 mb-2">{gptTotal > 0 ? Math.round((gptCitations / gptTotal) * 100) : 0}%</div>
          <div className="font-semibold text-gray-900 mb-1">ChatGPT visibility rate</div>
          <div className="text-sm text-gray-500">{gptCitations} of {gptTotal} queries</div>
        </div>

        {/* Gemini Rate */}
        <div className="bg-green-50/50 rounded-xl border border-green-100 p-6 text-center shadow-sm">
          <div className="text-4xl font-bold text-green-600 mb-2">{geminiTotal > 0 ? Math.round((geminiCitations / geminiTotal) * 100) : 0}%</div>
          <div className="font-semibold text-gray-900 mb-1">Gemini visibility rate</div>
          <div className="text-sm text-gray-500">{geminiCitations} of {geminiTotal} queries</div>
        </div>
      </div>
    </div>
  );
}
