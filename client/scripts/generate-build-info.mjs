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
