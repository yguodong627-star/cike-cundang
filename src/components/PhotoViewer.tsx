import { useEffect, useRef, useState } from 'react'
import { useObjectUrl } from '../media/useObjectUrl.ts'
import type { Media } from '../types/models.ts'

const SWIPE_PX = 50

interface Props {
  photos: Media[]
  startIndex: number
  onClose: () => void
}

export default function PhotoViewer({ photos, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)
  const url = useObjectUrl(photos[index]?.blob)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const hasPrev = index > 0
  const hasNext = index < photos.length - 1
  const prev = () => hasPrev && setIndex(index - 1)
  const next = () => hasNext && setIndex(index + 1)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-black text-white"
      onTouchStart={(e) => {
        const t = e.touches[0]
        touchStart.current = { x: t.clientX, y: t.clientY }
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current
        touchStart.current = null
        if (!start) return
        const t = e.changedTouches[0]
        const dx = t.clientX - start.x
        const dy = t.clientY - start.y
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > SWIPE_PX) prev()
          else if (dx < -SWIPE_PX) next()
        } else if (dy > SWIPE_PX * 2) {
          onClose()
        }
      }}
    >
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <span className="text-sm opacity-70">
          {index + 1} / {photos.length}
        </span>
        <button type="button" onClick={onClose} className="px-2 py-1 text-sm">
          关闭
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {url && <img src={url} alt="" className="max-h-full max-w-full object-contain" />}
        {hasPrev && (
          <button
            type="button"
            aria-label="上一张"
            onClick={prev}
            className="absolute inset-y-0 left-0 w-1/4"
          />
        )}
        {hasNext && (
          <button
            type="button"
            aria-label="下一张"
            onClick={next}
            className="absolute inset-y-0 right-0 w-1/4"
          />
        )}
      </div>
      <div className="pb-[calc(env(safe-area-inset-bottom)+1rem)]" />
    </div>
  )
}
