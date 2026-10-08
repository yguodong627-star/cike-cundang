import { Dexie, type EntityTable } from 'dexie'
import type { Media, Save, Settings } from '../types/models.ts'

// iPhone Safari 上，Dexie 缓存里的照片 / 语音 Blob 再次读取时是空的，所以关掉缓存，每次都从仓库现读
export const db = new Dexie('cike', { cache: 'disabled' }) as Dexie & {
  saves: EntityTable<Save, 'id'>
  media: EntityTable<Media, 'id'>
  settings: EntityTable<Settings, 'id'>
}

// 改动表结构时，新增 db.version(2)... 并写迁移，不要直接改这里（技术文档坑 6）
db.version(1).stores({
  saves: 'id, createdAt',
  media: 'id, saveId',
  settings: 'id',
})
