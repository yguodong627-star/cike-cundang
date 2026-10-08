import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { getAllSaves } from '../db/saves.ts'
import { computeSaveNumbers } from '../rules/numbering.ts'
import { formatDateHeading, groupSavesByDay } from '../rules/timeline.ts'
import SaveCard from '../components/SaveCard.tsx'
import { useNow } from '../components/useNow.ts'

export default function TimelinePage() {
  const saves = useLiveQuery(getAllSaves)
  const now = useNow()
  const location = useLocation()
  const navigate = useNavigate()
  const targetDate = (location.state as { date?: string } | null)?.date
  const loaded = saves !== undefined
  // 跳转到的那一天至少占满一屏，否则最早几天在页面底部，标题滚不到顶
  const [anchorDate, setAnchorDate] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded || !targetDate) return
    setAnchorDate(targetDate)
    // 清掉跳转目标，免得刷新或返回时又跳一次
    navigate('.', { replace: true, state: null })
  }, [loaded, targetDate, navigate])

  useEffect(() => {
    if (anchorDate) document.getElementById(`day-${anchorDate}`)?.scrollIntoView({ block: 'start' })
  }, [anchorDate])

  if (!saves) return null

  const numbers = computeSaveNumbers(saves)
  const groups = groupSavesByDay(saves)

  return (
    <>
      <h1 className="text-2xl font-semibold">时间线</h1>
      {groups.length === 0 ? (
        <p className="mt-16 text-center text-sm opacity-50">还没有存档</p>
      ) : (
        groups.map((group) => (
          <section
            key={group.dateKey}
            id={`day-${group.dateKey}`}
            className={`mt-6 scroll-mt-[env(safe-area-inset-top)] ${group.dateKey === anchorDate ? 'min-h-dvh' : ''}`}
          >
            <h2 className="mb-2 text-sm opacity-60">{formatDateHeading(group.dateKey)}</h2>
            <div className="space-y-3">
              {group.saves.map((save) => (
                <SaveCard key={save.id} save={save} number={numbers.get(save.id)!} now={now} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  )
}
