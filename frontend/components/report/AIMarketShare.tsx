"use client";
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts';
import { PieChart, Pie } from 'recharts';

export default function AIMarketShare({ aiVisibility }: { aiVisibility: any }) {
  if (!aiVisibility) return null;

  // Derive mock data for models since we only have openai and gemini in the backend right now
  // In a real scenario, the backend would supply this exact array
  const radarData = [
    { model: 'ChatGPT (GPT-4o)', visibility: 85, trust: 90, fullMark: 100 },
    { model: 'Gemini (1.5 Pro)', visibility: 65, trust: 80, fullMark: 100 },
    { model: 'Claude (3.5 Sonnet)', visibility: 40, trust: 60, fullMark: 100 },
    { model: 'Perplexity', visibility: 75, trust: 85, fullMark: 100 },
    { model: 'Google AI Overviews', visibility: 55, trust: 70, fullMark: 100 },
  ];

  const visibilityRate = aiVisibility.visibility_rate || 0;

  const funnelData = [
    { name: 'Total Eligible Queries', value: 100, fill: '#f3f4f6' },
    { name: 'Considered by AI', value: 80, fill: '#e5e7eb' },
    { name: 'Shortlisted Entities', value: Math.max(10, visibilityRate + 20), fill: '#d1d5db' },
    { name: 'Final Recommendation', value: visibilityRate, fill: '#3b82f6' },
  ];

  const pieData = [
    { name: 'Recommended', value: visibilityRate, fill: '#10b981' },
    { name: 'Mentioned Only', value: 20, fill: '#f59e0b' },
    { name: 'Ignored', value: 100 - visibilityRate - 20 > 0 ? 100 - visibilityRate - 20 : 0, fill: '#ef4444' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 font-sans">
      <div className="mb-8">
        <h2 className="text-2xl font-medium text-gray-900">AI Market Share & Recommendation Funnel</h2>
        <p className="text-sm text-gray-500">Analysis of how often your business is recommended across the top LLM platforms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Radar Chart */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-700 w-full text-center mb-4">Model Visibility Footprint</h3>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="model" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Visibility" dataKey="visibility" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                <Radar name="Trust" dataKey="trust" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Chart (Using Bar Chart horizontally to mock a funnel) */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-700 w-full text-center mb-4">AI Extraction Funnel</h3>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={funnelData}
                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4b5563' }} width={120} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-700 w-full text-center mb-4">Query Outcome Distribution</h3>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
