import type { Save } from '../types/models.ts'
import { daysBetweenKeys, toLocalDateKey } from './date.ts'

export const MIN_GRID_DAYS = 365

export interface GridInfo {
  /** 起点日期（最早一条存档那天）；没有存档时为 null */
  startDate: string | null
  /** 格子总数：至少 365，满 365 天后随时间延长；没有存档时为 0 */
  totalDays: number
  /** 有存档的日期 */
  litDates: Set<string>
}

export function computeGrid(saves: Pick<Save, 'createdAt'>[], now: number): GridInfo {
  if (saves.length === 0) return { startDate: null, totalDays: 0, litDates: new Set() }

  const litDates = new Set(saves.map((s) => toLocalDateKey(s.createdAt)))
  const earliest = Math.min(...saves.map((s) => s.createdAt))
  const startDate = toLocalDateKey(earliest)
  const daysSoFar = daysBetweenKeys(startDate, toLocalDateKey(now)) + 1

  return { startDate, totalDays: Math.max(MIN_GRID_DAYS, daysSoFar), litDates }
}
