"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { startAnalysis } from "@/lib/api";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await startAnalysis(url.trim());
      router.push(`/analysis/${data.id}`);
    } catch {
      setError("Failed to start analysis. Check the URL and try again.");
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">AI Listing Engine</h1>
          <p className="text-gray-400 text-lg">
            Enterprise SEO · AEO · GEO · AI Visibility Analysis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
            required
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-base"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {loading ? "Starting..." : "Analyze"}
          </button>
        </form>

        {error && <p className="mt-4 text-red-400 text-sm text-center">{error}</p>}

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {["SEO Audit", "AEO Analysis", "AI Readiness", "Prompt Playground"].map((label) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-300 text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
