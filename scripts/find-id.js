const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'docs') {
        results = results.concat(walk(fullPath));
      }
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('C:\\Users\\denis\\.gemini\\antigravity\\scratch\\sport-lounge');
files.forEach(f => {
  try {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('onrender.com')) {
      console.log(`Found in: ${f}`);
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('onrender.com')) {
          console.log(`  Line ${index + 1}: ${line.trim()}`);
        }
      });
    }
  } catch (e) {}
});
