const PRIORITY_COLORS: Record<number, string> = {
  1: "text-red-400",
  2: "text-orange-400",
  3: "text-yellow-400",
  4: "text-gray-400",
};

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: "bg-green-900 text-green-300",
  medium: "bg-yellow-900 text-yellow-300",
  hard: "bg-red-900 text-red-300",
};

export default function RecommendationsPanel({ recommendations }: { recommendations: any[] }) {
  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">
        {recommendations.length} recommendations — sorted by priority and impact
      </p>
      {recommendations.map((rec, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold ${PRIORITY_COLORS[rec.priority]}`}>
                P{rec.priority}
              </span>
              <div>
                <p className="text-white font-medium">
                  {rec.issue_type.replace(/_/g, " ")}
                </p>
                <p className="text-gray-500 text-xs uppercase">{rec.category}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded font-medium ${DIFFICULTY_BADGE[rec.fix_difficulty]}`}>
              {rec.fix_difficulty}
            </span>
          </div>

          <p className="text-gray-300 text-sm">{rec.recommendation}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">IMPACT</p>
              <p className="text-gray-300">{rec.impact}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">EXPECTED GAIN</p>
              <p className="text-green-400">{rec.expected_gain}</p>
            </div>
          </div>

          {rec.affected_pages_count > 0 && (
            <p className="text-gray-500 text-xs">{rec.affected_pages_count} pages affected</p>
          )}
        </div>
      ))}

      {recommendations.length === 0 && (
        <div className="text-center py-12 text-gray-500">No recommendations generated.</div>
      )}
    </div>
  );
}
