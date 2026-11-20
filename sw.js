// Cache del esqueleto. Los ficheros se actualizan al recuperar conexión.
const CACHE='calistenia-plus-v2';
const SHELL=['./','./index.html','./styles.css','./app.js','./exercises.js','./manifest.webmanifest','./app-icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('calistenia-plus-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request);
   if(response.ok)await cache.put(request,response.clone());
   return response;
  }catch{
   const saved=await caches.match(request);
   if(saved)return saved;
   if(request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();
   return Response.error();
  }
 })());
});
