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
    const errText = await res.text();
    throw new Error(`GitHub Error: ${res.status} - ${errText}`);
  }

  return await res.json();
}

async function main() {
  try {
    const localPath = path.join(PROJECT_DIR, 'server/n8n/Dockerfile');
    const content = fs.readFileSync(localPath);
    const base64Content = content.toString('base64');

    console.log('🔍 Fetching current Dockerfile info from GitHub...');
    const remoteFile = await githubRequest('GET', '/contents/server/n8n/Dockerfile');
    const sha = remoteFile ? remoteFile.sha : null;

    console.log(`🚀 Pushing updated Dockerfile with latest tag (SHA: ${sha})...`);
    const putBody = {
      message: '🤖 Automated n8n integration - upgrading base image to latest',
      content: base64Content,
      branch: 'main'
    };

    if (sha) {
      putBody.sha = sha;
    }

    const result = await githubRequest('PUT', '/contents/server/n8n/Dockerfile', putBody);
    console.log(`✅ Successfully pushed Dockerfile! (Commit: ${result.commit.sha.substring(0, 7)})`);
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

main();
