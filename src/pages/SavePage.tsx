import { useNavigate } from 'react-router'
import { addSave, getAllSaves } from '../db/saves.ts'
import { computeSaveNumbers } from '../rules/numbering.ts'
import { useToast } from '../components/Toast.tsx'
import { useBackupReminder } from '../components/BackupReminder.tsx'
import SaveForm, { revokeFormUrls, type SaveFormValue } from '../components/SaveForm.tsx'

// 没存的草稿：切到别的页面再回来还在；App 被关掉后就没了
let draft: SaveFormValue | null = null

export default function SavePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const checkBackupReminder = useBackupReminder()

  async function handleSave(value: SaveFormValue) {
    const { text, photos, recording } = value
    const save = await addSave({
      text: text.trim() || null,
      photos: photos.flatMap(({ photo }) =>
        photo ? [{ blob: photo.blob, thumbBlob: photo.thumbBlob, mimeType: photo.mimeType }] : [],
      ),
      audio: recording
        ? { blob: recording.blob, mimeType: recording.mimeType, durationMs: recording.durationMs }
        : null,
    })
    draft = null
    revokeFormUrls(value)
    const number = computeSaveNumbers(await getAllSaves()).get(save.id)
    toast(`已存档 · 存档点 #${number}`)
    navigate('/timeline')
    void checkBackupReminder()
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">存档</h1>
      <SaveForm
        initial={draft ?? undefined}
        submitLabel="保存此刻"
        // 吸在底部导航上方：内容再多也不用滚动就能点到
        footerClassName="sticky bottom-[calc(env(safe-area-inset-bottom)+2.75rem)]"
        onSubmit={handleSave}
        onDraftChange={(value) => {
          draft = value
        }}
        revokeOnUnmount={false}
      />
    </>
  )
}
