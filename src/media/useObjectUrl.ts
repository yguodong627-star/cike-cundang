import { useEffect, useState } from 'react'

/**
 * 从仓库读出的 Blob 生成临时网址。
 * iPhone Safari 上，直接用仓库里的 Blob 生成的网址在页面切换或刷新后，图片会显示不出来，
 * 所以先把内容复制到内存里，再生成网址。
 */
export async function storedBlobUrl(blob: Blob): Promise<string> {
  try {
    const copy = new Blob([await blob.arrayBuffer()], { type: blob.type })
    return URL.createObjectURL(copy)
  } catch {
    return URL.createObjectURL(blob)
  }
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
    let next: string | undefined
    storedBlobUrl(blob).then((u) => {
      if (cancelled) {
        URL.revokeObjectURL(u)
        return
      }
      next = u
      setUrl(u)
    })
    return () => {
      cancelled = true
      if (next) URL.revokeObjectURL(next)
    }
  }, [blob])
  return url
}
