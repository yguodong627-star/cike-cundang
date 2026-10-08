import { useRef, useState } from 'react'
import { db } from '../db/db.ts'
import { replaceAllData } from '../db/saves.ts'
import { readBackupFile } from '../backup/importBackup.ts'
import type { Media, Save } from '../types/models.ts'
import { BackupPending, type BackupExport } from './useBackupExport.tsx'

interface Props {
  /** “先备份当前存档”用的备份流程，和设置页的“备份存档”共用 */
  backup: BackupExport
}

interface Pending {
  saves: Save[]
  media: Media[]
  currentCount: number
}

const BUTTON = 'w-full rounded-lg py-3 text-base disabled:opacity-50'

export default function ImportBackup({ backup }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // 顺序固定：先读文件 → 检查 → 弹窗确认 → 清空并写入（技术文档 2.6）
  async function handleFile(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = ''
    if (!file) return
    setMessage('正在读取…')
    const result = await readBackupFile(file)
    if (!result.ok) {
      setMessage(result.reason)
      return
    }
    setMessage(null)
    setPending({ saves: result.saves, media: result.media, currentCount: await db.saves.count() })
  }

  async function handleConfirm() {
    if (!pending) return
    setBusy(true)
    try {
      await replaceAllData(pending.saves, pending.media)
      setMessage(`已读取存档：共 ${pending.saves.length} 条`)
      setPending(null)
    } catch (e) {
      setMessage(`读取失败，当前存档没有变化：${e instanceof Error ? e.message : String(e)}`)
      setPending(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-6">
      <input
        ref={inputRef}
        type="file"
        accept=".html,text/html"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`${BUTTON} border border-black/20 dark:border-white/30`}
      >
        读取存档
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
      <p className="mt-2 text-xs opacity-50">选择之前备份的网页文件，用它替换当前全部存档。</p>

      {pending && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 dark:bg-white/20">
          <div className="w-full rounded-2xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] dark:bg-black">
            <h2 className="text-lg font-semibold">读取存档</h2>
            <p className="mt-2 text-sm">
              当前的 {pending.currentCount} 条存档会被备份里的 {pending.saves.length} 条全部替换，替换后无法恢复。
            </p>
            <BackupPending backup={backup} />
            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled={busy || backup.busy}
                onClick={backup.start}
                className={`${BUTTON} border border-black/20 dark:border-white/30`}
              >
                先备份当前存档
              </button>
              <button
                type="button"
                disabled={busy || backup.busy}
                onClick={handleConfirm}
                className={`${BUTTON} bg-black font-semibold text-white dark:bg-white dark:text-black`}
              >
                确认覆盖
              </button>
              <button type="button" disabled={busy} onClick={() => setPending(null)} className={`${BUTTON} opacity-60`}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
