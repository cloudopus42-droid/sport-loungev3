const { renderRequest } = require('./render-client');

async function main() {
  try {
    const logs = await renderRequest('GET', '/services/srv-d8e87p9o3t8c73f7mppg/deploys/dep-d8e881tvmnac73c2f200/logs');
    console.log(JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Failed to get logs:', err.message);
  }
}

main().catch(console.error);
