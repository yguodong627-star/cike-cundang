import { db } from './db.ts'

export async function getLastBackupAt(): Promise<number | null> {
  return (await db.settings.get('app'))?.lastBackupAt ?? null
}

export async function setLastBackupAt(timestamp: number): Promise<void> {
  await db.settings.put({ id: 'app', lastBackupAt: timestamp })
}
