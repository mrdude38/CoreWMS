import { redirect } from 'next/navigation'
import { getServerAbility } from './server-ability'
import type { Actions, Subjects } from './subjects'

/**
 * Require a specific permission to access a server component
 * Redirects to home page if user doesn't have the required permission
 * @param action - The action to check (create, read, update, delete)
 * @param subject - The subject to check permission for
 * @example
 * async function Page() {
 *   await requirePermission('create', 'Entry')
 *   // rest of component - only accessible if user can create entries
 * }
 */
export async function requirePermission(action: Actions, subject: Subjects) {
  const ability = await getServerAbility()

  if (!ability.can(action, subject)) {
    redirect('/')
  }
}

/**
 * Require admin role to access a server component
 * Redirects to home page if user is not an admin
 * @example
 * async function AdminPage() {
 *   await requireAdmin()
 *   // rest of component - only accessible by admins
 * }
 */
export async function requireAdmin() {
  const ability = await getServerAbility()

  if (!ability.can('manage', 'all')) {
    redirect('/')
  }
}
