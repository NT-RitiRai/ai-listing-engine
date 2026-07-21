"use client";
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Label } from 'recharts';
import { GitCompare } from 'lucide-react';

export default function CompetitorMatrix({ competitorsData }: { competitorsData: any }) {
  if (!competitorsData || !competitorsData.competitors) return null;

  const getMentions = (name: string) => {
    const found = competitorsData.leaderboard?.find((l: any) => l.name.toLowerCase() === name.toLowerCase());
    return found ? found.mentions : 0;
  };

  // Add deterministic jitter so competitors with the same score don't perfectly overlap
  const getJitter = (index: number) => (index * 13 % 10) - 5;

  // We plot final_score (Confidence) on Y axis, and Mentions (Visibility) on X axis
  const data = competitorsData.competitors.map((c: any, i: number) => {
    const mentions = getMentions(c.company_name);
    return {
      name: c.company_name,
      visibility: mentions + ((i % 3) * 0.15), // slight horizontal spread
      confidence: Math.max(0, Math.min(100, (c.final_score || 50) + getJitter(i))), // vertical spread
      z: 100 + (mentions * 20), // Scale bubble by mentions
      originalVisibility: mentions,
      originalConfidence: c.final_score || 0
    };
  });

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 font-sans">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <GitCompare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-medium text-gray-900">Competitive Landscape Matrix</h2>
          <p className="text-sm text-gray-500">Maps competitors by AI Recommendation Visibility vs. Confidence.</p>
        </div>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" dataKey="visibility" name="Visibility (Mentions)" tick={{fontSize: 12}}>
              <Label value="AI Search Visibility (Mentions)" offset={-15} position="insideBottom" style={{fontSize: 12, fill: '#6b7280'}} />
            </XAxis>
            <YAxis type="number" dataKey="confidence" name="AI Confidence Score" domain={[0, 100]} tick={{fontSize: 12}}>
              <Label value="AI Confidence Score" angle={-90} position="insideLeft" style={{fontSize: 12, fill: '#6b7280'}} />
            </YAxis>
            <ZAxis type="number" dataKey="z" range={[200, 400]} />
            <Tooltip 
              cursor={{strokeDasharray: '3 3'}}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-200 shadow-md p-3 rounded-lg text-sm">
                      <p className="font-bold text-gray-800">{data.name}</p>
                      <p className="text-gray-600">Visibility: {data.originalVisibility} mentions</p>
                      <p className="text-gray-600">Confidence: {data.originalConfidence}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Quadrant Lines */}
            <ReferenceLine x={Math.max(...data.map((d: any) => d.visibility)) / 2} stroke="#e5e7eb" strokeDasharray="3 3" />
            <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="3 3" />
            
            <Scatter name="Competitors" data={data} fill="#8b5cf6" fillOpacity={0.6} stroke="#7c3aed" strokeWidth={2} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-500 text-center">
        <div>High Visibility, High Confidence (Market Leaders)</div>
        <div>Low Visibility, High Confidence (Niche Specialists)</div>
      </div>
    </div>
  );
}
