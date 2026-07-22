const fs = require('fs');
const path = require('path');

const SECTIONS = [
  'Business Overview',
  'Executive Summary',
  'AI Visibility Score',
  'AI Search Queries',
  'Brand Mentions',
  'AI Recommendations',
  'User Search Intent',
  'AI Brand Comprehension',
  'Brand Identity & Footprint',
  'Digital Knowledge Network',
  'Competitor Analysis',
  'Competitor Comparison',
  'AI Search Performance',
  'Buyer Journey',
  'Growth Opportunities',
  'Revenue Impact',
  'Critical Issues',
  'Strategic Recommendations',
  'Action Plan & Roadmap',
  'Appendix / Data'
];

const dir = path.join(__dirname, 'frontend', 'components', 'report', 'v4');
const files = fs.readdirSync(dir).filter(f => f.startsWith('Page') && f.endsWith('.tsx'));

files.forEach(file => {
  const match = file.match(/Page(\d+)/);
  if (!match) return;
  const num = parseInt(match[1]);
  if (num < 1 || num > 20) return;
  
  const newTitle = SECTIONS[num - 1].replace(' / Data', '');
  let content = fs.readFileSync(path.join(dir, file), 'utf8');
  
  // Replace the header block
  const headerRegex = /(<div className="text-center max-w-3xl mx-auto space-y-3">\s*)<h2[^>]*>.*?<\/h2>\s*<h1[^>]*>.*?<\/h1>/s;
  
  const replacement = `$1<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Module ${num}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">${newTitle}</h1>`;
  
  content = content.replace(headerRegex, replacement);
  
  fs.writeFileSync(path.join(dir, file), content);
  console.log('Fixed ' + file);
});
