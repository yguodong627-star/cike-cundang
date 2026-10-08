import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { db } from '../db/db.ts'
import { getLastBackupAt } from '../db/settings.ts'
import { exportBackup } from '../backup/exportBackup.ts'
import { shouldRemindBackup } from '../rules/backupReminder.ts'
import { toLocalDateKey } from '../rules/date.ts'

/** 存完一条之后调用：满 7 天没备份就弹提醒 */
const ReminderContext = createContext<() => Promise<void>>(async () => {})

const BUTTON = 'w-full rounded-lg py-3 text-base disabled:opacity-50'

export function BackupReminderProvider({ children }: { children: ReactNode }) {
  // undefined：不显示；null：从没备份过；数字：上次备份时间
  const [lastBackupAt, setLastBackupAt] = useState<number | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAfterSave = useCallback(async () => {
    const [last, first] = await Promise.all([getLastBackupAt(), db.saves.orderBy('createdAt').first()])
    if (shouldRemindBackup({ lastBackupAt: last, firstSaveAt: first?.createdAt ?? null, now: Date.now() })) {
      setError(null)
      setLastBackupAt(last)
    }
  }, [])

  async function handleBackupNow() {
    setBusy(true)
    try {
      await exportBackup()
      setLastBackupAt(undefined)
    } catch (e) {
      setError(`备份失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
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
            {error && <p className="mt-2 text-sm">{error}</p>}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled={busy}
                onClick={handleBackupNow}
                className={`${BUTTON} bg-black font-semibold text-white dark:bg-white dark:text-black`}
              >
                现在备份
              </button>
              <button
                type="button"
                disabled={busy}
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
