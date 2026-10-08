import { useRef, useState } from 'react'
import { compressImage, type CompressedPhoto } from '../media/compressImage.ts'
import { MAX_PHOTOS } from '../rules/constants.ts'

export interface PickedPhoto {
  key: string
  url: string
  /** 新选的照片 */
  photo?: CompressedPhoto
  /** 编辑时，存档里原有的照片 */
  mediaId?: string
}

interface Props {
  photos: PickedPhoto[]
  onChange: (photos: PickedPhoto[]) => void
  onError: (message: string) => void
  /** 开始 / 结束处理照片时通知，处理中不能保存 */
  onBusyChange?: (busy: boolean) => void
}

export default function PhotoPicker({ photos, onChange, onError, onBusyChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const full = photos.length >= MAX_PHOTOS

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const room = MAX_PHOTOS - photos.length
    const chosen = [...files].slice(0, room)

    setProcessing(true)
    onBusyChange?.(true)
    const added: PickedPhoto[] = []
    let failed = 0
    for (const file of chosen) {
      try {
        const photo = await compressImage(file)
        added.push({ key: crypto.randomUUID(), photo, url: URL.createObjectURL(photo.thumbBlob) })
      } catch {
        failed++
      }
    }
    if (added.length > 0) onChange([...photos, ...added])
    const problems: string[] = []
    if (failed > 0) problems.push(added.length > 0 ? `有 ${failed} 张照片无法读取，其余已添加` : '有照片无法读取，请换一张试试')
    if (files.length > room) problems.push(`照片最多 ${MAX_PHOTOS} 张`)
    if (problems.length > 0) onError(problems.join('；'))
    setProcessing(false)
    onBusyChange?.(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function remove(key: string) {
    const target = photos.find((p) => p.key === key)
    if (target) URL.revokeObjectURL(target.url)
    onChange(photos.filter((p) => p.key !== key))
  }

  return (
    <div className="mt-4">
      {photos.length > 0 && (
        <ul className="mb-3 grid grid-cols-4 gap-2">
          {photos.map((p) => (
            <li key={p.key} className="relative aspect-square">
              <img src={p.url} alt="" className="h-full w-full rounded-md object-cover" />
              <button
                type="button"
                aria-label="去掉这张照片"
                onClick={() => remove(p.key)}
                className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black text-sm text-white dark:bg-white dark:text-black"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={full || processing}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg border border-black/20 py-2.5 text-sm disabled:opacity-40 dark:border-white/30"
      >
        {processing ? '处理中…' : `添加照片（${photos.length} / ${MAX_PHOTOS}）`}
      </button>
    </div>
  )
}
