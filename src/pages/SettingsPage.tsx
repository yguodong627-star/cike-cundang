import { useEffect, useState } from 'react'
import { isPersisted } from '../db/persist.ts'

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
    </>
  )
}
