import { defineAbilityFor } from './factory'
import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/lib/types'

/**
 * Get the current user's abilities in a server component
 * This function fetches the user's profile from Supabase and creates an Ability instance
 * @returns AppAbility instance for the current user
 * @example
 * const ability = await getServerAbility()
 * if (ability.can('create', 'Entry')) {
 *   // user can create entries
 * }
 */
export async function getServerAbility() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return defineAbilityFor(null)
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return defineAbilityFor(profile as UserProfile | null)
}
