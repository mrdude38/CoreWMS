"use client"

import { createContext, useContext } from 'react'
import { createContextualCan } from '@casl/react'
import { PureAbility, type AbilityTuple } from '@casl/ability'
import type { AppAbility, Actions, Subjects } from './subjects'

// Create a default ability with no permissions
const defaultAbility = new PureAbility<AbilityTuple<Actions, Subjects>>([]) as AppAbility

// Create the Ability Context
export const AbilityContext = createContext<AppAbility>(defaultAbility)

// Create contextual Can component
// Usage: <Can I="create" a="Entry">...</Can>
export const Can = createContextualCan(AbilityContext.Consumer)

/**
 * Hook to access the current user's abilities
 * @returns AppAbility instance
 * @example
 * const ability = useAbility()
 * if (ability.can('create', 'Entry')) {
 *   // show create button
 * }
 */
export function useAbility() {
  return useContext(AbilityContext)
}
