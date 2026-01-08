"use client"

import Link from "next/link"
import { Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Can } from "@/lib/casl/ability-context"
import type { Subjects } from "@/lib/casl/subjects"

interface ProtectedEditButtonProps {
  href: string
  label?: string
  subject: Subjects
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
}

/**
 * Protected button for editing resources
 * Only shows if user has update permission for the subject
 * @example
 * <ProtectedEditButton
 *   href={`/operations/entries/${id}/edit`}
 *   label="Edit Entry"
 *   subject="Entry"
 * />
 */
export function ProtectedEditButton({
  href,
  label = "Edit",
  subject,
  variant = "default",
  size = "default",
}: ProtectedEditButtonProps) {
  return (
    <Can I="update" a={subject}>
      <Button asChild variant={variant} size={size}>
        <Link href={href}>
          <Edit className="mr-2 h-4 w-4" />
          {label}
        </Link>
      </Button>
    </Can>
  )
}
