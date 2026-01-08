import { useAbility } from '@/lib/casl/ability-context'
import type { Actions, Subjects } from '@/lib/casl/subjects'

/**
 * Convenience hook that provides easy access to common permission checks
 * This hook wraps useAbility() and exposes frequently-used permission checks
 * @returns Object with permission check functions and a generic can() function
 * @example
 * const { canCreateEntries, canManageUsers } = useCaslPermissions()
 * if (canCreateEntries) {
 *   // show create entry button
 * }
 */
export function useCaslPermissions() {
  const ability = useAbility()

  return {
    // Catalog permissions
    canCreateCatalogs: ability.can('create', 'Catalog'),
    canReadCatalogs: ability.can('read', 'Catalog'),
    canUpdateCatalogs: ability.can('update', 'Catalog'),
    canDeleteCatalogs: ability.can('delete', 'Catalog'),

    // Entry permissions
    canCreateEntries: ability.can('create', 'Entry'),
    canReadEntries: ability.can('read', 'Entry'),
    canUpdateEntries: ability.can('update', 'Entry'),
    canDeleteEntries: ability.can('delete', 'Entry'),

    // Load Order permissions
    canCreateLoadOrders: ability.can('create', 'LoadOrder'),
    canReadLoadOrders: ability.can('read', 'LoadOrder'),
    canUpdateLoadOrders: ability.can('update', 'LoadOrder'),
    canDeleteLoadOrders: ability.can('delete', 'LoadOrder'),

    // Report permissions
    canReadReports: ability.can('read', 'Report'),

    // User management permissions
    canManageUsers: ability.can('manage', 'User'),
    canReadUsers: ability.can('read', 'User'),

    // Generic check function
    can: (action: Actions, subject: Subjects) => ability.can(action, subject),
  }
}
