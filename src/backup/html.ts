import { computeSaveNumbers } from '../rules/numbering.ts'
import { toLocalDateKey } from '../rules/date.ts'
import { formatDateHeading, formatTime, groupSavesByDay } from '../rules/timeline.ts'
import type { BackupData, BackupMedia } from './format.ts'

const DATA_SCRIPT_ID = 'cike-backup-data'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const elementId = (mediaId: string) => `m-${mediaId}`
// 去掉 "audio/mp4;codecs=opus" 这类参数，数据网址里只放基本类型
const dataUrl = (m: BackupMedia) => `data:${m.mimeType.split(';')[0]};base64,${m.data}`

const STYLE = `
:root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif; color: #000; background: #fff; }
@media (prefers-color-scheme: dark) { :root { color: #fff; background: #000; } article { border-color: rgba(255,255,255,.2) !important; } }
body { max-width: 640px; margin: 0 auto; padding: 24px 16px 48px; }
h1 { font-size: 24px; margin: 0; }
.meta { font-size: 13px; opacity: .6; margin-top: 6px; }
h2 { font-size: 14px; font-weight: normal; opacity: .6; margin: 28px 0 8px; }
article { border: 1px solid rgba(0,0,0,.15); border-radius: 12px; padding: 16px; margin-bottom: 12px; }
header { display: flex; justify-content: space-between; align-items: baseline; }
h3 { font-size: 16px; margin: 0; }
time { font-size: 12px; opacity: .5; }
p { margin: 8px 0 0; white-space: pre-wrap; word-break: break-word; }
.photos { display: grid; gap: 6px; margin-top: 12px; }
.photos img { width: 100%; border-radius: 6px; display: block; }
audio { width: 100%; margin-top: 12px; }
`

/**
 * 生成备份网页：上面是给人看的存档列表，照片和语音直接嵌在页面里；
 * 底部藏着给机器读的数据。为了不让文件里同一张照片存两份，
 * 机器数据里的照片和语音只记“在页面哪个元素上”，读取时再从页面取回。
 */
export function renderBackupHtml(backup: BackupData): string {
  const numbers = computeSaveNumbers(backup.saves)
  const mediaById = new Map(backup.media.map((m) => [m.id, m]))
  const shown = new Set<string>()

  const cards = groupSavesByDay(backup.saves)
    .map((group) => {
      const items = group.saves
        .map((save) => {
          const photos = save.photoIds.flatMap((id) => {
            const m = mediaById.get(id)
            if (!m) return []
            shown.add(id)
            return [`<img id="${elementId(id)}" src="${dataUrl(m)}" alt="">`]
          })
          const audio = save.audioId ? mediaById.get(save.audioId) : undefined
          if (audio) shown.add(audio.id)
          return [
            '<article>',
            `<header><h3>存档点 #${numbers.get(save.id)}</h3><time>${formatTime(save.createdAt)}</time></header>`,
            save.text ? `<p>${escapeHtml(save.text)}</p>` : '',
            photos.length ? `<div class="photos">${photos.join('')}</div>` : '',
            audio ? `<audio id="${elementId(audio.id)}" controls preload="metadata" src="${dataUrl(audio)}"></audio>` : '',
            '</article>',
          ].join('')
        })
        .join('\n')
      return `<h2>${formatDateHeading(group.dateKey)}</h2>\n${items}`
    })
    .join('\n')

  const machine = {
    ...backup,
    media: backup.media.map((m) => (shown.has(m.id) ? { ...m, data: undefined, ref: elementId(m.id) } : m)),
  }
  // 防止文字里出现 "</script>" 把数据块提前截断
  const json = JSON.stringify(machine).replace(/</g, '\\u003c')
  const exported = new Date(backup.exportedAt)

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>此刻存档备份 ${toLocalDateKey(backup.exportedAt)}</title>
<style>${STYLE}</style>
</head>
<body>
<h1>此刻存档备份</h1>
<div class="meta">备份于 ${formatDateHeading(toLocalDateKey(backup.exportedAt))} ${formatTime(exported.getTime())} · 共 ${backup.saves.length} 条存档</div>
${backup.saves.length ? cards : '<p>还没有存档</p>'}
<script type="application/json" id="${DATA_SCRIPT_ID}">${json}</script>
</body>
</html>
`
}

/** 从备份网页里取回备份数据（照片和语音从页面元素上取回）；不是备份网页时返回 null */
export function extractBackupFromHtml(html: string): unknown {
  const match = html.match(new RegExp(`<script type="application/json" id="${DATA_SCRIPT_ID}">([\\s\\S]*?)</script>`))
  if (!match) return null
  let data: unknown
  try {
    data = JSON.parse(match[1])
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null || !Array.isArray((data as { media?: unknown }).media)) return data

  const sources = new Map<string, string>()
  for (const m of html.matchAll(/<(?:img|audio) id="([^"]+)"[^>]*? src="data:[^"]*?;base64,([^"]*)"/g)) {
    sources.set(m[1], m[2])
  }
  const media = (data as { media: Record<string, unknown>[] }).media.map((m) => {
    if (typeof m?.ref !== 'string') return m
    const { ref, ...rest } = m
    const found = sources.get(ref)
    return found === undefined ? rest : { ...rest, data: found }
  })
  return { ...data, media }
}

export function backupFileName(now: number): string {
  return `此刻存档备份-${toLocalDateKey(now)}.html`
}

/** 文件大小写成“约 12.3 MB”这样 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `约 ${Math.max(1, Math.round(bytes / 1024))} KB`
  return `约 ${(bytes / 1024 / 1024).toFixed(1)} MB`
}
