import { useState } from 'react'
import { createBackupFile, saveBackupFile } from '../backup/exportBackup.ts'
import { formatFileSize } from '../backup/html.ts'

export interface BackupExport {
  busy: boolean
  message: string | null
  /** 已生成、还没保存的备份文件 */
  pendingFile: File | null
  /** 生成并保存；返回是否已保存 */
  start: () => Promise<boolean>
  /** 保存已生成的文件，必须直接在按钮点击里调用 */
  retry: () => Promise<boolean>
}

export function useBackupExport(): BackupExport {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  async function deliver(file: File): Promise<boolean> {
    const outcome = await saveBackupFile(file)
    const size = formatFileSize(file.size)
    if (outcome === 'saved') {
      setPendingFile(null)
      setMessage(`已备份 ${file.name}（${size}）`)
      return true
    }
    setPendingFile(file)
    setMessage(outcome === 'cancelled' ? `还没保存（${size}），可以再点下面的按钮保存` : `备份文件已生成（${size}），点下面的按钮保存`)
    return false
  }

  async function run(task: () => Promise<boolean>): Promise<boolean> {
    setBusy(true)
    try {
      return await task()
    } catch (e) {
      setMessage(`备份失败：${e instanceof Error ? e.message : String(e)}`)
      return false
    } finally {
      setBusy(false)
    }
  }

  return {
    busy,
    message,
    pendingFile,
    start: () =>
      run(async () => {
        setMessage('正在生成备份…')
        return deliver(await createBackupFile())
      }),
    retry: () => (pendingFile ? run(() => deliver(pendingFile)) : Promise.resolve(false)),
  }
}

export function BackupPending({ backup }: { backup: BackupExport }) {
  return (
    <>
      {backup.message && <p className="mt-2 text-sm">{backup.message}</p>}
      {backup.pendingFile && (
        <button
          type="button"
          disabled={backup.busy}
          onClick={backup.retry}
          className="mt-2 w-full rounded-lg border border-black/20 py-3 text-base font-semibold disabled:opacity-50 dark:border-white/30"
        >
          保存备份文件
        </button>
      )}
    </>
  )
}
