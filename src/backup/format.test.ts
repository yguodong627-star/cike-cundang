import { describe, expect, it } from 'vitest'
import type { Media, Save } from '../types/models.ts'
import { buildBackup, FORMAT_VERSION, INCOMPLETE, NOT_BACKUP, parseBackup, TOO_NEW } from './format.ts'

const bytes = (...n: number[]) => new Uint8Array(n)

function sample(): { saves: Save[]; media: Media[] } {
  const saves: Save[] = [
    { id: 's1', createdAt: 1000, updatedAt: 1000, text: '只有文字 🙂', photoIds: [], audioId: null },
    { id: 's2', createdAt: 2000, updatedAt: 2500, text: null, photoIds: ['p1', 'p2'], audioId: null },
    { id: 's3', createdAt: 3000, updatedAt: 3000, text: '三样都有', photoIds: ['p3'], audioId: 'a1' },
  ]
  const media: Media[] = [
    { id: 'p1', saveId: 's2', kind: 'photo', mimeType: 'image/jpeg', blob: new Blob([bytes(1, 2, 3)], { type: 'image/jpeg' }), thumbBlob: new Blob([bytes(4)], { type: 'image/jpeg' }) },
    { id: 'p2', saveId: 's2', kind: 'photo', mimeType: 'image/jpeg', blob: new Blob([bytes(0, 255, 128)], { type: 'image/jpeg' }), thumbBlob: new Blob([bytes(5)], { type: 'image/jpeg' }) },
    { id: 'p3', saveId: 's3', kind: 'photo', mimeType: 'image/jpeg', blob: new Blob([new Uint8Array(100_000).fill(7)], { type: 'image/jpeg' }), thumbBlob: new Blob([bytes(6)], { type: 'image/jpeg' }) },
    { id: 'a1', saveId: 's3', kind: 'audio', mimeType: 'audio/mp4', blob: new Blob([bytes(9, 8, 7)], { type: 'audio/mp4' }), durationMs: 4200 },
  ]
  return { saves, media }
}

async function blobBytes(b: Blob | undefined) {
  return b ? [...new Uint8Array(await b.arrayBuffer())] : undefined
}

async function snapshot(media: Media[]) {
  return Promise.all(
    media.map(async (m) => ({
      id: m.id,
      saveId: m.saveId,
      kind: m.kind,
      mimeType: m.mimeType,
      durationMs: m.durationMs,
      blob: await blobBytes(m.blob),
      blobType: m.blob.type,
      thumb: await blobBytes(m.thumbBlob),
      thumbType: m.thumbBlob?.type,
    })),
  )
}

// 模拟真的写进文件再读出来
const throughJson = (v: unknown) => JSON.parse(JSON.stringify(v))

describe('备份数据', () => {
  it('打包后再解析，内容完全一致', async () => {
    const { saves, media } = sample()
    const backup = await buildBackup(saves, media, 9999)
    expect(backup.app).toBe('cike-cundang')
    expect(backup.formatVersion).toBe(FORMAT_VERSION)
    expect(backup.exportedAt).toBe(9999)

    const result = parseBackup(throughJson(backup))
    if (!result.ok) throw new Error(result.reason)
    expect(result.saves).toEqual(saves)
    expect(await snapshot(result.media)).toEqual(await snapshot(media))
  })

  it('空仓库也能打包和解析', async () => {
    const result = parseBackup(throughJson(await buildBackup([], [])))
    expect(result).toEqual({ ok: true, saves: [], media: [] })
  })

  it('不是此刻存档的数据 → 这不是此刻存档的备份文件', async () => {
    const backup = throughJson(await buildBackup([], []))
    expect(parseBackup({ ...backup, app: 'other-app' })).toEqual({ ok: false, reason: NOT_BACKUP })
    expect(parseBackup(null)).toEqual({ ok: false, reason: NOT_BACKUP })
    expect(parseBackup('hello')).toEqual({ ok: false, reason: NOT_BACKUP })
    expect(parseBackup({ saves: [], media: [] })).toEqual({ ok: false, reason: NOT_BACKUP })
  })

  it('版本比当前新 → 备份文件版本过新', async () => {
    const backup = throughJson(await buildBackup([], []))
    expect(parseBackup({ ...backup, formatVersion: FORMAT_VERSION + 1 })).toEqual({ ok: false, reason: TOO_NEW })
  })

  it('存档引用的照片找不到 → 备份文件不完整', async () => {
    const { saves, media } = sample()
    const backup = throughJson(await buildBackup(saves, media))
    backup.media = backup.media.filter((m: { id: string }) => m.id !== 'p2')
    expect(parseBackup(backup)).toEqual({ ok: false, reason: INCOMPLETE })
  })

  it('存档引用的语音找不到 → 备份文件不完整', async () => {
    const { saves, media } = sample()
    const backup = throughJson(await buildBackup(saves, media))
    backup.media = backup.media.filter((m: { id: string }) => m.id !== 'a1')
    expect(parseBackup(backup)).toEqual({ ok: false, reason: INCOMPLETE })
  })

  it('字段缺失或文件内容损坏 → 备份文件不完整', async () => {
    const { saves, media } = sample()
    const good = throughJson(await buildBackup(saves, media))

    const noSaves = { ...good, saves: undefined }
    expect(parseBackup(noSaves)).toEqual({ ok: false, reason: INCOMPLETE })

    const badSave = throughJson(good)
    delete badSave.saves[0].createdAt
    expect(parseBackup(badSave)).toEqual({ ok: false, reason: INCOMPLETE })

    const badData = throughJson(good)
    badData.media[0].data = '这不是 base64！'
    expect(parseBackup(badData)).toEqual({ ok: false, reason: INCOMPLETE })
  })
})
