interface ScoreCardProps {
  label: string;
  score: number;
  color: string;
  breakdown?: any;
}

function ScoreCard({ label, score, color, breakdown }: ScoreCardProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center gap-3">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="text-center -mt-2">
        <p className="text-3xl font-bold text-white">{score}</p>
        <p className="text-gray-400 text-sm mt-1">{label}</p>
      </div>
    </div>
  );
}

function BreakdownSection({ title, data }: { title: string; data: any }) {
  if (!data) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-5 space-y-4 shadow-lg border border-gray-700">
      <h4 className="text-white font-bold text-lg border-b border-gray-700 pb-2">{title}</h4>

      {/* Signals (Strengths) */}
      {data.signals && Object.entries(data.signals).length > 0 && (
        <div className="space-y-2">
          <p className="text-emerald-400 text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> What's Working Well
          </p>
          <ul className="space-y-2 pl-4">
            {Object.entries(data.signals).map(([key, signal]: [string, any]) => {
              if (signal.points === 0 && !signal.percentage) return null; // skip zeroes
              return (
                <li key={key} className="text-gray-300 text-sm flex items-start justify-between">
                  <span className="capitalize">{key.replace(/_/g, " ")}</span>
                  {signal.percentage !== undefined && (
                    <span className="text-gray-500 text-xs ml-2">({signal.percentage}% coverage)</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Issues (Weaknesses) */}
      {data.issues && data.issues.length > 0 && (
        <div className="space-y-2 mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-rose-400 text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span> Areas to Improve
          </p>
          <ul className="space-y-2 pl-4">
            {data.issues.map((issue: any, i: number) => (
              <li key={i} className="text-gray-300 text-sm flex justify-between items-center">
                <span className="capitalize">{issue.type.replace(/_/g, " ")}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  issue.severity === 'high' ? 'bg-rose-900/30 text-rose-300' :
                  issue.severity === 'medium' ? 'bg-orange-900/30 text-orange-300' :
                  'bg-yellow-900/30 text-yellow-300'
                }`}>
                  {issue.severity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Signals */}
      {data.missing && data.missing.length > 0 && (
        <div className="space-y-2 mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-amber-400 text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Missing Elements
          </p>
          <ul className="space-y-1 pl-4">
            {data.missing.map((item: string, i: number) => (
              <li key={i} className="text-gray-400 text-sm list-disc">{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ScoresPanel({ scores }: { scores: any }) {
  if (!scores) return <div className="text-gray-500">Loading scores...</div>;

  const breakdown = scores.breakdown || {};

  return (
    <div className="space-y-8">
      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ScoreCard label="Overall" score={scores.overall_score} color="#3b82f6" breakdown={breakdown.overall} />
        <ScoreCard label="SEO" score={scores.seo_score} color="#10b981" breakdown={breakdown.seo} />
        <ScoreCard label="AEO" score={scores.aeo_score} color="#f59e0b" breakdown={breakdown.aeo} />
        <ScoreCard label="AI Readiness" score={scores.ai_readiness_score} color="#8b5cf6" breakdown={breakdown.ai} />
        <ScoreCard label="GEO" score={scores.geo_score} color="#ec4899" breakdown={breakdown.geo} />
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BreakdownSection title="SEO Breakdown" data={breakdown.seo} />
        <BreakdownSection title="AEO Breakdown" data={breakdown.aeo} />
        <BreakdownSection title="AI Readiness Breakdown" data={breakdown.ai} />
        <BreakdownSection title="GEO Breakdown" data={breakdown.geo} />
      </div>
    </div>
  );
}
