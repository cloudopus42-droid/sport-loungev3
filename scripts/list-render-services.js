const RENDER_API_KEY = 'rnd_eUEcmLjAq9rMWQ7pBQvdaTjQcqPX';

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
  
  const res = await fetch(url, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Render API responded with ${res.status}: ${errText}`);
  }
  return await res.json();
}

async function main() {
  const services = await renderRequest('GET', '/services?limit=50');
  console.log('Services list:');
  services.forEach(s => {
    console.log(`- Name: ${s.service.name}, ID: ${s.service.id}, URL: ${s.service.url}, Status: ${s.service.status}`);
  });
}

main().catch(console.error);
