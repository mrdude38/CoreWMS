"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Can } from "@/lib/casl/ability-context"
import type { Subjects } from "@/lib/casl/subjects"

interface ProtectedNewButtonProps {
  href: string
  label: string
  subject: Subjects
}

/**
 * Protected button for creating new resources
 * Only shows if user has create permission for the subject
 * @example
 * <ProtectedNewButton
 *   href="/operations/entries/new"
 *   label="New Entry"
 *   subject="Entry"
 * />
 */
export function ProtectedNewButton({ href, label, subject }: ProtectedNewButtonProps) {
  return (
    <Can I="create" a={subject}>
      <Button asChild>
        <Link href={href}>
          <Plus className="mr-2 h-4 w-4" />
          {label}
        </Link>
      </Button>
    </Can>
  )
}
