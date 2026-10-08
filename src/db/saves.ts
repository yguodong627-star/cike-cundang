import { db } from './db.ts'
import type { Media, Save } from '../types/models.ts'

export interface NewPhoto {
  blob: Blob
  thumbBlob: Blob
  mimeType: string
}

export interface NewAudio {
  blob: Blob
  mimeType: string
  durationMs: number
}

export interface NewSaveInput {
  text: string | null
  photos: NewPhoto[]
  audio: NewAudio | null
}

export interface SaveChanges {
  text?: string | null
  removePhotoIds?: string[]
  addPhotos?: NewPhoto[]
  /** 不传：语音不变；null：去掉语音；传新语音：替换 */
  audio?: NewAudio | null
}

function photoToMedia(saveId: string, photo: NewPhoto): Media {
  return {
    id: crypto.randomUUID(),
    saveId,
    kind: 'photo',
    blob: photo.blob,
    thumbBlob: photo.thumbBlob,
    mimeType: photo.mimeType,
  }
}

function audioToMedia(saveId: string, audio: NewAudio): Media {
  return {
    id: crypto.randomUUID(),
    saveId,
    kind: 'audio',
    blob: audio.blob,
    mimeType: audio.mimeType,
    durationMs: audio.durationMs,
  }
}

export async function addSave(input: NewSaveInput, now = Date.now()): Promise<Save> {
  const id = crypto.randomUUID()
  const photoMedia = input.photos.map((p) => photoToMedia(id, p))
  const audioMedia = input.audio ? audioToMedia(id, input.audio) : null

  const save: Save = {
    id,
    createdAt: now,
    updatedAt: now,
    text: input.text,
    photoIds: photoMedia.map((m) => m.id),
    audioId: audioMedia?.id ?? null,
  }

  await db.transaction('rw', db.saves, db.media, async () => {
    await db.media.bulkAdd(audioMedia ? [...photoMedia, audioMedia] : photoMedia)
    await db.saves.add(save)
  })
  return save
}

/** 按保存时间从早到晚排列 */
export async function getAllSaves(): Promise<Save[]> {
  return db.saves.orderBy('createdAt').toArray()
}

export async function updateSave(id: string, changes: SaveChanges, now = Date.now()): Promise<Save> {
  return db.transaction('rw', db.saves, db.media, async () => {
    const save = await db.saves.get(id)
    if (!save) throw new Error(`找不到存档 ${id}`)

    const removeIds = new Set(changes.removePhotoIds ?? [])
    const addedPhotos = (changes.addPhotos ?? []).map((p) => photoToMedia(id, p))
    const mediaToDelete = save.photoIds.filter((pid) => removeIds.has(pid))
    const mediaToAdd: Media[] = [...addedPhotos]

    let audioId = save.audioId
    if (changes.audio !== undefined) {
      if (save.audioId) mediaToDelete.push(save.audioId)
      if (changes.audio) {
        const audioMedia = audioToMedia(id, changes.audio)
        mediaToAdd.push(audioMedia)
        audioId = audioMedia.id
      } else {
        audioId = null
      }
    }

    const updated: Save = {
      ...save,
      text: changes.text !== undefined ? changes.text : save.text,
      photoIds: [...save.photoIds.filter((pid) => !removeIds.has(pid)), ...addedPhotos.map((m) => m.id)],
      audioId,
      updatedAt: now,
    }

    await db.media.bulkDelete(mediaToDelete)
    await db.media.bulkAdd(mediaToAdd)
    await db.saves.put(updated)
    return updated
  })
}

/** 删除存档，连同它的照片和语音 */
export async function deleteSave(id: string): Promise<void> {
  await db.transaction('rw', db.saves, db.media, async () => {
    await db.media.where('saveId').equals(id).delete()
    await db.saves.delete(id)
  })
}
