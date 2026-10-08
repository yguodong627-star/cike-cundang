/** 只有 iPhone / iPad 的 Safari 有 navigator.standalone；在 Safari 标签页里打开时为 false */
function isIosSafariTab(): boolean {
  const standalone = (navigator as { standalone?: boolean }).standalone
  return standalone === false
}

/** 在 Safari 里打开时提醒：这里的存档和主屏幕图标里的是分开的 */
export default function SafariTabHint() {
  if (!isIosSafariTab()) return null
  return (
    <p className="mt-2 rounded-lg border border-black/20 p-3 text-sm dark:border-white/30">
      现在是在 Safari 里打开的。这里的存档和主屏幕图标里的是分开的，请从主屏幕图标打开。
    </p>
  )
}
