import { lazy, Suspense, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.ts'
import { toLocalDateKey } from '../rules/date.ts'
import { isPersisted } from '../db/persist.ts'
import ImportBackup from '../components/ImportBackup.tsx'
import { BackupPending, useBackupExport } from '../components/useBackupExport.tsx'

// 用动态引入，部署版构建时整段被丢掉，不会打包进去
const DevTools = import.meta.env.DEV ? lazy(() => import('../dev/DevTools.tsx')) : null
const Diagnose = lazy(() => import('../dev/Diagnose.tsx'))

export default function SettingsPage() {
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const backup = useBackupExport()
  // 还在读：undefined；没有这一行：null
  const settings = useLiveQuery(async () => (await db.settings.get('app')) ?? null)

  useEffect(() => {
    isPersisted().then(setPersisted)
  }, [])

  return (
    <>
      <h1 className="text-2xl font-semibold">设置</h1>
      <section className="mt-6">
        <button
          type="button"
          onClick={backup.start}
          disabled={backup.busy}
          className="w-full rounded-lg bg-black py-3 text-base font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          备份存档
        </button>
        <p className="mt-2 text-sm">
          上次备份：{settings === undefined ? '…' : settings?.lastBackupAt ? toLocalDateKey(settings.lastBackupAt) : '还没有备份过'}
        </p>
        <BackupPending backup={backup} />
        <p className="mt-2 text-xs opacity-50">生成一个网页文件，保存到“文件”App，双击就能查看全部存档，也能用来读取存档。</p>
      </section>
      <ImportBackup backup={backup} />
      <p className="mt-8 text-sm">
        持久保存：{persisted === null ? '检查中…' : persisted ? '已开启' : '未开启'}
      </p>
      {DevTools && (
        <Suspense fallback={null}>
          <DevTools />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <Diagnose />
      </Suspense>
    </>
  )
}
