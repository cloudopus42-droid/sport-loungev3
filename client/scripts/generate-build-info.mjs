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
const ASSET_RE = /\\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|svg|ico|gif)(\\?.*)?$/;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((k) => Promise.all(
      k.filter((x) => !x.startsWith('sl-' + B)).map((x) => caches.delete(x))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);

  // Never cache: API, version checks, HTML documents
  if (u.pathname.includes('/api/') || u.pathname.endsWith('/version.json')) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request)));
    return;
  }

  // Cache-first for hashed assets (immutable)
  if (u.pathname.includes('/assets/') && ASSET_RE.test(u.pathname)) {
    e.respondWith(
      caches.open(SC).then((c) =>
        c.match(e.request).then((h) =>
          h || fetch(e.request, { cache: 'no-cache' }).then((r) => {
            if (r.status === 200) c.put(e.request, r.clone());
            return r;
          })
        )
      )
    );
    return;
  }

  // Network-first for everything else
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).catch(() => caches.match(e.request)));
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

  var base = location.pathname.replace(/\\/[^\\/]*\\/?$/, '/');
  var storedBld = localStorage.getItem('_sl_bld');

  // Force reload if buildId changed
  if (storedBld && storedBld !== bld) {
    localStorage.setItem('_sl_bld', bld);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(r) {
        return Promise.all(r.map(function(x) { return x.unregister(); }));
      }).then(function() {
        location.reload();
      });
    } else {
      location.reload();
    }
    return;
  }

  // Register SW on first visit or new build
  if (storedBld !== bld) {
    localStorage.setItem('_sl_bld', bld);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(base + 'sw.js', { updateViaCache: 'none' })
        .catch(function(){});
    }
  }

  // Multi-signal version check: fetch version.json + deploy timestamp
  function checkVersion() {
    var ts = Date.now();
    // Signal 1: version.json (may be CDN-cached)
    fetch(base + 'version.json?_=' + ts, { cache: 'no-store', headers: {'Cache-Control':'no-cache'} })
      .then(function(r) { return r.json(); })
      .then(function(v) {
        if (v.buildId && v.buildId !== bld) {
          localStorage.removeItem('_sl_bld');
          location.reload();
        }
      }).catch(function(){});

    // Signal 2: index.html itself — if server returns different content, CDN updated
    fetch(base + '?_=' + ts, { cache: 'no-store', headers: {'Cache-Control':'no-cache'} })
      .then(function(r) { return r.text(); })
      .then(function(html) {
        var match = html.match(/__slBuildId\\s*=\\s*['"]([^'"]+)['"]/);
        if (match && match[1] !== bld) {
          localStorage.removeItem('_sl_bld');
          location.reload();
        }
      }).catch(function(){});
  }

  // Check immediately
  checkVersion();

  // Poll every 10s
  var poll = setInterval(function() {
    fetch(base + 'version.json?_=' + Date.now(), { cache: 'no-store' })
      .then(function(r) { return r.json(); })
      .then(function(v) {
        if (v.buildId && v.buildId !== bld) {
          clearInterval(poll);
          var banner = document.createElement('div');
          banner.id = 'sl-update-banner';
          banner.textContent = '\\u0414\\u043E\\u0441\\u0442\\u0443\\u043F\\u043D\\u0430 \\u043D\\u043E\\u0432\\u0430\\u044F \\u0432\\u0435\\u0440\\u0441\\u0438\\u044F. \\u041E\\u0431\\u043D\\u043E\\u0432\\u043B\\u0435\\u043D\\u0438\\u0435...';
          Object.assign(banner.style, {
            position:'fixed', top:'0', left:'0', right:'0', zIndex:'999999',
            background:'#B08D57', color:'#070707', padding:'12px 20px',
            fontFamily:'Inter, sans-serif', fontSize:'14px', fontWeight:'600',
            textAlign:'center', cursor:'pointer'
          });
          banner.onclick = function() { location.reload(); };
          document.body.prepend(banner);
          setTimeout(function() { location.reload(); }, 2000);
        }
      }).catch(function(){});
  }, 10000);
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

