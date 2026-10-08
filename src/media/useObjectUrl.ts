import { useEffect, useState } from 'react'
import { logDiag } from '../dev/errorLog.ts'

let queue: Promise<unknown> = Promise.resolve()

/**
 * 给仓库里的 Blob 生成临时网址。
 * iPhone Safari 上，几张仓库里的照片 / 语音同时加载会失败，
 * 所以排队逐个读进内存，再用内存里的副本生成网址。
 */
export function storedBlobUrl(blob: Blob): Promise<string> {
  const task = queue.then(async () => {
    const copy = new Blob([await blob.arrayBuffer()], { type: blob.type })
    return URL.createObjectURL(copy)
  })
  queue = task.catch(() => {})
  return task
}

/** 给仓库里的 Blob 生成临时网址，组件卸载或 Blob 变化时自动回收 */
export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) {
      setUrl(undefined)
      return
    }
    let cancelled = false
    let current: string | undefined
    storedBlobUrl(blob).then(
      (u) => {
        if (cancelled) {
          URL.revokeObjectURL(u)
          return
        }
        current = u
        setUrl(u)
      },
      (e: Error) => logDiag(`读取失败 size=${blob.size} ${e.name} ${e.message}`),
    )
    return () => {
      cancelled = true
      if (current) URL.revokeObjectURL(current)
    }
  }, [blob])
  return url
}
