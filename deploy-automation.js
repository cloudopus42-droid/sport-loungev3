const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERCEL_TOKEN = 'vcp_1xwTy4tSeT6Hm9QmVOIUWRsYdP5P2wpVYyeu4YKJqCAuIo5IKf2g28Sb';
const RENDER_API_KEY = 'rnd_eUEcmLjAq9rMWQ7pBQvdaTjQcqPX';
const GITHUB_REPO = 'https://github.com/cloudopus42-droid/sport-loungev3';

function curlRequest(method, endpoint, bodyObj = null) {
  const url = `https://api.render.com/v1${endpoint}`;
  let cmd = `curl.exe -s -X ${method} "${url}" -H "Authorization: Bearer ${RENDER_API_KEY}" -H "Accept: application/json"`;
  
  let tempFilePath = null;
  if (bodyObj) {
    tempFilePath = path.resolve(__dirname, `temp_${Math.random().toString(36).substring(7)}.json`);
    fs.writeFileSync(tempFilePath, JSON.stringify(bodyObj, null, 2));
    cmd += ` -H "Content-Type: application/json" -d @"${tempFilePath}"`;
  }
  
  try {
    const output = execSync(cmd, { encoding: 'utf-8' });
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    if (!output.trim()) {
      return {};
    }
    return JSON.parse(output);
  } catch (err) {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    console.error(`Error executing curl command: ${cmd}`);
    console.error(err.message);
    throw err;
  }
}

async function main() {
  console.log('🚀 Starting automation deployment for SPORT LOUNGE v3...');

  // 1. Fetch Render Owner ID
  console.log('1. Fetching owner list from Render...');
  const owners = curlRequest('GET', '/owners?limit=20');

  if (!owners || owners.length === 0) {
    throw new Error('No owners found on Render account!');
  }
  const ownerId = owners[0].owner.id;
  console.log(`✅ Found Render Owner ID: ${ownerId} (${owners[0].owner.name})`);

  // 2. Check if the Render service already exists
  console.log('2. Checking if service "sport-lounge-backend" already exists on Render...');
  const services = curlRequest('GET', '/services?limit=50');

  let service = services.find(s => s.service.name === 'sport-lounge-backend');
  let serviceId = '';
  let renderUrl = '';

  if (service) {
    serviceId = service.service.id;
    renderUrl = service.service.url;
    console.log(`✅ Service "sport-lounge-backend" already exists. ID: ${serviceId}, URL: ${renderUrl}`);
  } else {
    console.log('➕ Creating new Web Service "sport-lounge-backend" on Render...');
    const createBody = {
      type: 'web_service',
      name: 'sport-lounge-backend',
      ownerId: ownerId,
      repo: GITHUB_REPO,
      branch: 'main',
      rootDir: 'server',
      autoDeploy: 'yes',
      serviceDetails: {
        runtime: 'node',
        plan: 'free',
        envSpecificDetails: {
          buildCommand: 'npm install && npm run build',
          startCommand: 'node dist/server.js'
        }
      },
      envVars: [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'PORT', value: '5000' },
        { key: 'JWT_SECRET', value: 'YaSmogu100_JWT_Secret_Key_Lounge' },
        { key: 'TELEGRAM_TOKEN', value: '8569759144:AAEpmyJthuhgJ2qCAFt_jz63TN1lwlnYHIs' },
        { key: 'TELEGRAM_CHAT_ID', value: '5652912760' },
        { key: 'TELEGRAM_API_BASE_URL', value: 'https://api.telegram.org' },
        { key: 'SUPABASE_URL', value: 'https://haemdfhteicygsidftqp.supabase.co' },
        { key: 'SUPABASE_KEY', value: 'sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_' },
        { key: 'SUPABASE_ANON_KEY', value: 'sb_publishable_hdjCkqf7FcWJekjombPjWg_OzILJPDE' },
        { key: 'ALLOWED_ORIGINS', value: 'http://localhost:3000,http://localhost:5173' }
      ]
    };

    const newService = curlRequest('POST', '/services', createBody);
    serviceId = newService.id;
    renderUrl = newService.url;
    console.log(`✅ Web Service created successfully on Render! ID: ${serviceId}, URL: ${renderUrl}`);
  }

  // 3. Write Render URL to client config
  console.log(`3. Writing VITE_API_URL=${renderUrl} to client/.env and client/.env.production...`);
  fs.writeFileSync(path.resolve(__dirname, 'client/.env'), `VITE_API_URL=${renderUrl}\n`);
  fs.writeFileSync(path.resolve(__dirname, 'client/.env.production'), `VITE_API_URL=${renderUrl}\n`);
  console.log('✅ Local env files updated.');

  // 4. Deploy Front-end to Vercel via CLI
  console.log('4. Deploying client to Vercel (running CLI)...');
  const vercelCmd = `cmd /c npx vercel --token ${VERCEL_TOKEN} --name sport-loungev3 --yes --prod`;
  console.log(`Running in client folder: ${vercelCmd}`);
  
  let vercelUrl = '';
  try {
    const vercelOutput = execSync(vercelCmd, { 
      cwd: path.resolve(__dirname, 'client'),
      encoding: 'utf-8' 
    });
    console.log('Vercel Output:\n', vercelOutput);
    // Parse URL from output. Vercel prints: "https://sport-loungev3-xxxx.vercel.app"
    const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.vercel\.app/g;
    const matches = vercelOutput.match(urlRegex);
    if (matches && matches.length > 0) {
      vercelUrl = matches[matches.length - 1];
    } else {
      vercelUrl = 'https://sport-loungev3.vercel.app'; // Fallback
    }
  } catch (err) {
    console.error('❌ Vercel deployment command failed. Trying to parse error output...');
    console.error(err.stdout || err.message);
    throw err;
  }
  console.log(`✅ Front-end successfully deployed to Vercel! URL: ${vercelUrl}`);

  // 5. Update CORS in Render with Vercel URL
  console.log(`5. Updating Render service ALLOWED_ORIGINS to include: ${vercelUrl}`);
  
  // First, get current env vars to retain them
  const currentEnvVars = curlRequest('GET', `/services/${serviceId}/env-vars?limit=100`);

  const updatedEnvVars = currentEnvVars.map(ev => {
    if (ev.envVar.key === 'ALLOWED_ORIGINS') {
      return { key: 'ALLOWED_ORIGINS', value: `http://localhost:3000,http://localhost:5173,${vercelUrl}` };
    }
    return { key: ev.envVar.key, value: ev.envVar.value };
  });

  // If ALLOWED_ORIGINS wasn't there, add it
  if (!updatedEnvVars.some(ev => ev.key === 'ALLOWED_ORIGINS')) {
    updatedEnvVars.push({ key: 'ALLOWED_ORIGINS', value: `http://localhost:3000,http://localhost:5173,${vercelUrl}` });
  }

  // Put updated env vars back to Render (this will auto-trigger a redeploy on Render)
  curlRequest('PUT', `/services/${serviceId}/env-vars`, updatedEnvVars);
  console.log('✅ Render CORS whitelisting updated! (Redeploy automatically triggered)');

  console.log('\n🎉🎉🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉🎉🎉');
  console.log(`Backend Server (Render): ${renderUrl}`);
  console.log(`Frontend Application (Vercel): ${vercelUrl}`);
}

main().catch(err => {
  console.error('❌ Deployment script failed:', err);
  process.exit(1);
});
