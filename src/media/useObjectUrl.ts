import { useEffect, useState } from 'react'

/**
 * 把仓库里的 Blob 转成可以直接放进 src 的 data 网址。
 * iPhone 主屏幕模式下，时间线里用 blob: 临时网址的图片和语音会加载失败，所以不用临时网址。
 */
export function storedBlobUrl(blob: Blob): Promise<string> {
  const type = blob.type.split(';')[0].trim()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(new Blob([blob], { type }))
  })
}

/** 给仓库里的 Blob 生成可显示的网址；Blob 变化时重新生成 */
export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) {
      setUrl(undefined)
      return
    }
    let cancelled = false
    storedBlobUrl(blob).then(
      (u) => {
        if (!cancelled) setUrl(u)
      },
      () => {},
    )
    return () => {
      cancelled = true
    }
  }, [blob])
  return url
}
