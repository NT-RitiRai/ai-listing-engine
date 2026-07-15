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
    <main className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50 selection:bg-blue-100">
      <div className="w-full max-w-3xl">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-6 border border-blue-100 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Enterprise AI Visibility Report
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight leading-tight">
            Discover if AI assistants <br className="hidden md:block"/> are recommending your business.
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Analyze your website to see how ChatGPT and Gemini perceive your brand, products, and services.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative group mx-auto max-w-2xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex flex-col sm:flex-row bg-white rounded-xl shadow-sm border border-gray-200 p-2 gap-2">
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
              onBlur={(e) => {
                 if (e.target.value) setUrl(normalizeUrl(e.target.value));
              }}
              placeholder="Enter your website URL (e.g. https://www.example.com)"
              required
              className="flex-1 bg-transparent px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none text-base"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-medium px-8 py-3 rounded-lg transition-all flex items-center justify-center shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing
                </>
              ) : (
                "Run Analysis"
              )}
            </button>
          </div>
        </form>

        {/* Toast Notifications */}
        {error && <p className="mt-4 text-red-600 font-medium text-sm text-center bg-red-50 py-2.5 rounded-lg border border-red-100 max-w-2xl mx-auto">{error}</p>}
        {successMsg && !error && <p className="mt-4 text-green-700 font-medium text-sm text-center bg-green-50 py-2.5 rounded-lg border border-green-100 max-w-2xl mx-auto">{successMsg}</p>}

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {["ChatGPT Visibility", "Gemini Grounding", "Brand Detection", "Actionable Insights"].map((label) => (
            <div key={label} className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 text-center">
              <p className="text-gray-700 text-sm font-semibold">{label}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-20 text-center text-gray-400 text-sm">
          <p>AI Listing Engine &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </main>
  );
}
