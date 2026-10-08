import { db } from '../db/db.ts'
import { setLastBackupAt } from '../db/settings.ts'
import { buildBackup } from './format.ts'
import { backupFileName, renderBackupHtml } from './html.ts'

/** 把全部存档做成备份网页文件 */
export async function createBackupFile(now = Date.now()): Promise<File> {
  const [saves, media] = await Promise.all([db.saves.orderBy('createdAt').toArray(), db.media.toArray()])
  const html = renderBackupHtml(await buildBackup(saves, media, now))
  return new File([html], backupFileName(now), { type: 'text/html' })
}

/** saved：已交给系统保存；cancelled：用户关掉了分享面板；needsTap：要用户再点一次按钮才能打开分享面板 */
export type SaveOutcome = 'saved' | 'cancelled' | 'needsTap'

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
 * 把备份文件交给系统保存，保存成功才记下备份时间。
 * 分享面板必须在用户刚点完按钮时打开，所以这里在第一个 await 之前就调用 share。
 */
export async function saveBackupFile(file: File): Promise<SaveOutcome> {
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file] })
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      if (e instanceof DOMException && e.name === 'NotAllowedError') return 'needsTap'
      download(file)
    }
  } else {
    download(file)
  }
  await setLastBackupAt(Date.now())
  return 'saved'
}
