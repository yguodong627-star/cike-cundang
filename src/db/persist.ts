/** 向浏览器申请持久保存，降低存档被系统清理的风险（技术文档坑 2）。浏览器不支持时返回 false */
export async function requestPersist(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}

export async function isPersisted(): Promise<boolean> {
  if (!navigator.storage?.persisted) return false
  return navigator.storage.persisted()
}
