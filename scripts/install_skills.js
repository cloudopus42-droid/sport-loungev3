const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoPath = 'C:\\Users\\denis\\.gemini\\antigravity\\scratch\\claude-skills-extracted\\claude-skills-main';
const geminiSkillsDir = path.join(repoPath, '.gemini', 'skills');
const targetSkillsDir = 'C:\\Users\\denis\\.gemini\\antigravity\\skills';
const manifestPath = path.join(targetSkillsDir, '.datacloud_skills_manifest');

function getSha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function run() {
  console.log('Reading manifest...');
  let manifest = { bundleChecksum: '', skills: {} };
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      console.error('Error reading existing manifest:', e);
    }
  }

  if (!fs.existsSync(geminiSkillsDir)) {
    console.error('Gemini skills source directory not found:', geminiSkillsDir);
    process.exit(1);
  }

  const skillDirs = fs.readdirSync(geminiSkillsDir).filter(f => {
    return fs.statSync(path.join(geminiSkillsDir, f)).isDirectory() && f !== 'TEMPLATE' && f !== 'README';
  });

  console.log(`Found ${skillDirs.length} skills to process...`);

  let count = 0;
  for (const skillName of skillDirs) {
    const sourceSkillDir = path.join(geminiSkillsDir, skillName);
    const sourceSkillMd = path.join(sourceSkillDir, 'SKILL.md');

    if (!fs.existsSync(sourceSkillMd)) {
      continue;
    }

    let skillContent = '';
    const linkContent = fs.readFileSync(sourceSkillMd, 'utf8').trim();

    // Check if it's a relative path link or actual markdown
    if (linkContent.startsWith('..')) {
      const resolvedPath = path.resolve(sourceSkillDir, linkContent);
      if (fs.existsSync(resolvedPath)) {
        skillContent = fs.readFileSync(resolvedPath, 'utf8');
      } else {
        console.warn(`Target path for ${skillName} not found: ${resolvedPath}`);
        continue;
      }
    } else {
      skillContent = linkContent;
    }

    const sha256 = getSha256(skillContent);
    const destSkillDir = path.join(targetSkillsDir, skillName);

    if (!fs.existsSync(destSkillDir)) {
      fs.mkdirSync(destSkillDir, { recursive: true });
    }

    fs.writeFileSync(path.join(destSkillDir, 'SKILL.md'), skillContent, 'utf8');

    // Register in manifest
    manifest.skills[skillName] = {
      status: 'installed',
      checksum: sha256
    };

    count++;
    if (count % 50 === 0) {
      console.log(`Processed ${count} skills...`);
    }
  }

  // Update bundle checksum
  const allChecksums = Object.keys(manifest.skills)
    .sort()
    .map(k => manifest.skills[k].checksum)
    .join('');
  manifest.bundleChecksum = getSha256(allChecksums);

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Success! Installed ${count} skills and updated manifest at ${manifestPath}`);
}

run().catch(err => {
  console.error('Failed to install skills:', err);
  process.exit(1);
});
