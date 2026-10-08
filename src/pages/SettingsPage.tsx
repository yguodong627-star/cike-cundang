import { lazy, Suspense, useEffect, useState } from 'react'
import { isPersisted } from '../db/persist.ts'

// 用动态引入，部署版构建时整段被丢掉，不会打包进去
const DevTools = import.meta.env.DEV ? lazy(() => import('../dev/DevTools.tsx')) : null

export default function SettingsPage() {
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    isPersisted().then(setPersisted)
  }, [])

  return (
    <>
      <h1 className="text-2xl font-semibold">设置</h1>
      <p className="mt-6 text-sm">
        持久保存：{persisted === null ? '检查中…' : persisted ? '已开启' : '未开启'}
      </p>
      {DevTools && (
        <Suspense fallback={null}>
          <DevTools />
        </Suspense>
      )}
    </>
  )
}
