import { db } from '../db/db.ts'
import { setLastBackupAt } from '../db/settings.ts'
import { buildBackup } from './format.ts'
import { backupFileName, renderBackupHtml } from './html.ts'

/** 备份文件超过这个大小时提醒：打开会变慢，再大可能生成不了（技术文档坑 8） */
export const LARGE_BACKUP_BYTES = 100 * 1024 * 1024

/** 把全部存档做成备份网页文件；存档和照片语音在同一次读取里取出，保证前后一致 */
export async function createBackupFile(now = Date.now()): Promise<File> {
  const [saves, media] = await db.transaction('r', db.saves, db.media, () =>
    Promise.all([db.saves.orderBy('createdAt').toArray(), db.media.toArray()]),
  )
  const html = renderBackupHtml(await buildBackup(saves, media, now))
  return new File([html], backupFileName(now), { type: 'text/html' })
}

/**
 * shared：已交给分享面板（无法知道用户选了哪一项）；downloaded：电脑上已下载；
 * cancelled：用户关掉了分享面板；needsTap：要用户再点一次按钮才能打开分享面板；failed：分享面板打不开
 */
export type SaveOutcome = 'shared' | 'downloaded' | 'cancelled' | 'needsTap' | 'failed'

// iPhone 上下载网页文件会被直接打开而不是保存，只能走系统分享面板里的“存储到文件”
function canShareFile(file: File): boolean {
  return (
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] }) &&
    window.matchMedia('(pointer: coarse)').matches
  )
}

function download(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Safari 需要一点时间才开始读文件，马上回收会下载失败
  window.setTimeout(() => URL.revokeObjectURL(url), 60 * 1000)
}

/**
 * 把备份文件交给系统保存，交出去了才记下备份时间。
 * 分享面板必须在用户刚点完按钮时打开，所以这里在第一个 await 之前就调用 share。
 */
export async function saveBackupFile(file: File): Promise<SaveOutcome> {
  let outcome: SaveOutcome
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file] })
      outcome = 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      if (e instanceof DOMException && e.name === 'NotAllowedError') return 'needsTap'
      return 'failed'
    }
  } else {
    download(file)
    outcome = 'downloaded'
  }
  await setLastBackupAt(Date.now())
  return outcome
}
