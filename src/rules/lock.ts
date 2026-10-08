import { EDIT_WINDOW_MS } from './constants.ts'

/**
 * 保存满 6 小时即锁定（恰好 6 小时整也算锁定）。
 * 手机时间被调到存档时间之前时也算锁定，免得把时间往回调就能重新编辑（技术文档坑 7）。
 */
export function isLocked(createdAt: number, now: number): boolean {
  return now < createdAt || now - createdAt >= EDIT_WINDOW_MS
}
