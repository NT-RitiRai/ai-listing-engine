const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'components', 'report', 'v4');
const files = fs.readdirSync(dir).filter(f => f.startsWith('Page') && f.endsWith('.tsx'));

files.forEach(file => {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');
  let originalContent = content;
  
  // Replace: const oMention = (pr.live.openai?.brand_mentions || 0) + (pr.live.openai?.product_mentions || 0) > 0;
  // With:    const oMention = (pr.live.openai?.brand_mentions || 0) > 0;
  
  // Need to handle both pr.live.openai and live.openai (some pages mapped it to 'live')
  content = content.replace(/\(([^)]+\.brand_mentions\s*\|\|\s*0)\)\s*\+\s*\([^)]+\.product_mentions\s*\|\|\s*0\)/g, "($1)");
  
  if (content !== originalContent) {
    fs.writeFileSync(path.join(dir, file), content);
    console.log('Fixed product_mentions logic in ' + file);
  }
});
