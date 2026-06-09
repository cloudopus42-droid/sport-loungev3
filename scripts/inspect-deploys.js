const token = 'vcp_1xwTy4tSeT6Hm9QmVOIUWRsYdP5P2wpVYyeu4YKJqCAuIo5IKf2g28Sb';
const deploymentId = 'dpl_2p7wuZLL5Te9xCciz8kZQh3Lcu59';

async function run() {
  const res = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  console.log("State:", data.readyState);
  console.log("Seat Block:", data.seatBlock);
}
run();
