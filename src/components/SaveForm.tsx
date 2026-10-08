import { useEffect, useRef, useState } from 'react'
import { MAX_TEXT_LENGTH } from '../rules/constants.ts'
import { textLength, validateSave } from '../rules/validate.ts'
import PhotoPicker, { type PickedPhoto } from './PhotoPicker.tsx'
import AudioRecorder, { type Recording } from './AudioRecorder.tsx'

export interface SaveFormValue {
  text: string
  photos: PickedPhoto[]
  recording: Recording | null
}

interface Props {
  initial?: SaveFormValue
  submitLabel: string
  /** 保存按钮所在那一条的样式（决定它吸在哪里） */
  footerClassName: string
  /** 返回字符串表示失败原因，会显示在按钮上方 */
  onSubmit: (value: SaveFormValue) => Promise<string | void>
  /** 内容每次变化时通知；表单卸载后才录完 / 处理完的内容也会通知 */
  onDraftChange?: (value: SaveFormValue) => void
  /** 卸载时回收照片和语音的临时网址；存档页要保留草稿，传 false */
  revokeOnUnmount?: boolean
}

export const SAVE_FAILED = '保存失败，请再试一次'

function limitText(value: string): string {
  return [...value].slice(0, MAX_TEXT_LENGTH).join('')
}

export function revokeFormUrls(value: SaveFormValue) {
  value.photos.forEach((p) => URL.revokeObjectURL(p.url))
  if (value.recording) URL.revokeObjectURL(value.recording.url)
}

export default function SaveForm({
  initial,
  submitLabel,
  footerClassName,
  onSubmit,
  onDraftChange,
  revokeOnUnmount = true,
}: Props) {
  const [text, setText] = useState(initial?.text ?? '')
  const [photos, setPhotos] = useState<PickedPhoto[]>(initial?.photos ?? [])
  const [recording, setRecording] = useState<Recording | null>(initial?.recording ?? null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [audioBusy, setAudioBusy] = useState(false)

  const latest = useRef<SaveFormValue>({ text, photos, recording })
  const draftRef = useRef(onDraftChange)
  draftRef.current = onDraftChange
  const revokeRef = useRef(revokeOnUnmount)
  revokeRef.current = revokeOnUnmount

  function update(patch: Partial<SaveFormValue>) {
    latest.current = { ...latest.current, ...patch }
    draftRef.current?.(latest.current)
    if (patch.text !== undefined) setText(patch.text)
    if (patch.photos !== undefined) setPhotos(patch.photos)
    if (patch.recording !== undefined) setRecording(patch.recording)
    setError(null)
  }

  useEffect(
    () => () => {
      if (revokeRef.current) revokeFormUrls(latest.current)
    },
    [],
  )

  async function handleSubmit() {
    const result = validateSave({
      text,
      photoCount: photos.length,
      audioDurationMs: recording ? recording.durationMs : null,
    })
    if (!result.ok) {
      setError(result.reason)
      return
    }
    setSaving(true)
    try {
      const failure = await onSubmit({ text, photos, recording })
      if (failure) setError(failure)
    } catch {
      setError(SAVE_FAILED)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <textarea
        value={text}
        onChange={(e) => update({ text: limitText(e.target.value) })}
        placeholder="此刻，你在想什么？"
        rows={5}
        className="mt-6 w-full resize-none rounded-lg border border-black/20 bg-transparent p-3 text-base outline-none focus:border-black dark:border-white/30 dark:focus:border-white"
      />
      <p className="mt-1 text-right text-xs opacity-50">
        {textLength(text)} / {MAX_TEXT_LENGTH}
      </p>
      <PhotoPicker
        photos={photos}
        onChange={(next) => update({ photos: next })}
        onError={setError}
        onBusyChange={setPhotoBusy}
      />
      <AudioRecorder
        recording={recording}
        onChange={(next) => update({ recording: next })}
        onError={setError}
        onBusyChange={setAudioBusy}
      />
      {error && <p className="mt-2 text-sm">{error}</p>}
      <div className={`-mx-4 mt-2 bg-white px-4 py-2 dark:bg-black ${footerClassName}`}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || photoBusy || audioBusy}
          className="w-full rounded-lg bg-black py-3 text-base font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {submitLabel}
        </button>
      </div>
    </>
  )
}
