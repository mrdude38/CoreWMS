import { AbilityBuilder, PureAbility, AbilityClass } from '@casl/ability'
import type { AppAbility, Actions, Subjects } from './subjects'
import type { UserProfile } from '@/lib/types'

type DefinePermissions = (
  user: UserProfile,
  builder: AbilityBuilder<AppAbility>
) => void

// Define permissions for each role
const rolePermissions: Record<string, DefinePermissions> = {
  admin: (user, { can }) => {
    // Admins can do everything
    can('manage', 'all')
  },

  manager: (user, { can }) => {
    // Catalogs
    can(['read', 'create', 'update'], 'Catalog')

    // Entries
    can(['read', 'create', 'update'], 'Entry')

    // Load Orders
    can(['read', 'create', 'update', 'delete'], 'LoadOrder')

    // Reports
    can('read', 'Report')

    // Users (read only)
    can('read', 'User')

    // Emails
    can(['read', 'create'], 'Email')
  },

  operator: (user, { can }) => {
    // Catalogs (read only)
    can('read', 'Catalog')

    // Entries
    can(['read', 'create', 'update'], 'Entry')

    // Load Orders (read and update only)
    can(['read', 'update'], 'LoadOrder')

    // Reports
    can('read', 'Report')

    // Emails (read only)
    can('read', 'Email')
  },

  viewer: (user, { can }) => {
    // Everything is read-only for viewers
    can('read', 'Catalog')
    can('read', 'Entry')
    can('read', 'LoadOrder')
    can('read', 'Report')
  },

  client: (user, { can }) => {
    // Clients can view catalogs (read-only)
    can('read', 'Catalog')

    // Clients can view their entries
    can('read', 'Entry')

    // Clients can view and create load orders for their client
    can(['read', 'create'], 'LoadOrder')

    // Clients can view reports
    can('read', 'Report')
  },
}

/**
 * Creates an Ability instance based on user profile
 * @param user - User profile containing role information
 * @returns AppAbility instance with permissions for the user's role
 */
export function defineAbilityFor(user: UserProfile | null): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(
    PureAbility as AbilityClass<AppAbility>
  )

  if (user && user.is_active) {
    const definePermissions = rolePermissions[user.role]
    if (definePermissions) {
      definePermissions(user, builder)
    }
  }

  return builder.build()
}
