const token = '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';

async function run() {
  const res = await fetch('https://api.github.com/user/repos?per_page=100', {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node'
    }
  });

  const repos = await res.json();
  repos.forEach(r => {
    console.log(`Repo: ${r.full_name}, Pages: ${r.has_pages}, Private: ${r.private}`);
  });
}

run();
