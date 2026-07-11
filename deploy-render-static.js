const RENDER_API_KEY = process.env.RENDER_API_KEY;
const REPO = 'https://github.com/cloudopus42-droid/sport-loungev3';

async function main() {
  if (!RENDER_API_KEY) {
    throw new Error('RENDER_API_KEY is required');
  }

  const fetch = global.fetch;
  
  const headers = {
    'Authorization': `Bearer ${RENDER_API_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  try {
    console.log('1. Getting owner ID...');
    const servicesRes = await fetch('https://api.render.com/v1/services?limit=1', { headers });
    const services = await servicesRes.json();
    const ownerId = services[0].service.ownerId;
    console.log('Owner ID:', ownerId);

    console.log('2. Creating Static Site...');
    const createRes = await fetch('https://api.render.com/v1/services', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'static_site',
        name: 'sport-lounge-ui-' + Math.floor(Math.random() * 1000),
        ownerId: ownerId,
        repo: REPO,
        autoDeploy: 'yes',
        branch: 'main',
        serviceDetails: {
          buildCommand: 'cd client && npm install && npm run build',
          publishPath: 'client/dist'
        }
      })
    });
    
    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('Failed to create service:', err);
      return;
    }
    
    const newService = await createRes.json();
    console.log('✅ Service Created!');
    console.log('URL: ' + newService.service.url);
    console.log('Dashboard: ' + newService.service.dashboardUrl);
  } catch (err) {
    console.error(err);
  }
}

main();
