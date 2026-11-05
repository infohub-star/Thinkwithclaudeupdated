// Rebuild /ai-questions/, one page per question, sitemap.xml and llms.txt from qa/data.json.
// Run: node qa/build.js   (the daily cron does this automatically)
const fs = require('fs'), path = require('path');
const { renderAll } = require('../api/_qa.js');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'qa/data.json'), 'utf8'));
const files = renderAll(data, fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
for (const [rel, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), content);
}
console.log(`Built ${Object.keys(files).length} file(s) for ${data.length} question(s)`);
