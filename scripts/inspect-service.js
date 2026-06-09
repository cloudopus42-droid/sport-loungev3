const token = 'vcp_1xwTy4tSeT6Hm9QmVOIUWRsYdP5P2wpVYyeu4YKJqCAuIo5IKf2g28Sb';
const projectId = 'prj_2JoAFkxO8qzPAIJCUCdRkZv3G6Yb';
const teamId = 'team_DOkGPUFspPIb3JnEouf7zhdw';

async function run() {
  const url = `https://api.vercel.com/v9/projects/${projectId}?teamId=${teamId}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
