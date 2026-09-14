import { cookies } from 'next/headers'

export async function getCurrentUserId(): Promise<number | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) return null

  return Number(userId)
}