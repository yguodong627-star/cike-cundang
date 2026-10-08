import { lazy, Suspense, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.ts'
import { toLocalDateKey } from '../rules/date.ts'
import { isPersisted } from '../db/persist.ts'
import { exportBackup } from '../backup/exportBackup.ts'
import { formatFileSize } from '../backup/html.ts'
import ImportBackup from '../components/ImportBackup.tsx'

// 用动态引入，部署版构建时整段被丢掉，不会打包进去
const DevTools = import.meta.env.DEV ? lazy(() => import('../dev/DevTools.tsx')) : null

export default function SettingsPage() {
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [exporting, setExporting] = useState(false)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  // 还在读：undefined；没有这一行：null
  const settings = useLiveQuery(async () => (await db.settings.get('app')) ?? null)

  useEffect(() => {
    isPersisted().then(setPersisted)
  }, [])

  async function handleExport() {
    setExporting(true)
    setBackupMessage('正在生成备份…')
    try {
      const { fileName, sizeBytes } = await exportBackup()
      setBackupMessage(`已生成 ${fileName}（${formatFileSize(sizeBytes)}）`)
    } catch (e) {
      setBackupMessage(`备份失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">设置</h1>
      <section className="mt-6">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="w-full rounded-lg bg-black py-3 text-base font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          备份存档
        </button>
        <p className="mt-2 text-sm">
          上次备份：{settings === undefined ? '…' : settings?.lastBackupAt ? toLocalDateKey(settings.lastBackupAt) : '还没有备份过'}
        </p>
        {backupMessage && <p className="mt-1 text-sm">{backupMessage}</p>}
        <p className="mt-2 text-xs opacity-50">生成一个网页文件，双击就能查看全部存档，也能用来读取存档。</p>
      </section>
      <ImportBackup onBackupFirst={handleExport} />
      <p className="mt-8 text-sm">
        持久保存：{persisted === null ? '检查中…' : persisted ? '已开启' : '未开启'}
      </p>
      {DevTools && (
        <Suspense fallback={null}>
          <DevTools />
        </Suspense>
      )}
    </>
  )
}
