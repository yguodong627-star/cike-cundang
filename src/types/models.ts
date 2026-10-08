export interface Save {
  /** 随机生成、永不改变的身份证号；不是“存档点 #N”的编号 */
  id: string
  /** 保存时间（毫秒时间戳） */
  createdAt: number
  /** 最后修改时间（毫秒时间戳） */
  updatedAt: number
  /** 文字，最多 200 字；没有文字时为 null */
  text: string | null
  /** 照片的取件号，0～10 个，对应 Media.id */
  photoIds: string[]
  /** 语音的取件号；没有语音时为 null */
  audioId: string | null
}

export type MediaKind = 'photo' | 'audio'

export interface Media {
  /** 取件号，对应 Save.photoIds / Save.audioId */
  id: string
  /** 属于哪条存档 */
  saveId: string
  kind: MediaKind
  /** 文件本身（压缩后的照片 / 录音） */
  blob: Blob
  /** 照片的小缩略图，仅照片有 */
  thumbBlob?: Blob
  /** 文件格式，例如 "image/jpeg"、"audio/mp4" */
  mimeType: string
  /** 录音时长（毫秒），仅语音有 */
  durationMs?: number
}

export interface Settings {
  /** 固定为 "app"，设置表里只有这一行 */
  id: 'app'
  /** 上次成功“备份存档”的时间（毫秒时间戳）；从没备份过时为 null */
  lastBackupAt: number | null
}
