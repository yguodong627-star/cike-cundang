import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db.ts'
import { addSave, deleteSave, getAllSaves, updateSave, type NewAudio, type NewPhoto } from './saves.ts'

const photo = (): NewPhoto => ({
  blob: new Blob(['big'], { type: 'image/jpeg' }),
  thumbBlob: new Blob(['small'], { type: 'image/jpeg' }),
  mimeType: 'image/jpeg',
})

const audio = (): NewAudio => ({
  blob: new Blob(['voice'], { type: 'audio/mp4' }),
  mimeType: 'audio/mp4',
  durationMs: 10_000,
})

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

describe('仓库的增、查、改、删', () => {
  it('新增一条“你好”后，读取全部得到 1 条，文字是“你好”', async () => {
    await addSave({ text: '你好', photos: [], audio: null })
    const saves = await getAllSaves()
    expect(saves).toHaveLength(1)
    expect(saves[0].text).toBe('你好')
  })

  it('新增一条带 2 张照片的存档后，media 表里有 2 条记录', async () => {
    const save = await addSave({ text: null, photos: [photo(), photo()], audio: null })
    expect(save.photoIds).toHaveLength(2)
    expect(await db.media.count()).toBe(2)
    const stored = await db.media.get(save.photoIds[0])
    expect(stored?.kind).toBe('photo')
    expect(stored?.thumbBlob).toBeDefined()
  })

  it('删除存档后，saves 和 media 表里都找不到它和它的照片、语音', async () => {
    const save = await addSave({ text: '要删的', photos: [photo(), photo()], audio: audio() })
    const other = await addSave({ text: '留下的', photos: [photo()], audio: null })

    await deleteSave(save.id)

    expect(await db.saves.get(save.id)).toBeUndefined()
    expect(await db.media.where('saveId').equals(save.id).count()).toBe(0)
    expect(await db.saves.get(other.id)).toBeDefined()
    expect(await db.media.count()).toBe(1)
  })

  it('把文字改成“再见”后，updatedAt 变大，createdAt 不变', async () => {
    const save = await addSave({ text: '你好', photos: [], audio: null }, 1000)
    await updateSave(save.id, { text: '再见' }, 2000)

    const [stored] = await getAllSaves()
    expect(stored.text).toBe('再见')
    expect(stored.updatedAt).toBe(2000)
    expect(stored.createdAt).toBe(1000)
  })

  it('修改时去掉 1 张照片、加 2 张新照片、去掉语音，素材表同步更新', async () => {
    const save = await addSave({ text: null, photos: [photo(), photo()], audio: audio() })
    const [keep, remove] = save.photoIds

    const updated = await updateSave(save.id, {
      removePhotoIds: [remove],
      addPhotos: [photo(), photo()],
      audio: null,
    })

    expect(updated.photoIds).toHaveLength(3)
    expect(updated.photoIds[0]).toBe(keep)
    expect(updated.audioId).toBeNull()
    expect(await db.media.get(remove)).toBeUndefined()
    expect(await db.media.get(save.audioId!)).toBeUndefined()
    expect(await db.media.count()).toBe(3)
  })

  it('读取全部时按保存时间从早到晚排列', async () => {
    await addSave({ text: '晚', photos: [], audio: null }, 3000)
    await addSave({ text: '早', photos: [], audio: null }, 1000)
    const saves = await getAllSaves()
    expect(saves.map((s) => s.text)).toEqual(['早', '晚'])
  })
})
