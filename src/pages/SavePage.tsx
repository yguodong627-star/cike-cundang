import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { addSave, getAllSaves } from '../db/saves.ts'
import { MAX_TEXT_LENGTH } from '../rules/constants.ts'
import { computeSaveNumbers } from '../rules/numbering.ts'
import { textLength, validateSave } from '../rules/validate.ts'
import { useToast } from '../components/Toast.tsx'
import PhotoPicker, { type PickedPhoto } from '../components/PhotoPicker.tsx'
import AudioRecorder, { type Recording } from '../components/AudioRecorder.tsx'

function limitText(value: string): string {
  return [...value].slice(0, MAX_TEXT_LENGTH).join('')
}

export default function SavePage() {
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState<PickedPhoto[]>([])
  const [recording, setRecording] = useState<Recording | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

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

  async function handleSave() {
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
      const trimmed = text.trim()
      const save = await addSave({
        text: trimmed || null,
        photos: photos.map(({ photo }) => ({ blob: photo.blob, thumbBlob: photo.thumbBlob, mimeType: photo.mimeType })),
        audio: recording
          ? { blob: recording.blob, mimeType: recording.mimeType, durationMs: recording.durationMs }
          : null,
      })
      const number = computeSaveNumbers(await getAllSaves()).get(save.id)
      setText('')
      toast(`已存档 · 存档点 #${number}`)
      navigate('/timeline')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">存档</h1>
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
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full rounded-lg bg-black py-3 text-base font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        保存此刻
      </button>
    </>
  )
}
