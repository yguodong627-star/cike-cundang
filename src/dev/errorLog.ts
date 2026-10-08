const KEY = 'cike-diag-log'
const BEAT_KEY = 'cike-diag-beat'
const MAX = 200

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function logDiag(line: string) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  const lines = [...read(), `${time} ${line}`].slice(-MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(lines))
  } catch {
    // 写满了就不记
  }
}

export function readDiagLog(): string[] {
  return read()
}

export function clearDiagLog() {
  localStorage.removeItem(KEY)
}

/** 临时排查用：记下报错、页面切换、主线程卡顿，存在 localStorage 里，卡死重开后还能看到 */
export function installDiagLog() {
  const lastBeat = Number(localStorage.getItem(BEAT_KEY) ?? 0)
  if (lastBeat) logDiag(`上次运行最后心跳：${new Date(lastBeat).toLocaleTimeString('zh-CN', { hour12: false })}`)
  logDiag(`启动 ${location.pathname}${location.search}`)

  window.addEventListener('error', (e) => logDiag(`报错 ${e.message} @${e.filename}:${e.lineno}`))
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason
    logDiag(`未处理 ${r?.name ?? ''} ${r?.message ?? String(r)}`)
  })
  document.addEventListener('visibilitychange', () => logDiag(`可见性 ${document.visibilityState}`))

  const push = history.pushState.bind(history)
  history.pushState = (...args: Parameters<History['pushState']>) => {
    logDiag(`跳转 ${String(args[2])}`)
    push(...args)
  }
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target as HTMLElement | null
      const label = el?.closest('a,button')?.textContent?.slice(0, 12)
      if (label) logDiag(`点击 ${label}`)
    },
    true,
  )

  const created = new Set<string>()
  const revoked = new Set<string>()
  const short = (u: string) => u.slice(-6)
  const create = URL.createObjectURL.bind(URL)
  const revoke = URL.revokeObjectURL.bind(URL)
  URL.createObjectURL = (obj: Blob | MediaSource) => {
    const u = create(obj)
    created.add(u)
    if (obj instanceof Blob) logDiag(`生成网址 ${short(u)} size=${obj.size} ${obj.type}`)
    return u
  }
  URL.revokeObjectURL = (u: string) => {
    revoked.add(u)
    revoke(u)
  }
  const mediaEvent = (ok: boolean) => (e: Event) => {
    const el = e.target as HTMLImageElement | HTMLAudioElement
    if (!(el instanceof HTMLImageElement || el instanceof HTMLAudioElement)) return
    const src = el.currentSrc || el.src
    const where = el.closest('.fixed') ? '弹层' : location.pathname
    const state = !src.startsWith('blob:')
      ? src.slice(0, 20)
      : revoked.has(src)
        ? '已回收'
        : created.has(src)
          ? '有效'
          : '不认识'
    logDiag(`${el.tagName === 'IMG' ? '图片' : '语音'}${ok ? '成功' : '失败'} ${where} ${short(src)} ${state}`)
  }
  document.addEventListener('error', mediaEvent(false), true)
  document.addEventListener('load', mediaEvent(true), true)

  let lastState = ''
  const snapshot = () => {
    const nav = document.querySelector('nav')?.getBoundingClientRect()
    const vv = window.visualViewport
    const active = document.activeElement
    return [
      location.pathname,
      nav ? `导航 top=${Math.round(nav.top)} h=${Math.round(nav.height)}` : '导航不存在',
      `窗口 ${innerHeight}`,
      vv ? `可视 ${Math.round(vv.height)}@${Math.round(vv.offsetTop)}` : '',
      `滚动 ${Math.round(scrollY)}`,
      `焦点 ${active?.tagName ?? '无'}`,
      `body ${document.body.style.overflow || '-'}`,
      `弹层 ${document.querySelectorAll('.fixed.inset-0').length}`,
    ].join(' ')
  }

  let prev = Date.now()
  setInterval(() => {
    const now = Date.now()
    if (now - prev > 3000 && document.visibilityState === 'visible') logDiag(`卡顿 ${now - prev} ms`)
    prev = now
    localStorage.setItem(BEAT_KEY, String(now))
    const s = snapshot()
    if (s !== lastState) {
      lastState = s
      logDiag(`状态 ${s}`)
    }
  }, 500)
}
