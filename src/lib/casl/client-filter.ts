import { createClient } from '@/lib/supabase/server'

/**
 * Gets the client_id filter for the current user
 * Returns null if user can see all clients (internal roles)
 * Returns client_id if user is a client (filtered view)
 */
export async function getClientFilter(): Promise<string | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Internal roles see everything
  if (['admin', 'manager', 'operator', 'viewer'].includes(profile.role)) {
    return null
  }

  // Client role sees only their client
  if (profile.role === 'client') {
    return profile.client_id || null
  }

  return null
}
