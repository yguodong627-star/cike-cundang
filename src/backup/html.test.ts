import { describe, expect, it } from 'vitest'
import type { Media, Save } from '../types/models.ts'
import { buildBackup, parseBackup } from './format.ts'
import { backupFileName, extractBackupFromHtml, formatFileSize, renderBackupHtml } from './html.ts'

const at = (s: string) => new Date(s).getTime()

function sample(): { saves: Save[]; media: Media[] } {
  const big = new Uint8Array(50_000).map((_, i) => i % 251)
  return {
    saves: [
      { id: 's1', createdAt: at('2026-10-07T09:00:00'), updatedAt: at('2026-10-07T09:00:00'), text: '小心 </script> 和 <b>标签</b> & "引号"', photoIds: [], audioId: null },
      { id: 's2', createdAt: at('2026-10-08T08:30:00'), updatedAt: at('2026-10-08T08:30:00'), text: null, photoIds: ['p1', 'p2'], audioId: 'a1' },
    ],
    media: [
      { id: 'p1', saveId: 's2', kind: 'photo', mimeType: 'image/jpeg', blob: new Blob([big], { type: 'image/jpeg' }), thumbBlob: new Blob([new Uint8Array([1, 2])], { type: 'image/jpeg' }) },
      { id: 'p2', saveId: 's2', kind: 'photo', mimeType: 'image/jpeg', blob: new Blob([new Uint8Array([3, 4, 5])], { type: 'image/jpeg' }), thumbBlob: new Blob([new Uint8Array([6])], { type: 'image/jpeg' }) },
      { id: 'a1', saveId: 's2', kind: 'audio', mimeType: 'audio/mp4;codecs=opus', blob: new Blob([new Uint8Array([7, 8, 9])], { type: 'audio/mp4;codecs=opus' }), durationMs: 3000 },
    ],
  }
}

async function bytesOf(b?: Blob) {
  return b ? [...new Uint8Array(await b.arrayBuffer())] : undefined
}

describe('备份网页', () => {
  it('给人看的部分：编号、日期、时间、文字、照片、语音都在', async () => {
    const { saves, media } = sample()
    const html = renderBackupHtml(await buildBackup(saves, media, at('2026-10-08T20:00:00')))
    expect(html).toContain('存档点 #1')
    expect(html).toContain('存档点 #2')
    expect(html).toContain('2026 年 10 月 8 日')
    expect(html).toContain('08:30')
    expect(html).toContain('共 2 条存档')
    expect(html).toContain('<img id="m-p1" src="data:image/jpeg;base64,')
    expect(html).toContain('src="data:audio/mp4;base64,')
    expect(html.indexOf('存档点 #2')).toBeLessThan(html.indexOf('存档点 #1'))
  })

  it('文字里的尖括号被转义，不会变成页面元素或截断数据', async () => {
    const { saves, media } = sample()
    const html = renderBackupHtml(await buildBackup(saves, media))
    expect(html).toContain('&lt;b&gt;标签&lt;/b&gt;')
    expect(html).not.toContain('<b>标签</b>')
    expect(html.match(/<\/script>/g)).toHaveLength(1)
  })

  it('同一张照片在文件里只存一份', async () => {
    const { saves, media } = sample()
    const backup = await buildBackup(saves, media)
    const html = renderBackupHtml(backup)
    const p1 = backup.media.find((m) => m.id === 'p1')!.data
    expect(html.split(p1).length - 1).toBe(1)
  })

  it('从网页里取回后解析，内容与原来完全一致', async () => {
    const { saves, media } = sample()
    const html = renderBackupHtml(await buildBackup(saves, media))
    const result = parseBackup(extractBackupFromHtml(html))
    if (!result.ok) throw new Error(result.reason)
    expect(result.saves).toEqual(saves)
    for (const m of media) {
      const back = result.media.find((x) => x.id === m.id)!
      expect(await bytesOf(back.blob)).toEqual(await bytesOf(m.blob))
      expect(back.mimeType).toBe(m.mimeType)
      expect(await bytesOf(back.thumbBlob)).toEqual(await bytesOf(m.thumbBlob))
      expect(back.durationMs).toBe(m.durationMs)
    }
  })

  it('普通网页取不到备份数据', () => {
    expect(extractBackupFromHtml('<html><body>hello</body></html>')).toBeNull()
    expect(extractBackupFromHtml('')).toBeNull()
  })

  it('页面上的照片被删掉 → 备份文件不完整', async () => {
    const { saves, media } = sample()
    const html = renderBackupHtml(await buildBackup(saves, media)).replace(/<img id="m-p2"[^>]*>/, '')
    expect(parseBackup(extractBackupFromHtml(html))).toEqual({ ok: false, reason: '备份文件不完整' })
  })
})

describe('文件名和大小', () => {
  it('文件名带当天日期', () => {
    expect(backupFileName(at('2026-10-08T23:59:00'))).toBe('此刻存档备份-2026-10-08.html')
  })
  it('大小写成约多少', () => {
    expect(formatFileSize(300)).toBe('约 1 KB')
    expect(formatFileSize(37 * 1024)).toBe('约 37 KB')
    expect(formatFileSize(12.34 * 1024 * 1024)).toBe('约 12.3 MB')
  })
})
