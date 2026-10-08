import type { Media, MediaKind, Save } from '../types/models.ts'

export const BACKUP_APP = 'cike-cundang'
export const FORMAT_VERSION = 1

export interface BackupMedia {
  id: string
  saveId: string
  kind: MediaKind
  mimeType: string
  /** 文件内容（base64） */
  data: string
  thumbData?: string
  thumbMimeType?: string
  durationMs?: number
}

export interface BackupData {
  app: typeof BACKUP_APP
  formatVersion: number
  exportedAt: number
  saves: Save[]
  media: BackupMedia[]
}

export type ParseResult = { ok: true; saves: Save[]; media: Media[] } | { ok: false; reason: string }

export const NOT_BACKUP = '这不是此刻存档的备份文件'
export const TOO_NEW = '备份文件版本过新'
export const INCOMPLETE = '备份文件不完整'

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

function base64ToBlob(data: string, type: string): Blob {
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

/** 把全部存档打包成备份数据 */
export async function buildBackup(saves: Save[], media: Media[], now = Date.now()): Promise<BackupData> {
  const packed: BackupMedia[] = []
  for (const m of media) {
    const item: BackupMedia = {
      id: m.id,
      saveId: m.saveId,
      kind: m.kind,
      mimeType: m.mimeType,
      data: await blobToBase64(m.blob),
    }
    if (m.thumbBlob) {
      item.thumbData = await blobToBase64(m.thumbBlob)
      item.thumbMimeType = m.thumbBlob.type || 'image/jpeg'
    }
    if (m.durationMs !== undefined) item.durationMs = m.durationMs
    packed.push(item)
  }
  return {
    app: BACKUP_APP,
    formatVersion: FORMAT_VERSION,
    exportedAt: now,
    saves: saves.map((s) => ({ ...s, photoIds: [...s.photoIds] })),
    media: packed,
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isString = (v: unknown): v is string => typeof v === 'string'
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function isValidSave(v: unknown): v is Save {
  return (
    isObject(v) &&
    isString(v.id) &&
    isNumber(v.createdAt) &&
    isNumber(v.updatedAt) &&
    (v.text === null || isString(v.text)) &&
    Array.isArray(v.photoIds) &&
    v.photoIds.every(isString) &&
    (v.audioId === null || isString(v.audioId))
  )
}

function isValidMedia(v: unknown): v is BackupMedia {
  return (
    isObject(v) &&
    isString(v.id) &&
    isString(v.saveId) &&
    (v.kind === 'photo' || v.kind === 'audio') &&
    isString(v.mimeType) &&
    isString(v.data) &&
    (v.thumbData === undefined || isString(v.thumbData)) &&
    (v.durationMs === undefined || isNumber(v.durationMs))
  )
}

/** 解析备份数据并检查是否完整；只要有一处不对就整体失败，不返回半份数据 */
export function parseBackup(raw: unknown): ParseResult {
  if (!isObject(raw) || raw.app !== BACKUP_APP || !isNumber(raw.formatVersion)) {
    return { ok: false, reason: NOT_BACKUP }
  }
  if (raw.formatVersion > FORMAT_VERSION) return { ok: false, reason: TOO_NEW }
  if (!Array.isArray(raw.saves) || !Array.isArray(raw.media)) return { ok: false, reason: INCOMPLETE }
  if (!raw.saves.every(isValidSave) || !raw.media.every(isValidMedia)) return { ok: false, reason: INCOMPLETE }

  const saves = raw.saves as Save[]
  const packed = raw.media as BackupMedia[]
  const mediaById = new Map(packed.map((m) => [m.id, m]))
  const belongs = (id: string, saveId: string, kind: MediaKind) => {
    const m = mediaById.get(id)
    return !!m && m.saveId === saveId && m.kind === kind
  }
  for (const s of saves) {
    if (!s.photoIds.every((id) => belongs(id, s.id, 'photo'))) return { ok: false, reason: INCOMPLETE }
    if (s.audioId !== null && !belongs(s.audioId, s.id, 'audio')) return { ok: false, reason: INCOMPLETE }
  }

  let media: Media[]
  try {
    media = packed.map((m) => {
      const item: Media = {
        id: m.id,
        saveId: m.saveId,
        kind: m.kind,
        mimeType: m.mimeType,
        blob: base64ToBlob(m.data, m.mimeType),
      }
      if (m.thumbData !== undefined) item.thumbBlob = base64ToBlob(m.thumbData, m.thumbMimeType ?? 'image/jpeg')
      if (m.durationMs !== undefined) item.durationMs = m.durationMs
      return item
    })
  } catch {
    return { ok: false, reason: INCOMPLETE }
  }

  return {
    ok: true,
    saves: saves.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      text: s.text,
      photoIds: [...s.photoIds],
      audioId: s.audioId,
    })),
    media,
  }
}
