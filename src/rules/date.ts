/** 把时间戳换算成这台设备所在地的日期 "YYYY-MM-DD"。所有“这是哪一天”的判断都只用它（技术文档坑 5） */
export function toLocalDateKey(timestamp: number): string {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function keyToLocalNoon(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** 两个日期相差几天（b - a），例如 2026-10-08 到 2026-10-10 是 2 */
export function daysBetweenKeys(a: string, b: string): number {
  return Math.round((keyToLocalNoon(b).getTime() - keyToLocalNoon(a).getTime()) / 86_400_000)
}

/** 日期往后数 n 天 */
export function addDaysToKey(key: string, n: number): string {
  const d = keyToLocalNoon(key)
  d.setDate(d.getDate() + n)
  return toLocalDateKey(d.getTime())
}
