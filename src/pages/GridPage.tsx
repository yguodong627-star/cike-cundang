import { useLiveQuery } from 'dexie-react-hooks'
import { getAllSaves } from '../db/saves.ts'
import { addDaysToKey, toLocalDateKey } from '../rules/date.ts'
import { computeGrid } from '../rules/grid.ts'
import { formatDateHeading } from '../rules/timeline.ts'
import { useNow } from '../components/useNow.ts'

export default function GridPage() {
  const saves = useLiveQuery(getAllSaves)
  const now = useNow()

  if (!saves) return null

  const { startDate, totalDays, litDates } = computeGrid(saves, now)
  const today = toLocalDateKey(now)

  return (
    <>
      <h1 className="text-2xl font-semibold">格子</h1>
      {startDate === null ? (
        <p className="mt-16 text-center text-sm opacity-50">存下第一个存档，点亮第一格</p>
      ) : (
        <>
          <p className="mt-2 text-sm opacity-60">
            从 {formatDateHeading(startDate)} 开始 · 已点亮 {litDates.size} 格
          </p>
          <ol className="mt-6 grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
            {Array.from({ length: totalDays }, (_, i) => {
              const date = addDaysToKey(startDate, i)
              const lit = litDates.has(date)
              const isToday = date === today
              return (
                <li
                  key={date}
                  aria-label={`${formatDateHeading(date)}${lit ? '，已点亮' : ''}${isToday ? '，今天' : ''}`}
                  className={`aspect-square rounded-[3px] ${
                    lit ? 'bg-black dark:bg-white' : 'bg-black/10 dark:bg-white/15'
                  } ${isToday ? 'outline-2 outline-offset-1 outline-black dark:outline-white' : ''}`}
                />
              )
            })}
          </ol>
          <p className="mt-4 text-xs opacity-50">带外框的一格是今天</p>
        </>
      )}
    </>
  )
}
