import type { Save } from '../types/models.ts'

/** 按保存时间排队，返回 存档 id → 编号（从 1 开始）。编号不存进仓库（技术文档坑 4） */
export function computeSaveNumbers(saves: Pick<Save, 'id' | 'createdAt'>[]): Map<string, number> {
  const sorted = [...saves].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
  return new Map(sorted.map((s, i) => [s.id, i + 1]))
}
