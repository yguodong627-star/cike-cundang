import type { NewAudio, NewPhoto, SaveChanges } from '../db/saves.ts'
import type { Save } from '../types/models.ts'

export interface EditDraft {
  text: string
  /** 编辑后还保留着的原有照片 */
  keptPhotoIds: string[]
  newPhotos: NewPhoto[]
  /** 原有语音还保留时填它的 id */
  keptAudioId: string | null
  newAudio: NewAudio | null
}

/** 把编辑界面的结果，换算成要对仓库做的改动 */
export function buildSaveChanges(original: Pick<Save, 'photoIds' | 'audioId'>, draft: EditDraft): SaveChanges {
  const kept = new Set(draft.keptPhotoIds)
  const changes: SaveChanges = {
    text: draft.text.trim() || null,
    removePhotoIds: original.photoIds.filter((id) => !kept.has(id)),
    addPhotos: draft.newPhotos,
  }

  if (draft.newAudio) changes.audio = draft.newAudio
  else if (original.audioId && draft.keptAudioId !== original.audioId) changes.audio = null

  return changes
}

export interface EditSnapshot {
  text: string
  /** 照片的标识，按显示顺序 */
  photoKeys: string[]
  /** 语音的标识；没有语音为 null */
  audioKey: string | null
}

/** 编辑界面里的内容和打开时相比有没有变化（点“取消”时决定要不要确认） */
export function isEditChanged(before: EditSnapshot, after: EditSnapshot): boolean {
  return (
    before.text !== after.text ||
    before.audioKey !== after.audioKey ||
    before.photoKeys.length !== after.photoKeys.length ||
    before.photoKeys.some((key, i) => key !== after.photoKeys[i])
  )
}
