/** 把时间戳换算成这台设备所在地的日期 "YYYY-MM-DD"。所有“这是哪一天”的判断都只用它（技术文档坑 5） */
export function toLocalDateKey(timestamp: number): string {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
