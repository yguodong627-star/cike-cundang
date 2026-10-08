import { useState } from 'react'
import { clearAllData, generateTestData } from './seed.ts'

export default function DevTools() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function run(task: () => Promise<void>, done: string) {
    setBusy(true)
    setMessage('处理中…')
    try {
      await task()
      setMessage(done)
    } catch (e) {
      setMessage(`出错了：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-10 border-t border-dashed border-black/20 pt-4 dark:border-white/30">
      <p className="text-xs opacity-50">仅本地开发可见</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => generateTestData(), '已生成 300 条测试存档')}
          className="flex-1 rounded-lg border border-black/20 py-2.5 text-sm disabled:opacity-40 dark:border-white/30"
        >
          生成测试数据
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm('确定清空全部数据？')) run(clearAllData, '已清空全部数据')
          }}
          className="flex-1 rounded-lg border border-black/20 py-2.5 text-sm disabled:opacity-40 dark:border-white/30"
        >
          清空全部数据
        </button>
      </div>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </section>
  )
}
