// 离线缓存：打开过一次后，没网也能打开（技术文档 2.7）。只缓存网页本身的文件，存档数据在 IndexedDB 里，不经过这里。
const CACHE = 'cike-v1'
const NETWORK_TIMEOUT_MS = 3000

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/', '/manifest.webmanifest'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

// 新版网页不再引用的旧脚本、样式从缓存里删掉，免得越积越多
async function pruneAssets(cache, html) {
  const used = new Set(html.match(/\/assets\/[^"'\s)]+/g) ?? [])
  if (used.size === 0) return
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname
    if (path.startsWith('/assets/') && !used.has(path)) await cache.delete(request)
  }
}

// 页面：先上网取最新的，3 秒没回应或没网就用缓存，免得信号差时打不开
async function handleNavigate(request) {
  const cache = await caches.open(CACHE)
  const fromNetwork = fetch(request).then((response) => {
    if (response.ok) {
      cache.put('/', response.clone())
      response.clone().text().then((html) => pruneAssets(cache, html))
    }
    return response
  })
  fromNetwork.catch(() => {})
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS))
  try {
    const response = await Promise.race([fromNetwork, timeout])
    if (response) return response
  } catch {
    // 没网，用缓存
  }
  const cached = await cache.match('/')
  return cached ?? fromNetwork
}

// /assets/ 下的脚本、样式：文件名带版本号，内容不会变，有缓存就直接用
async function handleAsset(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

// 其他文件（如网页清单）：有网用最新的，没网用缓存
async function handleOther(request) {
  const cache = await caches.open(CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (e) {
    const cached = await cache.match(request)
    if (cached) return cached
    throw e
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (request.mode === 'navigate') event.respondWith(handleNavigate(request))
  else if (url.pathname.startsWith('/assets/')) event.respondWith(handleAsset(request))
  else event.respondWith(handleOther(request))
})
