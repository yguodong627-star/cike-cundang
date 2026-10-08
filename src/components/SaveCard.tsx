import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.ts'
import { useObjectUrl } from '../media/useObjectUrl.ts'
import { formatTime } from '../rules/timeline.ts'
import type { Media, Save } from '../types/models.ts'

function Thumb({ media }: { media: Media }) {
  const url = useObjectUrl(media.thumbBlob ?? media.blob)
  return (
    <div className="aspect-square overflow-hidden rounded-md bg-black/5 dark:bg-white/10">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
    </div>
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
          {photos.map((m) => (
            <Thumb key={m.id} media={m} />
          ))}
        </div>
      )}
      {audio && <AudioPlayer media={audio} />}
    </article>
  )
}
