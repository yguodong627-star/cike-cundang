import { useEffect, useRef, useState } from 'react'
import { MAX_AUDIO_MS } from '../rules/constants.ts'
import { formatDuration, pickAudioMimeType } from '../media/recorder.ts'

export interface Recording {
  blob: Blob
  mimeType: string
  durationMs: number
  url: string
  /** 编辑时，存档里原有的语音 */
  mediaId?: string
}

interface Props {
  recording: Recording | null
  onChange: (recording: Recording | null) => void
  onError: (message: string) => void
}

export default function AudioRecorder({ recording, onChange, onError }: Props) {
  const [recordingNow, setRecordingNow] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const autoStopRef = useRef<number | null>(null)

  function clearTimers() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    if (autoStopRef.current !== null) window.clearTimeout(autoStopRef.current)
    timerRef.current = null
    autoStopRef.current = null
  }

  function cleanup() {
    clearTimers()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(
    () => () => {
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.ondataavailable = null
        recorder.onstop = null
        recorder.stop()
      }
      cleanup()
    },
    [],
  )

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onError('当前浏览器无法录音')
      return
    }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      const denied = e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')
      onError(denied ? '需要麦克风权限才能录音' : '无法录音，请检查麦克风')
      return
    }

    const mimeType = pickAudioMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    const chunks: Blob[] = []
    const startedAt = performance.now()

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.onstop = () => {
      const durationMs = Math.min(Math.round(performance.now() - startedAt), MAX_AUDIO_MS)
      cleanup()
      recorderRef.current = null
      setRecordingNow(false)
      const type = recorder.mimeType || mimeType || 'audio/mp4'
      const blob = new Blob(chunks, { type })
      if (recording) URL.revokeObjectURL(recording.url)
      onChange({ blob, mimeType: type, durationMs, url: URL.createObjectURL(blob) })
    }

    streamRef.current = stream
    recorderRef.current = recorder
    recorder.start()
    setElapsedMs(0)
    setRecordingNow(true)
    timerRef.current = window.setInterval(() => {
      setElapsedMs(Math.min(performance.now() - startedAt, MAX_AUDIO_MS))
    }, 200)
    autoStopRef.current = window.setTimeout(stop, MAX_AUDIO_MS)
  }

  function stop() {
    clearTimers()
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }

  function remove() {
    if (recording) URL.revokeObjectURL(recording.url)
    onChange(null)
  }

  return (
    <div className="mt-4">
      {recording && !recordingNow && (
        <div className="mb-3 flex items-center gap-2">
          <audio src={recording.url} controls className="min-w-0 flex-1" />
          <button type="button" onClick={remove} className="shrink-0 px-2 text-sm opacity-60">
            删除语音
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={recordingNow ? stop : start}
        className="w-full rounded-lg border border-black/20 py-2.5 text-sm dark:border-white/30"
      >
        {recordingNow
          ? `停止录音（${formatDuration(elapsedMs)} / ${formatDuration(MAX_AUDIO_MS)}）`
          : recording
            ? '重新录音'
            : '录音'}
      </button>
    </div>
  )
}
