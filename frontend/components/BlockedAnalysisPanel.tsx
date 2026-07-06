"use client";

interface BlockedAnalysisPanelProps {
  url: string;
  error: string;
}

export default function BlockedAnalysisPanel({ url, error }: BlockedAnalysisPanelProps) {
  // Parse the error message to extract block type and reason
  const blockMatch = error.match(/BLOCKED: (.+?) - (.+)/);
  const blockType = blockMatch?.[1] || "Unknown";
  const blockReason = blockMatch?.[2] || error;

  // Determine icon and color based on block type
  const getBlockInfo = (type: string) => {
    switch (type.toLowerCase()) {
      case "cloudflare waf":
        return {
          icon: "🛡️",
          color: "text-orange-400",
          bgColor: "bg-orange-900",
          borderColor: "border-orange-800",
        };
      case "akamai waf":
      case "imperva waf":
      case "datadome waf":
        return {
          icon: "🔒",
          color: "text-red-400",
          bgColor: "bg-red-900",
          borderColor: "border-red-800",
        };
      case "captcha challenge":
        return {
          icon: "🤖",
          color: "text-yellow-400",
          bgColor: "bg-yellow-900",
          borderColor: "border-yellow-800",
        };
      case "login wall":
        return {
          icon: "🔐",
          color: "text-blue-400",
          bgColor: "bg-blue-900",
          borderColor: "border-blue-800",
        };
      case "maintenance page":
        return {
          icon: "🔧",
          color: "text-purple-400",
          bgColor: "bg-purple-900",
          borderColor: "border-purple-800",
        };
      case "geo-block":
        return {
          icon: "🌍",
          color: "text-green-400",
          bgColor: "bg-green-900",
          borderColor: "border-green-800",
        };
      case "javascript verification":
        return {
          icon: "⚙️",
          color: "text-cyan-400",
          bgColor: "bg-cyan-900",
          borderColor: "border-cyan-800",
        };
      default:
        return {
          icon: "⚠️",
          color: "text-gray-400",
          bgColor: "bg-gray-900",
          borderColor: "border-gray-800",
        };
    }
  };

  const blockInfo = getBlockInfo(blockType);

  const getNextSteps = (type: string): string[] => {
    switch (type.toLowerCase()) {
      case "cloudflare waf":
        return [
          "Contact the website owner to whitelist the AI Listing Engine crawler",
          "Ask them to add 'AIListingBot' to Cloudflare's allowed bots",
          "Try analyzing the website again after whitelisting",
          "Alternatively, provide website credentials for authenticated crawling",
        ];
      case "akamai waf":
      case "imperva waf":
      case "datadome waf":
        return [
          "Contact the website owner to allow automated crawling",
          "Request that they whitelist the AI Listing Engine bot",
          "Provide them with the bot's user agent: AIListingBot/1.0",
          "Try analyzing again after they've configured the WAF",
        ];
      case "captcha challenge":
        return [
          "The website requires human verification for access",
          "Contact the website owner to disable CAPTCHA for the crawler",
          "Ask them to whitelist the AI Listing Engine bot",
          "Provide website credentials for authenticated access",
        ];
      case "login wall":
        return [
          "The website content is behind a login wall",
          "Provide valid credentials for the website",
          "Ask the website owner to make content publicly accessible",
          "Request a demo account for analysis purposes",
        ];
      case "maintenance page":
        return [
          "The website appears to be down for maintenance",
          "Wait for the website to come back online",
          "Try analyzing again in a few hours",
          "Contact the website owner to confirm maintenance status",
        ];
      case "geo-block":
        return [
          "The website is restricted to specific geographic regions",
          "Contact the website owner to allow access from your region",
          "Request temporary access for analysis purposes",
          "Ask them to whitelist the AI Listing Engine crawler",
        ];
      case "javascript verification":
        return [
          "The website requires JavaScript execution for access",
          "Our crawler cannot execute JavaScript",
          "Contact the website owner to disable JS verification for the bot",
          "Ask them to provide a static HTML version for crawling",
        ];
      default:
        return [
          "Check that the website URL is correct",
          "Verify the website is publicly accessible",
          "Contact the website owner for support",
          "Try analyzing again in a few moments",
        ];
    }
  };

  const nextSteps = getNextSteps(blockType);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`text-6xl mb-4 ${blockInfo.color}`}>{blockInfo.icon}</div>
          <h1 className="text-3xl font-bold text-white mb-2">Website Analysis Blocked</h1>
          <p className="text-gray-400">We couldn't analyze this website due to access restrictions</p>
        </div>

        {/* Block Details */}
        <div className={`${blockInfo.bgColor} border ${blockInfo.borderColor} rounded-xl p-6 mb-8`}>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">Website URL</p>
              <p className="text-white font-mono text-sm break-all">{url}</p>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">Block Type</p>
              <p className={`text-lg font-semibold ${blockInfo.color}`}>{blockType}</p>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">Reason</p>
              <p className="text-gray-200">{blockReason}</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-white font-semibold text-lg mb-4">What You Can Do</h2>
          <ol className="space-y-3">
            {nextSteps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-blue-400 font-bold flex-shrink-0">{i + 1}.</span>
                <span className="text-gray-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-3">About This Block</h3>
          <p className="text-gray-400 text-sm mb-4">
            The AI Listing Engine respects website security measures and will not attempt to bypass protection systems.
            This block indicates that the website has security measures in place that prevent automated crawling.
          </p>
          <p className="text-gray-500 text-xs">
            If you believe this is an error or need assistance, please contact the website owner or the AI Listing Engine support team.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <a
            href="/"
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
          >
            Analyze Another Website
          </a>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
