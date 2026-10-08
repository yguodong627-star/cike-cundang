import { useEffect, useState, type RefObject } from 'react'

/** 元素离屏幕不到 margin 时返回 true，离远了变回 false */
export function useNearViewport(ref: RefObject<Element | null>, margin = '800px'): boolean {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: `${margin} 0px`,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, margin])
  return near
}
