import { db } from '../db/db.ts'
import { addSave, type NewPhoto } from '../db/saves.ts'
import { EDIT_WINDOW_MS } from '../rules/constants.ts'

const DAY_MS = 24 * 60 * 60 * 1000

const SAMPLE_TEXTS = [
  '今天的咖啡特别好喝',
  '下班路上看到很好看的晚霞',
  '终于把拖了很久的事情做完了',
  '和朋友吃了顿火锅',
  '下雨了，在窗边发了会儿呆',
  '跑了 5 公里',
  '读完了一本书',
  '加班到很晚，有点累',
  '周末去公园走了走',
  '学会了一道新菜',
]

function randomInt(max: number): number {
  return Math.floor(Math.random() * max)
}

async function drawJpeg(width: number, height: number, hue: number, label: string): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = `hsl(${hue}, 60%, 55%)`
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#fff'
  ctx.font = `${Math.round(height / 5)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, width / 2, height / 2)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.82))
}

async function makeSamplePhotos(count: number): Promise<NewPhoto[]> {
  const photos: NewPhoto[] = []
  for (let i = 0; i < count; i++) {
    const hue = Math.round((360 / count) * i)
    const label = `图 ${i + 1}`
    photos.push({
      blob: await drawJpeg(1600, 1200, hue, label),
      thumbBlob: await drawJpeg(400, 300, hue, label),
      mimeType: 'image/jpeg',
    })
  }
  return photos
}

/**
 * 在过去 days 天里随机生成 count 条存档。
 * 第一条固定在 days 天前，其余都早于 6 小时前（已封存）。
 */
export async function generateTestData(count = 300, days = 400, now = Date.now()): Promise<void> {
  const samples = await makeSamplePhotos(8)
  const earliest = now - days * DAY_MS
  const latest = now - EDIT_WINDOW_MS - 60 * 1000

  for (let i = 0; i < count; i++) {
    const createdAt = i === 0 ? earliest : earliest + Math.random() * (latest - earliest)
    const photoCount = Math.random() < 0.5 ? 0 : 1 + randomInt(3)
    const photos = Array.from({ length: photoCount }, () => samples[randomInt(samples.length)])
    const text = photoCount > 0 && Math.random() < 0.3 ? null : SAMPLE_TEXTS[randomInt(SAMPLE_TEXTS.length)]
    await addSave({ text, photos, audio: null }, Math.round(createdAt))
  }
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.saves, db.media, db.settings, async () => {
    await db.saves.clear()
    await db.media.clear()
    await db.settings.clear()
  })
}
