"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function ReportCharts({
  scores,
  prompts,
  recommendations,
  intelligence
}: {
  scores: any;
  prompts: any[];
  recommendations: any[];
  intelligence: any;
}) {
  // 1. ChatGPT vs Gemini Recommendation Rate
  let openaiRec = 0; let openaiTotal = 0;
  let geminiRec = 0; let geminiTotal = 0;
  let totalBrandMentions = 0;
  let totalProductMentions = 0;

  prompts?.forEach(p => {
    if (p.playground_results?.live) {
      if (p.playground_results.live['openai']) {
        openaiTotal++;
        const d = p.playground_results.live['openai'];
        if (d.validation?.valid && (d.brand_mentions > 0 || d.product_mentions > 0)) openaiRec++;
        totalBrandMentions += d.brand_mentions || 0;
        totalProductMentions += d.product_mentions || 0;
      }
      if (p.playground_results.live['gemini']) {
        geminiTotal++;
        const d = p.playground_results.live['gemini'];
        if (d.validation?.valid && (d.brand_mentions > 0 || d.product_mentions > 0)) geminiRec++;
        totalBrandMentions += d.brand_mentions || 0;
        totalProductMentions += d.product_mentions || 0;
      }
    }
  });

  const recommendationData = [
    { name: 'ChatGPT', Recommended: openaiRec, 'Not Recommended': openaiTotal - openaiRec },
    { name: 'Gemini', Recommended: geminiRec, 'Not Recommended': geminiTotal - geminiRec },
  ];

  // 2. Recommendation Priority Pie
  let high = 0; let med = 0; let low = 0;
  recommendations?.forEach(r => {
    const sev = (r.severity || "").toLowerCase();
    if (sev === 'critical' || sev === 'high' || r.priority === 1 || r.priority === 2) high++;
    else if (sev === 'medium' || r.priority === 3) med++;
    else low++;
  });
  const priorityData = [
    { name: 'High Priority', value: high, color: '#ef4444' }, // red-500
    { name: 'Medium Priority', value: med, color: '#f97316' }, // orange-500
    { name: 'Low Priority', value: low, color: '#3b82f6' } // blue-500
  ].filter(d => d.value > 0);

  // 3. Mentions Pie
  const mentionsData = [
    { name: 'Brand Mentions', value: totalBrandMentions, color: '#8b5cf6' }, // violet-500
    { name: 'Product Mentions', value: totalProductMentions, color: '#10b981' } // emerald-500
  ].filter(d => d.value > 0);

  // 4. Content Coverage Bar (from intelligence)
  const coverageData = [
    { name: 'Key Topics', Count: intelligence?.entities?.length || 0 },
    { name: 'Products', Count: intelligence?.products?.length || 0 },
    { name: 'Services', Count: intelligence?.services?.length || 0 },
    { name: 'Locations', Count: intelligence?.locations?.length || 0 },
  ].filter(d => d.Count > 0);

  return (
    <div className="mb-12 print:break-inside-avoid">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Data & Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-1 gap-6">

        {/* Chart 1: AI Recommendation Rates */}
        {(openaiTotal > 0 || geminiTotal > 0) && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-300 flex flex-col print:break-inside-avoid overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">ChatGPT vs Gemini</h3>
            <p className="text-xs text-gray-500 mb-6">How often each AI recommends your business. If your bar is red, the AI completely ignored you for those searches. Your goal is to turn these green.</p>
            <div className="h-60 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recommendationData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} padding={{ left: 80, right: 80 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Recommended" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} maxBarSize={60} />
                  <Bar dataKey="Not Recommended" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 2: Priority Pie */}
        {priorityData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-300 flex flex-col print:break-inside-avoid overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">Action Plan Priority</h3>
            <p className="text-xs text-gray-500 mb-6">This breaks down your recommended fixes. Focus on High Priority items first to see the fastest improvement in AI rankings.</p>
            <div className="h-60 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 3: Mentions */}
        {mentionsData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-300 flex flex-col print:break-inside-avoid overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">How AI Talks About You</h3>
            <p className="text-xs text-gray-500 mb-6">If the AI mentions your brand but not your products, it knows who you are but doesn't understand what you sell.</p>
            <div className="h-60 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={mentionsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mentionsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 4: Coverage Bar */}
        {coverageData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-300 flex flex-col print:break-inside-avoid overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">What AI Extracted From Your Site</h3>
            <p className="text-xs text-gray-500 mb-6">The AI reads your website to build its knowledge. If it failed to extract your Services, it won't recommend you for them.</p>
            <div className="h-60 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageData} layout="vertical" margin={{ top: 10, right: 80, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} width={80} />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="Count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
