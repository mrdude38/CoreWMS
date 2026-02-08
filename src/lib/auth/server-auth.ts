import { cookies } from 'next/headers'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'
const AUTH_COOKIE = 'corewms_access_token'

/** Minimal user (backend auth, no Supabase) */
export interface ServerUser {
  id: string
  email: string
}

/**
 * Get the current authenticated user in Server Components via backend.
 * Reads the auth cookie and calls backend GET /me.
 */
export async function getCurrentUser(): Promise<ServerUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  if (!token) return null

  try {
    const res = await fetch(`${API_BASE}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    const user = data?.user ?? data
    if (user?.id && user?.email) return { id: user.id, email: user.email }
    return null
  } catch {
    return null
  }
}

export async function requireUser(): Promise<ServerUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')
  return user
}

/**
 * Get the current user's profile from the backend.
 */
export async function getCurrentUserProfile() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  if (!token) return null

  try {
    const res = await fetch(`${API_BASE}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.profile ?? data
  } catch {
    return null
  }
}
