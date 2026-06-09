const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = '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';
const GITHUB_REPO = 'cloudopus42-droid/sport-loungev3';
const PROJECT_DIR = 'C:\\Users\\denis\\.gemini\\antigravity\\scratch\\sport-lounge';

async function githubRequest(method, endpoint, body = null) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}${endpoint}`;
  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Node-Deploy-Helper'
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) {
    if (res.status === 404 && method === 'GET') {
      return null;
    }
    const errText = await res.text();
    throw new Error(`GitHub API Error: ${res.status} ${res.statusText} - ${errText}`);
  }

  return await res.json();
}

async function pushFile(filePath, repoPath) {
  const localPath = path.join(PROJECT_DIR, filePath);
  if (!fs.existsSync(localPath)) {
    throw new Error(`Local file not found: ${localPath}`);
  }

  console.log(`Reading local file: ${filePath}...`);
  const content = fs.readFileSync(localPath);
  const base64Content = content.toString('base64');

  console.log(`Checking remote file: ${repoPath} on GitHub...`);
  const remoteFile = await githubRequest('GET', `/contents/${repoPath}`);
  const sha = remoteFile ? remoteFile.sha : null;

  console.log(`Pushing file to GitHub (SHA: ${sha || 'NEW'})...`);
  const putBody = {
    message: `🤖 Automated n8n integration - updating ${repoPath}`,
    content: base64Content,
    branch: 'main'
  };

  if (sha) {
    putBody.sha = sha;
  }

  const result = await githubRequest('PUT', `/contents/${repoPath}`, putBody);
  console.log(`✅ Successfully pushed ${repoPath} (Commit: ${result.commit.sha.substring(0, 7)})`);
}

async function main() {
  try {
    console.log('🚀 Pushing n8n files to GitHub...');
    await pushFile('server/n8n/Dockerfile', 'server/n8n/Dockerfile');
    await pushFile('server/n8n/entrypoint.sh', 'server/n8n/entrypoint.sh');
    await pushFile('server/n8n/workflows/google_sheets_sync.json', 'server/n8n/workflows/google_sheets_sync.json');
    await pushFile('server/n8n/workflows/ai_sommelier.json', 'server/n8n/workflows/ai_sommelier.json');
    console.log('🎉 All files pushed successfully!');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

main();
