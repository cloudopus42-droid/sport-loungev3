const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHUB_TOKEN = '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';
const GITHUB_REPO = 'cloudopus42-droid/sport-loungev3';

async function githubRequest(method, endpoint, body = null) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}${endpoint}`;
  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Node-Deploy-Helper'
  };
  if (body) headers['Content-Type'] = 'application/json';

  const fetch = (await import('node-fetch')).default || global.fetch;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn(`GitHub API Error: ${res.status} - ${errText}`);
    return null;
  }
  return await res.json();
}

async function main() {
  console.log('1. Modifying vite.config.ts for GitHub Pages...');
  const viteConfigPath = path.join(__dirname, 'client', 'vite.config.ts');
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  if (!viteConfig.includes("base: '/sport-loungev3/'")) {
    viteConfig = viteConfig.replace('plugins: [react()],', "base: '/sport-loungev3/',\n  plugins: [react()],");
    fs.writeFileSync(viteConfigPath, viteConfig);
  }

  console.log('2. Building Vite to root /docs...');
  const rootDocsDir = path.join(__dirname, 'docs');
  
  try {
    execSync('npm.cmd install', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
    execSync(`npm.cmd run build -- --outDir "${rootDocsDir}" --emptyOutDir`, { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
  } catch (err) {
    console.error('Build failed!', err);
    process.exit(1);
  }

  console.log('3. Copying index.html to 404.html for React Router support...');
  if (fs.existsSync(path.join(rootDocsDir, 'index.html'))) {
    fs.copyFileSync(path.join(rootDocsDir, 'index.html'), path.join(rootDocsDir, '404.html'));
  }

  console.log('4. Pushing /docs to GitHub...');
  try {
    execSync('git add docs client/vite.config.ts', { cwd: __dirname, stdio: 'inherit' });
    execSync('git commit -m "chore: build frontend for GitHub Pages"', { cwd: __dirname, stdio: 'inherit' });
    execSync('git push', { cwd: __dirname, stdio: 'inherit' });
  } catch (err) {
    console.log('Git push failed (maybe no changes). Ignoring...', err.message);
  }

  console.log('5. Enabling GitHub Pages on /docs...');
  try {
    await githubRequest('POST', '/pages', {
      source: {
        branch: 'main',
        path: '/docs'
      }
    });
    console.log('Successfully requested GitHub Pages enablement!');
  } catch(e) {
    console.log('Already enabled or another error:', e.message);
  }

  // Also enforce the update
  try {
    await githubRequest('PUT', '/pages', {
      source: {
        branch: 'main',
        path: '/docs'
      }
    });
  } catch(e) {}

  console.log('URL WILL BE: https://cloudopus42-droid.github.io/sport-loungev3/');
}

main();
