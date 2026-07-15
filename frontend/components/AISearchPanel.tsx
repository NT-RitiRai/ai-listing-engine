"use client";

import { useState, useEffect } from "react";
import { getProviders, getVisibilityMetrics } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function AISearchPanel() {
  const [providers, setProviders] = useState<any[]>([]);
  const [visibility, setVisibility] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const provs = await getProviders();
        const vis = await getVisibilityMetrics();
        setProviders(provs);
        setVisibility(vis);
      } catch (e) {
        console.error("Failed to load AI Search data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p>Connecting to LLM Live Search Engines...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border border-indigo-500/30 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Enterprise AI Search Visibility</h2>
        <p className="text-indigo-200 text-sm">
          Tracking your brand's presence across OpenAI (gpt-5-search-api), Perplexity, and other live LLM engines.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Overall AI Visibility</h3>
            <div className="text-4xl font-black text-indigo-400">
              {visibility.length > 0 ? `${visibility[0].ai_visibility_percent}%` : '0%'}
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">Based on Live API Data</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Total Citations</h3>
            <div className="text-4xl font-black text-blue-400">
              {visibility.length > 0 ? visibility[0].citations : '0'}
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">Across all prompts</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Tracked Mentions</h3>
            <div className="text-4xl font-black text-purple-400">
              {visibility.length > 0 ? visibility[0].total_mentions : '0'}
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">Domain matches</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Active Providers</h3>
            <div className="text-4xl font-black text-rose-400">{providers.length}</div>
            <p className="text-xs text-emerald-400 mt-2 font-medium">
              {providers.map(p => p.name).join(', ') || "None"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Provider Support</h3>
          {providers.length === 0 ? (
            <p className="text-gray-500 text-sm">No providers found in DB. Please run database migrations.</p>
          ) : (
            <div className="h-48 flex items-end justify-around space-x-2">
              {providers.map((p, i) => (
                <div key={p.name} className="flex flex-col items-center w-full">
                  <div 
                    className={`w-full max-w-[40px] rounded-t-md transition-colors ${p.status === 'active' ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-gray-600'}`} 
                    style={{ height: p.status === 'active' ? '100%' : '20%' }}
                    title={`Status: ${p.status}`}
                  ></div>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-300 mt-3 capitalize">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Prompt Analysis Logs</h3>
          {visibility.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-10 border border-dashed border-gray-700 rounded-lg">
              No prompt runs detected for this domain yet. <br/>
              Use the backend API (/prompt/run) to execute a live query!
            </div>
          ) : (
            <ul className="space-y-3">
              <li className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700/50">
                <span className="text-sm font-medium text-gray-200">Domain tracked</span>
                <span className="text-[10px] font-bold px-2 py-1 bg-emerald-900/40 text-emerald-400 rounded-full border border-emerald-800/50">
                  {visibility[0].domain}
                </span>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
