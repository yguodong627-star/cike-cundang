import { describe, expect, it } from 'vitest'
import { computeGrid } from './grid.ts'
import { addDaysToKey, daysBetweenKeys } from './date.ts'

const at = (date: string, time = '12:00') => ({ createdAt: Date.parse(`${date}T${time}:00+08:00`) })
const today = Date.parse('2026-10-10T15:00:00+08:00')

describe('365 格子计算', () => {
  it('没有存档 → 没有起点，格子总数 0', () => {
    const g = computeGrid([], today)
    expect(g.startDate).toBeNull()
    expect(g.totalDays).toBe(0)
  })

  it('第一条在 2026-10-08，今天 10-10 → 起点 10-08，总数 365', () => {
    const g = computeGrid([at('2026-10-08')], today)
    expect(g.startDate).toBe('2026-10-08')
    expect(g.totalDays).toBe(365)
  })

  it('10-08 存 3 条、10-10 存 1 条 → 只点亮这两天，10-09 不亮', () => {
    const g = computeGrid(
      [at('2026-10-08', '08:00'), at('2026-10-08', '12:00'), at('2026-10-08', '22:00'), at('2026-10-10')],
      today,
    )
    expect([...g.litDates].sort()).toEqual(['2026-10-08', '2026-10-10'])
    expect(g.litDates.has('2026-10-09')).toBe(false)
  })

  it('第一条在 400 天前 → 总数 401（满 365 后继续延长）', () => {
    const fourHundredDaysAgo = today - 400 * 86_400_000
    const g = computeGrid([{ createdAt: fourHundredDaysAgo }], today)
    expect(g.totalDays).toBe(401)
  })

  it('最早那条被去掉、第二条在 10-10 → 起点顺延到 10-10', () => {
    const first = at('2026-10-08')
    const second = at('2026-10-10')
    expect(computeGrid([first, second], today).startDate).toBe('2026-10-08')
    expect(computeGrid([second], today).startDate).toBe('2026-10-10')
  })

  it('早上 7:30 的存档点亮当天，不是前一天', () => {
    const g = computeGrid([at('2026-10-08', '07:30')], today)
    expect(g.litDates.has('2026-10-08')).toBe(true)
    expect(g.litDates.has('2026-10-07')).toBe(false)
  })
})

describe('日期加减', () => {
  it('跨月、跨年都正确', () => {
    expect(addDaysToKey('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01')
    expect(daysBetweenKeys('2026-10-08', '2026-10-10')).toBe(2)
    expect(daysBetweenKeys('2026-01-01', '2027-01-01')).toBe(365)
  })
})
