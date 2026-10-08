import { BACKUP_REMIND_DAYS } from './constants.ts'
import { daysBetweenKeys, toLocalDateKey } from './date.ts'

export interface ReminderInput {
  /** 上次备份时间；从没备份过为 null */
  lastBackupAt: number | null
  /** 第一条存档的时间；没有存档为 null */
  firstSaveAt: number | null
  now: number
}

/**
 * 存完一条之后是否提醒备份：距离上次备份满 7 天；
 * 从没备份过时，从第一次存档那天算起满 7 天。按本地日期算天数。
 */
export function shouldRemindBackup({ lastBackupAt, firstSaveAt, now }: ReminderInput): boolean {
  const since = lastBackupAt ?? firstSaveAt
  if (since === null) return false
  return daysBetweenKeys(toLocalDateKey(since), toLocalDateKey(now)) >= BACKUP_REMIND_DAYS
}
