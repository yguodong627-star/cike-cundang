import { describe, expect, it } from 'vitest'

describe('测试工具', () => {
  it('能正常运行', () => {
    expect(1 + 1).toBe(2)
  })

  it('能使用模拟的浏览器仓库 IndexedDB', () => {
    expect(typeof indexedDB.open).toBe('function')
  })
})
