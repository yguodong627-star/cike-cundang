import { describe, expect, it } from 'vitest'
import { buildSaveChanges, isEditChanged, type EditDraft } from './edit.ts'

const photo = { blob: new Blob(['p']), thumbBlob: new Blob(['t']), mimeType: 'image/jpeg' }
const audio = { blob: new Blob(['a']), mimeType: 'audio/mp4', durationMs: 1000 }
const original = { photoIds: ['p1', 'p2', 'p3'], audioId: 'a1' }

const draft = (over: Partial<EditDraft>): EditDraft => ({
  text: '原文',
  keptPhotoIds: ['p1', 'p2', 'p3'],
  newPhotos: [],
  keptAudioId: 'a1',
  newAudio: null,
  ...over,
})

describe('buildSaveChanges', () => {
  it('nothing changed keeps audio untouched', () => {
    const c = buildSaveChanges(original, draft({}))
    expect(c.text).toBe('原文')
    expect(c.removePhotoIds).toEqual([])
    expect(c.addPhotos).toEqual([])
    expect(c.audio).toBeUndefined()
  })

  it('trims text and turns empty into null', () => {
    expect(buildSaveChanges(original, draft({ text: '  新的  ' })).text).toBe('新的')
    expect(buildSaveChanges(original, draft({ text: '   ' })).text).toBeNull()
  })

  it('removes dropped photos and adds new ones', () => {
    const c = buildSaveChanges(original, draft({ keptPhotoIds: ['p1', 'p3'], newPhotos: [photo, photo] }))
    expect(c.removePhotoIds).toEqual(['p2'])
    expect(c.addPhotos).toHaveLength(2)
  })

  it('deletes audio when it was removed', () => {
    expect(buildSaveChanges(original, draft({ keptAudioId: null })).audio).toBeNull()
  })

  it('replaces audio with a new recording', () => {
    expect(buildSaveChanges(original, draft({ keptAudioId: null, newAudio: audio })).audio).toBe(audio)
  })

  it('adds audio to a save that had none', () => {
    const c = buildSaveChanges({ photoIds: [], audioId: null }, draft({ keptPhotoIds: [], keptAudioId: null, newAudio: audio }))
    expect(c.audio).toBe(audio)
  })

  it('leaves audio alone when there was none and none added', () => {
    const c = buildSaveChanges({ photoIds: [], audioId: null }, draft({ keptPhotoIds: [], keptAudioId: null }))
    expect(c.audio).toBeUndefined()
  })
})

describe('编辑内容有没有变化', () => {
  const before = { text: '原文', photoKeys: ['p1', 'p2'], audioKey: 'a1' }

  it('什么都没动：没有变化', () => {
    expect(isEditChanged(before, { ...before, photoKeys: ['p1', 'p2'] })).toBe(false)
  })

  it('改了文字、去掉或加了照片、换了照片顺序、去掉或换了语音：都算变化', () => {
    expect(isEditChanged(before, { ...before, text: '新文' })).toBe(true)
    expect(isEditChanged(before, { ...before, photoKeys: ['p1'] })).toBe(true)
    expect(isEditChanged(before, { ...before, photoKeys: ['p1', 'p2', 'n1'] })).toBe(true)
    expect(isEditChanged(before, { ...before, photoKeys: ['p2', 'p1'] })).toBe(true)
    expect(isEditChanged(before, { ...before, audioKey: null })).toBe(true)
    expect(isEditChanged(before, { ...before, audioKey: 'blob:new' })).toBe(true)
  })
})
