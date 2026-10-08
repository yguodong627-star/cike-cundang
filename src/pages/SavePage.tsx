import { useNavigate } from 'react-router'
import { addSave, getAllSaves } from '../db/saves.ts'
import { computeSaveNumbers } from '../rules/numbering.ts'
import { useToast } from '../components/Toast.tsx'
import SaveForm, { type SaveFormValue } from '../components/SaveForm.tsx'

export default function SavePage() {
  const navigate = useNavigate()
  const toast = useToast()

  async function handleSave({ text, photos, recording }: SaveFormValue) {
    const save = await addSave({
      text: text.trim() || null,
      photos: photos.flatMap(({ photo }) =>
        photo ? [{ blob: photo.blob, thumbBlob: photo.thumbBlob, mimeType: photo.mimeType }] : [],
      ),
      audio: recording
        ? { blob: recording.blob, mimeType: recording.mimeType, durationMs: recording.durationMs }
        : null,
    })
    const number = computeSaveNumbers(await getAllSaves()).get(save.id)
    toast(`已存档 · 存档点 #${number}`)
    navigate('/timeline')
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">存档</h1>
      <SaveForm
        submitLabel="保存此刻"
        // 吸在底部导航上方：内容再多也不用滚动就能点到
        footerClassName="sticky bottom-[calc(env(safe-area-inset-bottom)+2.75rem)]"
        onSubmit={handleSave}
      />
    </>
  )
}
