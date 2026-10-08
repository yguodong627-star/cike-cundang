const PREFERRED_TYPES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']

export function pickAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return PREFERRED_TYPES.find((t) => MediaRecorder.isTypeSupported(t))
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
