import { describe, expect, it } from 'vitest'
import { formatDuration } from './recorder.ts'

describe('formatDuration', () => {
  it('formats as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(999)).toBe('0:00')
    expect(formatDuration(1000)).toBe('0:01')
    expect(formatDuration(59_999)).toBe('0:59')
    expect(formatDuration(60_000)).toBe('1:00')
  })
})
