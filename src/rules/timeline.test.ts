import { describe, expect, it } from 'vitest'
import { formatDateHeading, formatTime, groupSavesByDay } from './timeline.ts'

const at = (s: string) => new Date(s).getTime()

describe('groupSavesByDay', () => {
  it('returns empty for no saves', () => {
    expect(groupSavesByDay([])).toEqual([])
  })

  it('groups by local day, newest first', () => {
    const saves = [
      { id: 'a', createdAt: at('2026-10-07T09:00:00') },
      { id: 'c', createdAt: at('2026-10-08T20:00:00') },
      { id: 'b', createdAt: at('2026-10-08T08:00:00') },
    ]
    const groups = groupSavesByDay(saves)
    expect(groups.map((g) => g.dateKey)).toEqual(['2026-10-08', '2026-10-07'])
    expect(groups[0].saves.map((s) => s.id)).toEqual(['c', 'b'])
    expect(groups[1].saves.map((s) => s.id)).toEqual(['a'])
  })

  it('splits at local midnight', () => {
    const groups = groupSavesByDay([
      { id: 'late', createdAt: at('2026-10-07T23:59:00') },
      { id: 'early', createdAt: at('2026-10-08T00:01:00') },
    ])
    expect(groups.map((g) => g.dateKey)).toEqual(['2026-10-08', '2026-10-07'])
  })
})

describe('formatting', () => {
  it('formats date heading', () => {
    expect(formatDateHeading('2026-10-08')).toBe('2026 年 10 月 8 日')
  })
  it('formats time', () => {
    expect(formatTime(at('2026-10-08T07:05:00'))).toBe('07:05')
  })
})
