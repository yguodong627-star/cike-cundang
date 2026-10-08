import { describe, expect, it } from 'vitest'
import { toLocalDateKey } from './date.ts'

describe('本地日期函数（测试按北京时间运行）', () => {
  it('测试环境确实是北京时间', () => {
    expect(new Date(0).getTimezoneOffset()).toBe(-480)
  })

  it('北京时间 2026-10-08 07:30 → 2026-10-08（不能是 10-07）', () => {
    expect(toLocalDateKey(Date.parse('2026-10-08T07:30:00+08:00'))).toBe('2026-10-08')
  })

  it('北京时间 2026-10-08 23:59 → 2026-10-08', () => {
    expect(toLocalDateKey(Date.parse('2026-10-08T23:59:00+08:00'))).toBe('2026-10-08')
  })

  it('北京时间 2026-10-09 00:00 → 2026-10-09', () => {
    expect(toLocalDateKey(Date.parse('2026-10-09T00:00:00+08:00'))).toBe('2026-10-09')
  })
})
