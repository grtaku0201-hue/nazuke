"use strict";
/*
 * なまえノート Service Worker
 *
 * 【重要】更新をデプロイするときは必ず CACHE_NAME のバージョン番号を上げること。
 * 上げ忘れると、ユーザーの端末で古い HTML が表示され続けます。
 */
const CACHE_NAME = "nazuke-v1";

// プリキャッシュ: 自オリジンの静的ファイルのみ
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-512.png",
  "./vendor/firebase/firebase-app.js",
  "./vendor/firebase/firebase-auth.js",
  "./vendor/firebase/firebase-firestore.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== FONT_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

const FONT_CACHE = "nazuke-fonts-v1";

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 【最重要】Firebase (Firestore/Auth) の API 通信は絶対にキャッシュしない。
  // WebChannel(ロングポーリング)をキャッシュに乗せると同期が静かに壊れる。
  if (url.hostname.endsWith("googleapis.com") || url.hostname.endsWith("firebaseio.com")) {
    return; // ブラウザのデフォルト動作（ネットワーク素通し）
  }

  // Google Fonts: cache-first のランタイムキャッシュ
  // （一度表示した文字のフォントは以後オフラインでも使える）
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(event.request).then((hit) =>
          hit || fetch(event.request).then((res) => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          })
        )
      )
    );
    return;
  }

  // 自オリジン: cache-first（プリキャッシュ済みアセット）
  if (url.origin === self.location.origin && event.request.method === "GET") {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((hit) =>
        hit || fetch(event.request)
      )
    );
  }
});
