import os

path = r"c:\Users\ASUS\Downloads\ai-listing-engine\frontend\app\analysis\[id]\page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add import
if 'AISummaryReportView' not in content:
    content = content.replace(
        'import Page20Appendix from "@/components/report/v4/Page20Appendix";',
        'import Page20Appendix from "@/components/report/v4/Page20Appendix";\nimport AISummaryReportView from "@/components/report/v4/AISummaryReportView";'
    )

# 2. Add state
if 'const [showSummary, setShowSummary] = useState(false);' not in content:
    content = content.replace(
        'const [isExporting, setIsExporting] = useState(false);',
        'const [isExporting, setIsExporting] = useState(false);\n  const [showSummary, setShowSummary] = useState(false);'
    )

# 3. Add button next to Export PDF
if 'Generate AI Summary' not in content:
    content = content.replace(
        'Export Executive PDF\n              </button>',
        'Export Executive PDF\n              </button>\n              <button onClick={() => setShowSummary(!showSummary)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm text-sm"><Lightbulb className="w-4 h-4" /> {showSummary ? "Back to Full Report" : "Generate AI Summary"}</button>'
    )

# 4. Render AISummaryReportView
if '<AISummaryReportView' not in content:
    content = content.replace(
        '{/* Sidebar Navigation */}',
        '{showSummary ? (<div className="w-full max-w-[1400px] mx-auto py-8 px-6"><AISummaryReportView analysisId={id} /></div>) : (<>\n          {/* Sidebar Navigation */}'
    )
    content = content.replace(
        '</main>\n        </div>',
        '</main>\n        </div>\n        </>)}'
    )

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated page.tsx")
