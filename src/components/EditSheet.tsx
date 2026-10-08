import { useEffect, useState } from 'react'
import { db } from '../db/db.ts'
import { updateSave } from '../db/saves.ts'
import { buildSaveChanges } from '../rules/edit.ts'
import { isLocked } from '../rules/lock.ts'
import type { Save } from '../types/models.ts'
import SaveForm, { type SaveFormValue } from './SaveForm.tsx'

interface Props {
  save: Save
  number: number
  onClose: () => void
}

async function loadInitial(save: Save): Promise<SaveFormValue> {
  const media = await db.media.where('saveId').equals(save.id).toArray()
  const byId = new Map(media.map((m) => [m.id, m]))
  const photos = save.photoIds.flatMap((id) => {
    const m = byId.get(id)
    return m ? [{ key: id, mediaId: id, url: URL.createObjectURL(m.thumbBlob ?? m.blob) }] : []
  })
  const audio = save.audioId ? byId.get(save.audioId) : undefined
  return {
    text: save.text ?? '',
    photos,
    recording: audio
      ? {
          blob: audio.blob,
          mimeType: audio.mimeType,
          durationMs: audio.durationMs ?? 0,
          url: URL.createObjectURL(audio.blob),
          mediaId: audio.id,
        }
      : null,
  }
}

export default function EditSheet({ save, number, onClose }: Props) {
  const [initial, setInitial] = useState<SaveFormValue | null>(null)

  useEffect(() => {
    let cancelled = false
    loadInitial(save).then((value) => {
      if (cancelled) {
        value.photos.forEach((p) => URL.revokeObjectURL(p.url))
        if (value.recording) URL.revokeObjectURL(value.recording.url)
      } else {
        setInitial(value)
      }
    })
    return () => {
      cancelled = true
    }
    // 只在打开时读一次；时间线刷新带来的新 save 对象不应清掉正在编辑的内容
  }, [save.id])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  async function handleSubmit({ text, photos, recording }: SaveFormValue): Promise<string | void> {
    if (isLocked(save.createdAt, Date.now())) return '存档已封存，不能再编辑'
    const changes = buildSaveChanges(save, {
      text,
      keptPhotoIds: photos.flatMap((p) => (p.mediaId ? [p.mediaId] : [])),
      newPhotos: photos.flatMap(({ photo }) =>
        photo ? [{ blob: photo.blob, thumbBlob: photo.thumbBlob, mimeType: photo.mimeType }] : [],
      ),
      keptAudioId: recording?.mediaId ?? null,
      newAudio:
        recording && !recording.mediaId
          ? { blob: recording.blob, mimeType: recording.mimeType, durationMs: recording.durationMs }
          : null,
    })
    await updateSave(save.id, changes)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-white px-4 pt-[calc(env(safe-area-inset-top)+1rem)] dark:bg-black"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">编辑存档点 #{number}</h2>
        <button type="button" onClick={onClose} className="px-2 py-1 text-sm opacity-60">
          取消
        </button>
      </header>
      {initial && (
        <SaveForm
          initial={initial}
          submitLabel="保存"
          footerClassName="sticky bottom-0 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
