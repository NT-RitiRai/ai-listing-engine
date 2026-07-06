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
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <h4 className="text-white font-semibold text-sm">{title}</h4>

      {/* Signals */}
      {data.signals && Object.entries(data.signals).length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs uppercase">Signals</p>
          {Object.entries(data.signals).map(([key, signal]: [string, any]) => (
            <div key={key} className="bg-gray-900 rounded p-2 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{key.replace(/_/g, " ")}</span>
                <span className="text-green-400 font-mono font-bold">+{signal.points || 0}</span>
              </div>
              {signal.percentage !== undefined && (
                <p className="text-gray-500">{signal.percentage}% coverage</p>
              )}
              {signal.pages !== undefined && (
                <p className="text-gray-500">{signal.pages} of {signal.total || "?"} pages</p>
              )}
              {signal.avg_word_count !== undefined && (
                <p className="text-gray-500">Avg: {signal.avg_word_count} words</p>
              )}
              {signal.schema_types && (
                <p className="text-gray-500">Types: {signal.schema_types.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Issues */}
      {data.issues && data.issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs uppercase">Issues</p>
          {data.issues.map((issue: any, i: number) => (
            <div key={i} className="bg-gray-900 rounded p-2 text-xs flex items-center justify-between">
              <div>
                <p className="text-gray-300">{issue.type.replace(/_/g, " ")}</p>
                <p className="text-gray-500 text-xs">{issue.severity}</p>
              </div>
              <span className="text-red-400 font-mono font-bold">-{issue.deduction}</span>
            </div>
          ))}
        </div>
      )}

      {/* Missing Signals */}
      {data.missing && data.missing.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs uppercase">Missing Signals</p>
          {data.missing.map((item: string, i: number) => (
            <div key={i} className="bg-gray-900 rounded p-2 text-xs text-yellow-400 flex gap-2">
              <span>!</span>{item}
            </div>
          ))}
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
