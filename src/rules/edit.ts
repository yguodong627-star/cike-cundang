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
