import { MAX_AUDIO_MS, MAX_PHOTOS, MAX_TEXT_LENGTH } from './constants.ts'

export interface SaveDraft {
  text: string | null
  photoCount: number
  audioDurationMs: number | null
}

export type ValidationResult = { ok: true } | { ok: false; reason: string }

// 录音到 60 秒自动停止时，实际时长可能多出几十毫秒
const AUDIO_TOLERANCE_MS = 500

/** 按字符数计算（一个 emoji 算 1 个字） */
export function textLength(text: string): number {
  return [...text].length
}

export function validateSave(draft: SaveDraft): ValidationResult {
  const text = draft.text?.trim() ?? ''
  const hasText = text.length > 0
  const hasAudio = draft.audioDurationMs !== null

  if (!hasText && draft.photoCount === 0 && !hasAudio) {
    return { ok: false, reason: '至少需要一项内容' }
  }
  if (textLength(text) > MAX_TEXT_LENGTH) {
    return { ok: false, reason: `文字最多 ${MAX_TEXT_LENGTH} 字` }
  }
  if (draft.photoCount > MAX_PHOTOS) {
    return { ok: false, reason: `照片最多 ${MAX_PHOTOS} 张` }
  }
  if (hasAudio && draft.audioDurationMs! > MAX_AUDIO_MS + AUDIO_TOLERANCE_MS) {
    return { ok: false, reason: '语音最长 1 分钟' }
  }
  return { ok: true }
}
