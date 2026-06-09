const RENDER_API_KEY = 'rnd_eUEcmLjAq9rMWQ7pBQvdaTjQcqPX';
const GITHUB_REPO = 'https://github.com/cloudopus42-droid/sport-loungev3';

const { renderRequest } = require('./render-client');

async function main() {
  console.log('🚀 Initiating robust n8n cloud service provisioning...');
  
  // 1. Fetch Render Owner ID
  const owners = await renderRequest('GET', '/owners?limit=20');
  if (!owners || owners.length === 0) {
    throw new Error('No owners found on Render account!');
  }
  const ownerId = owners[0].owner.id;
  console.log(`✅ Found Render Owner ID: ${ownerId} (${owners[0].owner.name})`);

  // 2. Check if n8n service exists
  const services = await renderRequest('GET', '/services?limit=50');
  let service = services.find(s => s.service.name === 'sport-lounge-n8n');
  let serviceId = '';
  let n8nUrl = '';

  const envVars = [
    { key: 'N8N_ENCRYPTION_KEY', value: 'YaSmogu100_N8N_Crypt_Secret_Key_Lounge' },
    { key: 'N8N_PORT', value: '5678' },
    { key: 'N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS', value: 'false' }
  ];

  if (service) {
    serviceId = service.service.id;
    n8nUrl = service.service.serviceDetails.url;
    console.log(`✅ n8n service already exists on Render. ID: ${serviceId}, URL: ${n8nUrl}`);
    
    // Update environment variables to remove PostgreSQL and use default SQLite
    console.log('⚡ Updating environment variables to use SQLite for maximum stability...');
    await renderRequest('PUT', `/services/${serviceId}/env-vars`, envVars);
    console.log('✅ Env vars updated!');
  } else {
    console.log('➕ Provisioning a new Web Service "sport-lounge-n8n" with Docker runtime on Render...');
    const createBody = {
      type: 'web_service',
      name: 'sport-lounge-n8n',
      ownerId: ownerId,
      repo: GITHUB_REPO,
      branch: 'main',
      rootDir: 'server/n8n',
      autoDeploy: 'yes',
      serviceDetails: {
        runtime: 'docker',
        plan: 'free',
        envSpecificDetails: {}
      },
      envVars: envVars
    };

    const newService = await renderRequest('POST', '/services', createBody);
    serviceId = newService.service.id;
    n8nUrl = newService.service.serviceDetails.url;
    console.log(`✅ n8n Web Service created successfully! ID: ${serviceId}, URL: ${n8nUrl}`);
  }

  // 3. Trigger manual deploy
  try {
    console.log('⚡ Triggering deploy/redeploy on Render...');
    const deployResult = await renderRequest('POST', `/services/${serviceId}/deploys`, {
      clearCache: 'do_not_clear'
    });
    console.log(`🚀 Deploy triggered successfully! Status: ${deployResult.deploy.status}, ID: ${deployResult.deploy.id}`);
  } catch (err) {
    console.warn('⚠️ Manual deploy trigger skipped:', err.message);
  }

  console.log(`\n🎉 n8n cloud service deployed! URL: ${n8nUrl}`);
}

main().catch(err => {
  console.error('❌ Provisioning failed:', err.message);
  process.exit(1);
});
