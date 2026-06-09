const { renderRequest } = require('./render-client');

async function main() {
  const deploy = await renderRequest('GET', '/services/srv-d8e87p9o3t8c73f7mppg/deploys/dep-d8e881tvmnac73c2f200');
  console.log(JSON.stringify(deploy, null, 2));
}

main().catch(console.error);
