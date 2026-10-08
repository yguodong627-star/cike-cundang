import { EDIT_WINDOW_MS } from './constants.ts'

/** 保存满 6 小时即锁定（恰好 6 小时整也算锁定） */
export function isLocked(createdAt: number, now: number): boolean {
  return now - createdAt >= EDIT_WINDOW_MS
}
