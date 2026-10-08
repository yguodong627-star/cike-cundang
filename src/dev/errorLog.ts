const KEY = 'cike-diag-log'
const BEAT_KEY = 'cike-diag-beat'
const MAX = 80

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

  let prev = Date.now()
  setInterval(() => {
    const now = Date.now()
    if (now - prev > 3000 && document.visibilityState === 'visible') logDiag(`卡顿 ${now - prev} ms`)
    prev = now
    localStorage.setItem(BEAT_KEY, String(now))
  }, 1000)
}
