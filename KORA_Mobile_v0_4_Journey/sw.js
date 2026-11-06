const CACHE='kora-v0.3.0';
const ASSETS=['./','./index.html','./styles.css','./app.js','./game.js','./iron-data.js','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-512-maskable.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp}).catch(()=>caches.match('./index.html'))))});