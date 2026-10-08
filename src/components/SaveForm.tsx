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
}

function limitText(value: string): string {
  return [...value].slice(0, MAX_TEXT_LENGTH).join('')
}

export default function SaveForm({ initial, submitLabel, footerClassName, onSubmit }: Props) {
  const [text, setText] = useState(initial?.text ?? '')
  const [photos, setPhotos] = useState<PickedPhoto[]>(initial?.photos ?? [])
  const [recording, setRecording] = useState<Recording | null>(initial?.recording ?? null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const photosRef = useRef(photos)
  photosRef.current = photos
  const recordingRef = useRef(recording)
  recordingRef.current = recording
  useEffect(
    () => () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.url))
      if (recordingRef.current) URL.revokeObjectURL(recordingRef.current.url)
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <textarea
        value={text}
        onChange={(e) => {
          setText(limitText(e.target.value))
          setError(null)
        }}
        placeholder="此刻，你在想什么？"
        rows={5}
        className="mt-6 w-full resize-none rounded-lg border border-black/20 bg-transparent p-3 text-base outline-none focus:border-black dark:border-white/30 dark:focus:border-white"
      />
      <p className="mt-1 text-right text-xs opacity-50">
        {textLength(text)} / {MAX_TEXT_LENGTH}
      </p>
      <PhotoPicker
        photos={photos}
        onChange={(next) => {
          setPhotos(next)
          setError(null)
        }}
        onError={setError}
      />
      <AudioRecorder
        recording={recording}
        onChange={(next) => {
          setRecording(next)
          setError(null)
        }}
        onError={setError}
      />
      {error && <p className="mt-2 text-sm">{error}</p>}
      <div className={`-mx-4 mt-2 bg-white px-4 py-2 dark:bg-black ${footerClassName}`}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="w-full rounded-lg bg-black py-3 text-base font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {submitLabel}
        </button>
      </div>
    </>
  )
}
