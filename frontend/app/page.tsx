"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { startAnalysis } from "@/lib/api";
import { normalizeUrl, isValidUrl } from "@/lib/utils";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("lastAnalyzedUrl");
    if (saved) setUrl(saved);
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length === 1 && !val.startsWith("h") && !val.startsWith("w")) {
      setUrl("https://www." + val);
    } else {
      setUrl(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = normalizeUrl(url);
    if (!isValidUrl(finalUrl)) {
      setError("Please enter a valid website URL.");
      return;
    }
    
    setUrl(finalUrl); // update input visually
    localStorage.setItem("lastAnalyzedUrl", finalUrl);
    
    setLoading(true);
    setError("");
    setSuccessMsg("Analysis started...");
    
    try {
      const data = await startAnalysis(finalUrl);
      router.push(`/analysis/${data.id}`);
    } catch {
      setError("Failed to start analysis. Check the URL and try again.");
      setLoading(false);
      setSuccessMsg("");
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

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            onBlur={(e) => {
               if (e.target.value) setUrl(normalizeUrl(e.target.value));
            }}
            placeholder="Enter website (e.g. https://www.example.com)"
            required
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-base"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting
              </>
            ) : (
              "Analyze"
            )}
          </button>
        </form>

        {/* Toast Notifications */}
        {error && <p className="mt-4 text-red-400 text-sm text-center bg-red-900/20 py-2 rounded">{error}</p>}
        {successMsg && !error && <p className="mt-4 text-green-400 text-sm text-center bg-green-900/20 py-2 rounded">{successMsg}</p>}

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
