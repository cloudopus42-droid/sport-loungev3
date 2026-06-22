import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const distDir = path.resolve(process.argv[2] || 'dist');

const buildId = crypto.randomUUID().replace(/-/g, '').substring(0, 12);

fs.writeFileSync(
  path.join(distDir, 'version.json'),
  JSON.stringify({ buildId, timestamp: new Date().toISOString() }, null, 2)
);
console.log(`[build] version.json (buildId: ${buildId})`);

const swJs = `// SPORT LOUNGE SW - Build ${buildId}
const B = '${buildId}';
const SC = 'sl-' + B + '-s';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => !x.startsWith('sl-' + B)).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.pathname.includes('/api/') || u.pathname.endsWith('/version.json')) return;
  if (u.pathname.match(/\\/assets\\/.+\\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|svg|ico|gif)(\\?.*)?$/)) {
    e.respondWith(caches.open(SC).then((c) => c.match(e.request).then((h) => h || fetch(e.request).then((r) => { if (r.status === 200) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
`;

fs.writeFileSync(path.join(distDir, 'sw.js'), swJs);
console.log(`[build] sw.js generated (${(swJs.length / 1024).toFixed(1)} KB)`);

// ── Inject watchdog into index.html ──────────────────────────────────
const htmlPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

const watchdog = `<script>
window.__slBuildId = '${buildId}';
(function(){
  var bld = window.__slBuildId;
  if (!bld) return;

  // Force-unregister ALL stale service workers on every page load
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      if (regs.length) {
        // Check if any existing SW has a different buildId
        Promise.all(regs.map(function(r) { return r.unregister(); }))
          .then(function() {
            // Re-register with updateViaCache=none
            navigator.serviceWorker.register('/sport-loungev3/sw.js', { updateViaCache: 'none' })
              .then(function() { console.log('[SW] fresh registration OK'); })
              .catch(function(e) { console.log('[SW] register fail:', e); });
          });
      }
    });
  }

  // Poll for new version every 20s
  var poll = setInterval(function() {
    fetch('/sport-loungev3/version.json?' + Date.now() + Math.random(), { cache: 'no-store' })
      .then(function(r) { return r.json(); })
      .then(function(v) {
        if (v.buildId && v.buildId !== bld) {
          clearInterval(poll);
          var banner = document.createElement('div');
          banner.id = 'sl-update-banner';
          banner.textContent = '\\u0414\\u043E\\u0441\\u0442\\u0443\\u043F\\u043D\\u0430 \\u043D\\u043E\\u0432\\u0430\\u044F \\u0432\\u0435\\u0440\\u0441\\u0438\\u044F. \\u041E\\u0431\\u043D\\u043E\\u0432\\u043B\\u0435\\u043D\\u0438\\u0435...';
          Object.assign(banner.style, {
            position:'fixed', top:'0', left:'0', right:'0', zIndex:'999999',
            background:'#d4af37', color:'#0b0807', padding:'12px 20px',
            fontFamily:'Geist, sans-serif', fontSize:'14px', fontWeight:'600',
            textAlign:'center', cursor:'pointer'
          });
          banner.onclick = function() { location.reload(true); };
          document.body.prepend(banner);
          setTimeout(function() { location.reload(true); }, 2000);
        }
      }).catch(function(){});
  }, 20000);
})();
</script>`;

// Insert watchdog right before </head>
if (html.includes('</head>')) {
  html = html.replace('</head>', watchdog + '\n</head>');
  fs.writeFileSync(htmlPath, html);
  console.log('[build] watchdog injected into index.html');
} else {
  console.warn('[build] WARNING: </head> not found in index.html');
}

