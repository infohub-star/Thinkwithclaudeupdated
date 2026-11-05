// Rebuild /ai-questions/ from qa/data.json.
// Run: node qa/build.js   (the daily cron does this automatically)
const fs = require('fs'), path = require('path');
const { renderArchive } = require('../api/_qa.js');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'qa/data.json'), 'utf8'));
fs.mkdirSync(path.join(root, 'ai-questions'), { recursive: true });
fs.writeFileSync(path.join(root, 'ai-questions/index.html'), renderArchive(data));
console.log(`Built Q&A section: ${data.length} question(s)`);
