async function run() {
  for (let i = 1; i <= 25; i++) {
    try {
      console.log(`Attempt ${i}...`);
      const res = await fetch('https://sport-loungev3.onrender.com/api/health', { signal: AbortSignal.timeout(10000) });
      console.log(`Success! Status: ${res.status}`);
      if (res.status === 200) {
        console.log("Backend is online!");
        break;
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
      await new Promise(r => setTimeout(r, 6000));
    }
  }
}
run();
