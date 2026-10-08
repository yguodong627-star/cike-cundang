import { NOT_BACKUP, parseBackup, type ParseResult } from './format.ts'
import { extractBackupFromHtml } from './html.ts'

/** 读取并检查备份文件；这一步只读不写，当前存档不受影响 */
export async function readBackupFile(file: Blob): Promise<ParseResult> {
  let text: string
  try {
    text = await file.text()
  } catch {
    return { ok: false, reason: NOT_BACKUP }
  }
  const data = extractBackupFromHtml(text)
  if (data === null) return { ok: false, reason: NOT_BACKUP }
  return parseBackup(data)
}
