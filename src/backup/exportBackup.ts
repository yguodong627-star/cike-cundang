import { db } from '../db/db.ts'
import { buildBackup } from './format.ts'
import { backupFileName, renderBackupHtml } from './html.ts'

export interface ExportResult {
  fileName: string
  sizeBytes: number
}

/** 把全部存档做成备份网页并下载 */
export async function exportBackup(now = Date.now()): Promise<ExportResult> {
  const [saves, media] = await Promise.all([db.saves.orderBy('createdAt').toArray(), db.media.toArray()])
  const html = renderBackupHtml(await buildBackup(saves, media, now))
  const file = new Blob([html], { type: 'text/html' })
  const fileName = backupFileName(now)

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Safari 需要一点时间才开始读文件，马上回收会下载失败
  window.setTimeout(() => URL.revokeObjectURL(url), 60 * 1000)

  return { fileName, sizeBytes: file.size }
}
