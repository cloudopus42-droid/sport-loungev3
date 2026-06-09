const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\denis\\.gemini\\antigravity\\scratch\\sport-lounge\\client\\src\\pages\\BookingPage.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('nexus') || line.toLowerCase().includes('cross-border')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
