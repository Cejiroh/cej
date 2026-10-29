/*
 * Budget Tracker service worker.
 *  - Offline: keeps the app on the phone so it opens with no internet. Pages are fetched from the network first
 *    (so updates arrive as soon as you are online) and fall back to the saved copy.
 *  - Reminders: shows due-bill notifications (see check()).
 * Data itself lives in the app's local storage; Google Sheet requests are never cached here.
 */
const CACHE = "ipon-shell-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./favicon.svg", "./icon-192.png", "./icon-512.png"];
const DB = "ipon-notify";

function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function get(k) {
  const d = await db();
  return new Promise((res, rej) => { const q = d.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
}
async function set(k, v) {
  const d = await db();
  return new Promise((res, rej) => { const t = d.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
}

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const daysFromToday = (dateISO) => {
  const [y, m, d] = dateISO.split("-").map(Number);
  const t = new Date();
  return Math.round((new Date(y, m - 1, d) - new Date(t.getFullYear(), t.getMonth(), t.getDate())) / 86400000);
};
const when = (n) => (n < 0 ? "overdue by " + -n + (n === -1 ? " day" : " days") : n === 0 ? "due today" : n === 1 ? "due tomorrow" : "due in " + n + " days");
const peso = (n) => "₱" + Number(n).toLocaleString("en-PH", { maximumFractionDigits: 2 });
const short = (dateISO) => { const [y, m, d] = dateISO.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-PH", { month: "short", day: "numeric" }); };

async function check() {
  const snap = await get("snapshot");
  if (!snap) return;
  const today = iso(new Date());
  const shown = (await get("shown")) || {};
  const fresh = snap.items.map((i) => ({ ...i, days: daysFromToday(i.date) })).filter((i) => i.days <= snap.lead && shown[i.key] !== today);
  if (!fresh.length) return;
  const icon = new URL("favicon.svg", self.registration.scope).href;
  if (fresh.length <= 3) {
    for (const i of fresh) await self.registration.showNotification(i.title + " · " + when(i.days), { body: (i.amount ? peso(i.amount) : "Amount varies") + " · " + short(i.date), icon, tag: i.key, data: { path: "bills" } });
  } else {
    await self.registration.showNotification(fresh.length + " bills due soon", { body: fresh.slice(0, 3).map((i) => i.title).join(", ") + ", …", icon, tag: "ipon-summary", data: { path: "bills" } });
  }
  const next = {};
  Object.keys(shown).forEach((k) => { if (shown[k] === today) next[k] = today; });
  fresh.forEach((i) => { next[i.key] = today; });
  await set("shown", next);
}

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => undefined)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("ipon-shell-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    // on a weak connection don't wait forever: after 4s use the saved copy
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(req, { signal: ctl.signal });
    clearTimeout(timer);
    if (res.ok) { cache.put(req, res.clone()); cache.put("./index.html", res.clone()); }
    return res;
  } catch (_) {
    return (await cache.match(req)) || (await cache.match("./index.html")) || (await cache.match("./")) || Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) e.respondWith(req.mode === "navigate" ? networkFirst(req) : staleWhileRevalidate(req));
  else if (FONT_HOSTS.includes(url.hostname)) e.respondWith(staleWhileRevalidate(req));
  // everything else (Google Apps Script, etc.) goes straight to the network
});
self.addEventListener("periodicsync", (e) => { if (e.tag === "ipon-due") e.waitUntil(check()); });
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const path = (e.notification.data && e.notification.data.path) || "bills";
  const url = new URL("#/" + path, self.registration.scope).href;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) { if ("focus" in c) { await c.focus(); if ("navigate" in c) { try { await c.navigate(url); } catch (_) { /* ignore */ } } return; } }
    await self.clients.openWindow(url);
  })());
});
