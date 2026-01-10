import { defineAbilityFor } from './factory'
import { getCurrentUserProfile } from '@/lib/auth/server-auth'
import type { UserProfile } from '@/lib/types'

/**
 * Get the current user's abilities in a server component
 * This function fetches the user's profile and creates an Ability instance
 *
 * Note: User authentication is verified by middleware, so this function
 * assumes the user is already authenticated on protected routes.
 *
 * @returns AppAbility instance for the current user
 * @example
 * const ability = await getServerAbility()
 * if (ability.can('create', 'Entry')) {
 *   // user can create entries
 * }
 */
export async function getServerAbility() {
  const profile = await getCurrentUserProfile()
  return defineAbilityFor(profile as UserProfile | null)
}
