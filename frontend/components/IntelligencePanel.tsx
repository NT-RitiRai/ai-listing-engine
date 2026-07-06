function Tag({ label }: { label: string }) {
  return (
    <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full">{label}</span>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => <Tag key={i} label={item} />)}
      </div>
    </div>
  );
}

export default function IntelligencePanel({ intelligence }: { intelligence: any }) {
  if (!intelligence) return <div className="text-gray-500">Loading intelligence...</div>;

  return (
    <div className="space-y-6">
      {/* Business Profile */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-white font-semibold text-lg">{intelligence.industry}</h2>
            {intelligence.sub_industry && (
              <p className="text-gray-400 text-sm">{intelligence.sub_industry}</p>
            )}
          </div>
          {intelligence.target_audience && (
            <div className="text-right">
              <p className="text-gray-500 text-xs">Target Audience</p>
              <p className="text-gray-300 text-sm">{intelligence.target_audience}</p>
            </div>
          )}
        </div>
        {intelligence.business_summary && (
          <p className="text-gray-300 text-sm leading-relaxed border-t border-gray-800 pt-4">
            {intelligence.business_summary}
          </p>
        )}
      </div>

      {/* Data grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <Section title="Services" items={intelligence.services} />
          <Section title="Products" items={intelligence.products} />
          <Section title="Brands" items={intelligence.brands} />
          <Section title="Locations" items={intelligence.locations} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <Section title="Primary Topics" items={intelligence.primary_topics} />
          <Section title="Secondary Topics" items={intelligence.secondary_topics} />
          <Section title="Content Clusters" items={intelligence.content_clusters} />
          <Section title="Entities" items={intelligence.entities} />
        </div>
      </div>

      {/* USPs */}
      {intelligence.unique_selling_points?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Unique Selling Points</p>
          <ul className="space-y-2">
            {intelligence.unique_selling_points.map((usp: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-green-400 mt-0.5">✓</span>
                {usp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
