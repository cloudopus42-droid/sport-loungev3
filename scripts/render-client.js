const RENDER_API_KEY = 'rnd_eUEcmLjAq9rMWQ7pBQvdaTjQcqPX';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function renderRequest(method, endpoint, bodyObj = null) {
  const url = `https://api.render.com/v1${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${RENDER_API_KEY}`,
    'Accept': 'application/json'
  };
  const options = { method, headers };
  if (bodyObj) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(bodyObj);
  }

  let lastErr = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Render API responded with ${res.status}: ${errText}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`⚠️ Render API attempt ${attempt} failed: ${err.message}`);
      lastErr = err;
      if (attempt < 4) {
        await sleep(1500 * attempt);
      }
    }
  }
  throw new Error(`Render API call failed after 4 attempts. Last error: ${lastErr.message}`);
}

module.exports = { renderRequest };
