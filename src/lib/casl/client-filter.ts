import { getCurrentUserProfile } from '@/lib/auth/server-auth'

/**
 * Gets the client_id filter for the current user (via backend auth).
 * Returns null if user can see all clients (internal roles).
 * Returns client_id if user is a client (filtered view).
 */
export async function getClientFilter(): Promise<string | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return null

  if (['admin', 'manager', 'operator', 'viewer'].includes(profile.role)) {
    return null
  }
  if (profile.role === 'client') {
    return profile.client_id ?? null
  }
  return null
}
