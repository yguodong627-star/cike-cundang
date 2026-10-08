import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import PhotoViewer from './PhotoViewer.tsx'
import { db } from '../db/db.ts'
import { useObjectUrl } from '../media/useObjectUrl.ts'
import { formatTime } from '../rules/timeline.ts'
import type { Media, Save } from '../types/models.ts'

function Thumb({ media, onOpen }: { media: Media; onOpen: () => void }) {
  const url = useObjectUrl(media.thumbBlob ?? media.blob)
  return (
    <button
      type="button"
      aria-label="查看大图"
      onClick={onOpen}
      className="aspect-square overflow-hidden rounded-md bg-black/5 dark:bg-white/10"
    >
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
    </button>
  )
}

function AudioPlayer({ media }: { media: Media }) {
  const url = useObjectUrl(media.blob)
  return url ? <audio src={url} controls preload="metadata" className="mt-3 w-full" /> : null
}

interface Props {
  save: Save
  number: number
}

export default function SaveCard({ save, number }: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const media = useLiveQuery(() => db.media.where('saveId').equals(save.id).toArray(), [save.id, save.updatedAt])
  const byId = new Map((media ?? []).map((m) => [m.id, m]))
  const photos = save.photoIds.map((id) => byId.get(id)).filter((m): m is Media => !!m)
  const audio = save.audioId ? byId.get(save.audioId) : undefined

  return (
    <article className="rounded-xl border border-black/15 p-4 dark:border-white/20">
      <header className="flex items-baseline justify-between">
        <h3 className="font-semibold">存档点 #{number}</h3>
        <time className="text-xs opacity-50">{formatTime(save.createdAt)}</time>
      </header>
      {save.text && <p className="mt-2 whitespace-pre-wrap break-words">{save.text}</p>}
      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {photos.map((m, i) => (
            <Thumb key={m.id} media={m} onOpen={() => setViewerIndex(i)} />
          ))}
        </div>
      )}
      {audio && <AudioPlayer media={audio} />}
      {viewerIndex !== null && (
        <PhotoViewer photos={photos} startIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </article>
  )
}
