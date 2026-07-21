"use client";
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Network } from 'lucide-react';

export default function RadarComparison({ competitorsData, intelligence }: { competitorsData: any, intelligence: any }) {
  if (!competitorsData || !competitorsData.competitors) return null;

  // Since we don't extract full metrics for competitors directly from LLM yet, 
  // we will mock the radar shape using their confidence score mapped against generic dimensions
  // In a full production version, we would extract these explicit dimensions for each competitor.
  const top2 = competitorsData.competitors.slice(0, 2);
  
  if (top2.length === 0) return null;

  const radarData = competitorsData.insight_analysis?.radar_dimensions;
  if (!radarData || !radarData.target_business) return null;

  const tb = radarData.target_business;
  const c1 = radarData.competitors?.[0] || { entity_strength: 0, content_depth: 0, topical_authority: 0, trust_eeat: 0, commercial_intent: 0 };
  const c2 = radarData.competitors?.[1] || { entity_strength: 0, content_depth: 0, topical_authority: 0, trust_eeat: 0, commercial_intent: 0 };

  const data = [
    {
      subject: 'Entity Strength',
      A: tb.entity_strength, 
      B: c1.entity_strength, 
      C: c2.entity_strength, 
    },
    {
      subject: 'Content Depth',
      A: tb.content_depth,
      B: c1.content_depth,
      C: c2.content_depth,
    },
    {
      subject: 'Topical Authority',
      A: tb.topical_authority,
      B: c1.topical_authority,
      C: c2.topical_authority,
    },
    {
      subject: 'Trust/EEAT',
      A: tb.trust_eeat,
      B: c1.trust_eeat,
      C: c2.trust_eeat,
    },
    {
      subject: 'Commercial Intent',
      A: tb.commercial_intent,
      B: c1.commercial_intent,
      C: c2.commercial_intent,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 font-sans">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-medium text-gray-900">Entity & Authority Comparison</h2>
          <p className="text-sm text-gray-500">Mapping your business against top AI competitors across critical dimensions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="md:col-span-2 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              
              <Radar name="Your Business" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} strokeWidth={2} />
              <Radar name={radarData.competitors?.[0]?.company || top2[0].company_name} dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
              {radarData.competitors?.length > 1 && (
                <Radar name={radarData.competitors[1].company || top2[1].company_name} dataKey="C" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
              )}
              
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">The AI Gap</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Competitors exhibit significantly higher <span className="font-medium text-gray-900">Commercial Intent Coverage</span> and <span className="font-medium text-gray-900">Topical Authority</span>, causing LLMs to confidently bypass your business during retrieval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
