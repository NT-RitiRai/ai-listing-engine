import os
import re

path = r"c:\Users\ASUS\Downloads\ai-listing-engine\frontend\components\report\v4\AISummaryReportView.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

imports = """
import { getScores, getCompetitors, getPrompts } from '@/lib/api';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
"""
if "import { getScores" not in content:
    content = content.replace("import ReactMarkdown from 'react-markdown';", "import ReactMarkdown from 'react-markdown';\n" + imports)


queries = """
  const { data: scores } = useQuery({ queryKey: ['scores', analysisId], queryFn: () => getScores(analysisId) });
  const { data: competitors } = useQuery({ queryKey: ['competitors', analysisId], queryFn: () => getCompetitors(analysisId) });
  const { data: prompts } = useQuery({ queryKey: ['prompts', analysisId], queryFn: () => getPrompts(analysisId) });

  // Prepare Chart Data
  const scoreData = scores ? [
    { subject: 'SEO', A: scores.seo_score, fullMark: 100 },
    { subject: 'AEO', A: scores.aeo_score, fullMark: 100 },
    { subject: 'GEO', A: scores.geo_score, fullMark: 100 },
    { subject: 'AI Readiness', A: scores.ai_readiness_score, fullMark: 100 }
  ] : [];

  const compData = competitors?.competitors ? competitors.competitors.slice(0, 5).map((c: any) => ({
    name: c.name,
    sov: c.share_of_voice
  })) : [];

  let won = 0, lost = 0;
  if (prompts) {
    prompts.forEach((p: any) => {
      let gpt = 0, gem = 0;
      if (p.playground_results?.live) {
        const live = p.playground_results.live;
        if (live.openai) gpt = live.openai.brand_mentions > 0 && live.openai.validation?.valid ? 100 : 0;
        if (live.gemini) gem = live.gemini.brand_mentions > 0 && live.gemini.validation?.valid ? 100 : 0;
      }
      const avg = (gpt + gem) / 2;
      if (avg >= 45) won++; else lost++;
    });
  }
  const pieData = [
    { name: 'Won', value: won, color: '#10b981' },
    { name: 'Lost', value: lost, color: '#ef4444' }
  ];
"""

if "const { data: scores }" not in content:
    content = content.replace("  const handlePrint = () => {", queries + "\n  const handlePrint = () => {")


renderOverview = """
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Building2 className="w-6 h-6" /></div>
            <h2 className="text-2xl font-bold text-gray-900">Business Overview & Visibility</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 prose prose-indigo max-w-none text-gray-700">
              <ReactMarkdown>{data.overview}</ReactMarkdown>
            </div>
            <div className="h-64 bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-col items-center justify-center">
              <h3 className="text-sm font-bold text-gray-500 mb-2">Visibility Breakdown</h3>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={scoreData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#6b7280', fontSize: 12}} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
"""

content = re.sub(r'<div className="flex items-center gap-3 border-b border-gray-100 pb-4">[\s\S]*?<ReactMarkdown>\{data.overview\}<\/ReactMarkdown>\s*<\/div>', renderOverview.strip(), content)


renderComp = """
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Compass className="w-6 h-6" /></div>
            <h2 className="text-2xl font-bold text-gray-900">Competitor Analysis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="prose prose-indigo max-w-none text-gray-700">
              <ReactMarkdown>{data.competitor_analysis}</ReactMarkdown>
            </div>
            <div className="h-72 bg-gray-50 rounded-xl border border-gray-100 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-gray-500 mb-4 text-center">Top 5 Competitor Share of Voice</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#374151', fontSize: 12}} width={100} />
                    <Bar dataKey="sov" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
"""
content = re.sub(r'<div className="flex items-center gap-3 border-b border-gray-100 pb-4">[\s\S]*?<ReactMarkdown>\{data.competitor_analysis\}<\/ReactMarkdown>\s*<\/div>', renderComp.strip(), content)


renderFail = """
          <div className="flex items-center gap-3 border-b border-red-100 pb-4">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Target className="w-6 h-6" /></div>
            <h2 className="text-2xl font-bold text-gray-900">Critical Failures & Gaps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 prose prose-red max-w-none text-gray-700">
              <ReactMarkdown>{data.failures_analysis}</ReactMarkdown>
            </div>
            <div className="h-64 bg-red-50 rounded-xl border border-red-100 p-4 flex flex-col items-center justify-center">
              <h3 className="text-sm font-bold text-red-600 mb-2">Live Prompt Win Rate</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-sm font-bold">
                 <span className="text-emerald-600">Won: {won}</span>
                 <span className="text-red-600">Lost: {lost}</span>
              </div>
            </div>
          </div>
"""
content = re.sub(r'<div className="flex items-center gap-3 border-b border-red-100 pb-4">[\s\S]*?<ReactMarkdown>\{data.failures_analysis\}<\/ReactMarkdown>\s*<\/div>', renderFail.strip(), content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated View with Charts")
