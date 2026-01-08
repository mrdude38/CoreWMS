"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useAbility } from "@/lib/casl/ability-context"
import type { Actions, Subjects } from "@/lib/casl/subjects"

interface CaslProtectedButtonProps extends React.ComponentProps<typeof Button> {
  action: Actions
  subject: Subjects
  showWhenNoAccess?: boolean
}

/**
 * Generic CASL-protected button component
 * Uses imperative permission checks with useAbility hook
 * @example
 * <CaslProtectedButton
 *   action="create"
 *   subject="Entry"
 *   onClick={handleCreate}
 * >
 *   Create Entry
 * </CaslProtectedButton>
 */
export function CaslProtectedButton({
  action,
  subject,
  showWhenNoAccess = false,
  children,
  disabled,
  ...props
}: CaslProtectedButtonProps) {
  const ability = useAbility()
  const hasAccess = ability.can(action, subject)

  if (!hasAccess && !showWhenNoAccess) {
    return null
  }

  return (
    <Button {...props} disabled={!hasAccess || disabled}>
      {children}
    </Button>
  )
}
