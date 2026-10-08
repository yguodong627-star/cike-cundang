import { describe, expect, it } from 'vitest'
import { validateSave, type SaveDraft } from './validate.ts'

const draft = (d: Partial<SaveDraft>): SaveDraft => ({ text: null, photoCount: 0, audioDurationMs: null, ...d })
const reason = (d: Partial<SaveDraft>) => {
  const r = validateSave(draft(d))
  return r.ok ? '通过' : r.reason
}

describe('存档内容检查', () => {
  it('文字、照片、语音都没有 → 至少需要一项内容', () => {
    expect(reason({})).toBe('至少需要一项内容')
  })

  it('只有空格 → 至少需要一项内容', () => {
    expect(reason({ text: '   ' })).toBe('至少需要一项内容')
  })

  it('文字 200 字通过，201 字不通过', () => {
    expect(reason({ text: '字'.repeat(200) })).toBe('通过')
    expect(reason({ text: '字'.repeat(201) })).toBe('文字最多 200 字')
  })

  it('照片 10 张通过，11 张不通过', () => {
    expect(reason({ photoCount: 10 })).toBe('通过')
    expect(reason({ photoCount: 11 })).toBe('照片最多 10 张')
  })

  it('语音 60 秒通过，61 秒不通过', () => {
    expect(reason({ audioDurationMs: 60_000 })).toBe('通过')
    expect(reason({ audioDurationMs: 61_000 })).toBe('语音最长 1 分钟')
  })

  it('只有 1 张照片 → 通过', () => {
    expect(reason({ photoCount: 1 })).toBe('通过')
  })

  it('emoji 按 1 个字计算', () => {
    expect(reason({ text: '😀'.repeat(200) })).toBe('通过')
  })
})
