"use client";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">{children}</p>;
}

function TagList({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full">{item}</span>
        ))}
      </div>
    </div>
  );
}

interface WebsiteOverviewPanelProps {
  intelligence: any;
  issues: any[];
  strengthsWeaknesses?: any;
}

export default function WebsiteOverviewPanel({ intelligence, issues, strengthsWeaknesses }: WebsiteOverviewPanelProps) {
  if (!intelligence) return <div className="text-gray-500">Loading website overview...</div>;

  const strengths = strengthsWeaknesses?.strengths || [];
  const weaknesses = strengthsWeaknesses?.weaknesses || [];

  return (
    <div className="space-y-8">
      {/* Website Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-semibold text-lg mb-2">{intelligence.industry}</h2>
        <p className="text-gray-400 text-sm">{intelligence.business_summary}</p>
        {intelligence.target_audience && (
          <p className="text-gray-500 text-xs mt-3">Target Audience: {intelligence.target_audience}</p>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{intelligence.services?.length || 0}</p>
          <p className="text-gray-400 text-xs mt-1">Services</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{intelligence.entities?.length || 0}</p>
          <p className="text-gray-400 text-xs mt-1">Entities</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{intelligence.locations?.length || 0}</p>
          <p className="text-gray-400 text-xs mt-1">Locations</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{intelligence.products?.length || 0}</p>
          <p className="text-gray-400 text-xs mt-1">Products</p>
        </div>
      </div>

      {/* Content Coverage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagList title="Primary Topics" items={intelligence.primary_topics?.slice(0, 8)} />
        <TagList title="Secondary Topics" items={intelligence.secondary_topics?.slice(0, 8)} />
        <TagList title="Services" items={intelligence.services?.slice(0, 8)} />
        <TagList title="Products" items={intelligence.products?.slice(0, 8)} />
      </div>

      {/* Unique Selling Points */}
      {intelligence.unique_selling_points?.length > 0 && (
        <div>
          <SectionTitle>Unique Selling Points</SectionTitle>
          <ul className="space-y-2">
            {intelligence.unique_selling_points.map((usp: string, i: number) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <span className="text-blue-400">◆</span>{usp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strengths.length > 0 && (
          <div>
            <SectionTitle>Strengths</SectionTitle>
            <ul className="space-y-2">
              {strengths.map((s: any, i: number) => (
                <li key={i} className="text-sm text-gray-300 space-y-1">
                  <div className="flex gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="font-medium">{s.title}</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-5">{s.description}</p>
                  {s.evidence && <p className="text-xs text-gray-500 ml-5">Evidence: {s.evidence}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {weaknesses.length > 0 && (
          <div>
            <SectionTitle>Weaknesses</SectionTitle>
            <ul className="space-y-2">
              {weaknesses.map((w: any, i: number) => (
                <li key={i} className="text-sm text-gray-300 space-y-1">
                  <div className="flex gap-2">
                    <span className="text-red-400">✗</span>
                    <span className="font-medium">{w.title}</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-5">{w.description}</p>
                  {w.evidence && <p className="text-xs text-gray-500 ml-5">Evidence: {w.evidence}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Content Clusters */}
      {intelligence.content_clusters?.length > 0 && (
        <div>
          <SectionTitle>Content Clusters</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {intelligence.content_clusters.map((cluster: string, i: number) => (
              <span key={i} className="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg">
                {cluster}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Locations */}
      {intelligence.locations?.length > 0 && (
        <TagList title="Locations" items={intelligence.locations} />
      )}

      {/* Brands */}
      {intelligence.brands?.length > 0 && (
        <TagList title="Brands Mentioned" items={intelligence.brands} />
      )}
    </div>
  );
}
