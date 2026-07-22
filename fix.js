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
  'Appendix'
];

const dir = path.join(__dirname, 'frontend', 'components', 'report', 'v4');
const files = fs.readdirSync(dir).filter(f => f.startsWith('Page') && f.endsWith('.tsx'));

files.forEach(file => {
  const match = file.match(/Page(\d+)/);
  if (!match) return;
  const num = parseInt(match[1]);
  if (num < 1 || num > 20) return;
  
  const newTitle = SECTIONS[num - 1];
  let content = fs.readFileSync(path.join(dir, file), 'utf8');
  
  // My previous bad script resulted in just <h1>Title</h1> or <h1className="...">Title</h1> or something similar because $1 was dropped.
  // It probably left it as <h1>NewTitle</h1> because it replaced the whole block.
  // Let's replace the whole header block inside `<div className="text-center max-w-3xl mx-auto space-y-3">`
  
  const headerRegex = /(<div className="text-center max-w-3xl mx-auto space-y-3">\s*)(?:<h2[^>]*>.*?<\/h2>\s*)?<h1[^>]*>.*?<\/h1>/s;
  
  const replacement = `$1<h2 className="text-sm font-bold tracking-widest text-indigo-600 uppercase">Module ${num} — ${newTitle}</h2>\n        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">${newTitle}</h1>`;
  
  content = content.replace(headerRegex, replacement);
  
  fs.writeFileSync(path.join(dir, file), content);
  console.log('Fixed ' + file);
});
