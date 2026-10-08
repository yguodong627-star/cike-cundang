import type { Save } from '../types/models.ts'
import { toLocalDateKey } from './date.ts'

export interface DayGroup<T> {
  dateKey: string
  saves: T[]
}

/** 时间线分组：日期从新到旧，同一天里也是新的在上面 */
export function groupSavesByDay<T extends Pick<Save, 'id' | 'createdAt'>>(saves: T[]): DayGroup<T>[] {
  const sorted = [...saves].sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id))
  const groups: DayGroup<T>[] = []
  for (const save of sorted) {
    const key = toLocalDateKey(save.createdAt)
    const last = groups.at(-1)
    if (last && last.dateKey === key) last.saves.push(save)
    else groups.push({ dateKey: key, saves: [save] })
  }
  return groups
}

/** "2026-10-08" → "2026 年 10 月 8 日" */
export function formatDateHeading(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return `${y} 年 ${m} 月 ${d} 日`
}

/** 本地时间 "HH:mm" */
export function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
