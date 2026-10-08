import { useEffect, useState } from 'react'

/** 当前时间，每隔 intervalMs 刷新一次，让“满 6 小时封存”这类状态到点自己变 */
export function useNow(intervalMs = 60 * 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
