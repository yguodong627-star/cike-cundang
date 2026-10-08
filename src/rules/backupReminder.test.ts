import { describe, expect, it } from 'vitest'
import { shouldRemindBackup } from './backupReminder.ts'

const at = (s: string) => new Date(s).getTime()
const now = at('2026-10-08T12:00:00')

describe('shouldRemindBackup', () => {
  it('上次备份 8 天前 → 提醒', () => {
    expect(shouldRemindBackup({ lastBackupAt: at('2026-09-30T12:00:00'), firstSaveAt: null, now })).toBe(true)
  })

  it('上次备份 6 天前 → 不提醒', () => {
    expect(shouldRemindBackup({ lastBackupAt: at('2026-10-02T12:00:00'), firstSaveAt: null, now })).toBe(false)
  })

  it('刚好满 7 天（按日期算）→ 提醒', () => {
    expect(shouldRemindBackup({ lastBackupAt: at('2026-10-01T23:59:00'), firstSaveAt: null, now: at('2026-10-08T00:01:00') })).toBe(true)
  })

  it('有过备份时，以备份时间为准，不看第一次存档', () => {
    expect(
      shouldRemindBackup({ lastBackupAt: at('2026-10-07T12:00:00'), firstSaveAt: at('2025-01-01T12:00:00'), now }),
    ).toBe(false)
  })

  it('从没备份过、第一次存档 8 天前 → 提醒', () => {
    expect(shouldRemindBackup({ lastBackupAt: null, firstSaveAt: at('2026-09-30T12:00:00'), now })).toBe(true)
  })

  it('从没备份过、第一次存档 6 天前 → 不提醒', () => {
    expect(shouldRemindBackup({ lastBackupAt: null, firstSaveAt: at('2026-10-02T12:00:00'), now })).toBe(false)
  })

  it('没有存档也没备份过 → 不提醒', () => {
    expect(shouldRemindBackup({ lastBackupAt: null, firstSaveAt: null, now })).toBe(false)
  })
})
