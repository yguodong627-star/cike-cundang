import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { db } from '../db/db.ts'
import { getLastBackupAt } from '../db/settings.ts'
import { useBackupExport } from './useBackupExport.tsx'
import { shouldRemindBackup } from '../rules/backupReminder.ts'
import { toLocalDateKey } from '../rules/date.ts'

/** 存完一条之后调用：满 7 天没备份就弹提醒 */
const ReminderContext = createContext<() => Promise<void>>(async () => {})

const BUTTON = 'w-full rounded-lg py-3 text-base disabled:opacity-50'

export function BackupReminderProvider({ children }: { children: ReactNode }) {
  // undefined：不显示；null：从没备份过；数字：上次备份时间
  const [lastBackupAt, setLastBackupAt] = useState<number | null | undefined>(undefined)
  const backup = useBackupExport()

  const checkAfterSave = useCallback(async () => {
    const [last, first] = await Promise.all([getLastBackupAt(), db.saves.orderBy('createdAt').first()])
    if (shouldRemindBackup({ lastBackupAt: last, firstSaveAt: first?.createdAt ?? null, now: Date.now() })) {
      setLastBackupAt(last)
    }
  }, [])

  async function handleBackupNow() {
    if (await backup.start()) setLastBackupAt(undefined)
  }

  async function handleRetry() {
    if (await backup.retry()) setLastBackupAt(undefined)
  }

  return (
    <ReminderContext.Provider value={checkAfterSave}>
      {children}
      {lastBackupAt !== undefined && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 dark:bg-white/20">
          <div className="w-full rounded-2xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] dark:bg-black">
            <h2 className="text-lg font-semibold">该备份存档了</h2>
            <p className="mt-2 text-sm">
              {lastBackupAt === null ? '还没有备份过存档。' : `上次备份：${toLocalDateKey(lastBackupAt)}。`}
              存档只保存在这台手机的浏览器里，定期备份更安心。
            </p>
            {backup.message && <p className="mt-2 text-sm">{backup.message}</p>}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled={backup.busy}
                onClick={backup.pendingFile ? handleRetry : handleBackupNow}
                className={`${BUTTON} bg-black font-semibold text-white dark:bg-white dark:text-black`}
              >
                {backup.pendingFile ? '保存备份文件' : '现在备份'}
              </button>
              <button
                type="button"
                disabled={backup.busy}
                onClick={() => setLastBackupAt(undefined)}
                className={`${BUTTON} opacity-60`}
              >
                稍后
              </button>
            </div>
          </div>
        </div>
      )}
    </ReminderContext.Provider>
  )
}

export function useBackupReminder() {
  return useContext(ReminderContext)
}
