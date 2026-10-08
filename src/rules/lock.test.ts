import { describe, expect, it } from 'vitest'
import { isLocked } from './lock.ts'

const saved = Date.parse('2026-10-08T10:00:00+08:00')
const after = (h: number, m: number, s: number) => saved + ((h * 60 + m) * 60 + s) * 1000

describe('锁定判断', () => {
  it('保存后 5 小时 59 分 → 未锁定', () => {
    expect(isLocked(saved, after(5, 59, 0))).toBe(false)
  })

  it('保存后 6 小时 0 分 1 秒 → 已锁定', () => {
    expect(isLocked(saved, after(6, 0, 1))).toBe(true)
  })

  it('恰好 6 小时 0 分 0 秒 → 已锁定', () => {
    expect(isLocked(saved, after(6, 0, 0))).toBe(true)
  })

  it('刚保存 → 未锁定', () => {
    expect(isLocked(saved, saved)).toBe(false)
  })
})
