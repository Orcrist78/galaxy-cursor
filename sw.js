
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.2/workbox-sw.js');

const { workbox } = self;
const { precaching: { precacheAndRoute }} = workbox;

precacheAndRoute([
  { url: '/index.html', revision: null },
  { url: '/script/galaxy-cursor/galaxy-cursor.js', revision: null },
  { url: '/script/galaxy-cursor/galaxy-cursor.shared.js', revision: null },
  { url: '/script/galaxy-cursor/galaxy-cursor.worker.js', revision: null },
  { url: '/libs/debounce.js', revision: null },
  { url: '/libs/easing-functions.js', revision: null },
  { url: '/libs/tween.js', revision: null },
  { url: '/css/style.css', revision: null },
  { url: '/img/bg.jpeg', revision: null },
  { url: '/sw.js', revision: null },
  { url: '/manifest.webmanifest', revision: null },
  { url: '/ico/icon-192x192.png', revision: null },
  { url: '/ico/icon-256x256.png', revision: null },
  { url: '/ico/icon-384x384.png', revision: null },
  { url: '/ico/icon-512x512.png', revision: null }
], {
  cleanUrls: false,
});
