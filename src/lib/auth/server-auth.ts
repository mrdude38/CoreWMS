import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

/**
 * Get the current authenticated user in Server Components.
 *
 * IMPORTANT: This function assumes middleware has already verified authentication.
 * It will return null if no user is found, but this should never happen on protected routes
 * because middleware redirects unauthenticated users to /auth/login.
 *
 * Use this in Server Components/Actions to get the current user without redundant auth checks.
 *
 * @returns The authenticated user or null
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get the current authenticated user, throwing an error if not found.
 *
 * Use this in Server Components when you need to ensure a user exists
 * (though middleware should have already handled this).
 *
 * @throws Error if no user is authenticated
 * @returns The authenticated user
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    // This should never happen on protected routes due to middleware,
    // but we include it as a safety measure
    throw new Error('User not authenticated')
  }

  return user
}

/**
 * Get the current user's profile from the database.
 *
 * @returns The user's profile or null if not found
 */
export async function getCurrentUserProfile() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
