import { useLiveQuery } from 'dexie-react-hooks'
import { getAllSaves } from '../db/saves.ts'
import { computeSaveNumbers } from '../rules/numbering.ts'
import { formatDateHeading, groupSavesByDay } from '../rules/timeline.ts'
import SaveCard from '../components/SaveCard.tsx'
import { useNow } from '../components/useNow.ts'

export default function TimelinePage() {
  const saves = useLiveQuery(getAllSaves)
  const now = useNow()

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
          <section key={group.dateKey} className="mt-6">
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
