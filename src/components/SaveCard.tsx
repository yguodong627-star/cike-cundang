import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import PhotoViewer from './PhotoViewer.tsx'
import { useNearViewport } from './useNearViewport.ts'
import { db } from '../db/db.ts'
import { deleteSave } from '../db/saves.ts'
import { isLocked } from '../rules/lock.ts'
import { useObjectUrl } from '../media/useObjectUrl.ts'
import { formatTime } from '../rules/timeline.ts'
import type { Media, Save } from '../types/models.ts'

const THUMB_BOX = 'aspect-square overflow-hidden rounded-md bg-black/5 dark:bg-white/10'

function Thumb({ media, onOpen }: { media: Media; onOpen: () => void }) {
  const url = useObjectUrl(media.thumbBlob)
  return (
    <button type="button" aria-label="查看大图" onClick={onOpen} className={THUMB_BOX}>
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
    </button>
  )
}

function AudioPlayer({ media }: { media: Media }) {
  const url = useObjectUrl(media.blob)
  return url ? <audio src={url} controls preload="metadata" className="h-full w-full" /> : null
}

interface Props {
  save: Save
  number: number
  now: number
}

export default function SaveCard({ save, number, now }: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const ref = useRef<HTMLElement>(null)
  // 离屏幕远的卡片不读照片和语音，避免存档多了以后手机内存吃紧（技术文档坑 10）
  const active = useNearViewport(ref) || viewerIndex !== null
  const media = useLiveQuery(
    () => (active ? db.media.where('saveId').equals(save.id).toArray() : []),
    [active, save.id, save.updatedAt],
  )
  const byId = new Map((media ?? []).map((m) => [m.id, m]))
  const photos = save.photoIds.map((id) => byId.get(id)).filter((m): m is Media => !!m)
  const audio = save.audioId ? byId.get(save.audioId) : undefined
  const locked = isLocked(save.createdAt, now)

  async function handleDiscard() {
    if (!window.confirm(`放弃存档点 #${number}？\n放弃后无法恢复，后面的存档编号会往前补位。`)) return
    if (isLocked(save.createdAt, Date.now())) return
    await deleteSave(save.id)
  }

  return (
    <article ref={ref} className="rounded-xl border border-black/15 p-4 dark:border-white/20">
      <header className="flex items-baseline justify-between">
        <h3 className="font-semibold">存档点 #{number}</h3>
        <time className="text-xs opacity-50">{formatTime(save.createdAt)}</time>
      </header>
      {save.text && <p className="mt-2 whitespace-pre-wrap break-words">{save.text}</p>}
      {save.photoIds.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {save.photoIds.map((id) => {
            const m = byId.get(id)
            return m ? (
              <Thumb key={id} media={m} onOpen={() => setViewerIndex(photos.indexOf(m))} />
            ) : (
              <div key={id} className={THUMB_BOX} />
            )
          })}
        </div>
      )}
      {save.audioId && <div className="mt-3 h-12">{audio && <AudioPlayer media={audio} />}</div>}
      <footer className="mt-3 flex justify-end text-sm">
        {locked ? (
          <span className="opacity-40">存档已封存</span>
        ) : (
          <button type="button" onClick={handleDiscard} className="opacity-60">
            放弃这个存档
          </button>
        )}
      </footer>
      {viewerIndex !== null && (
        <PhotoViewer photos={photos} startIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </article>
  )
}
