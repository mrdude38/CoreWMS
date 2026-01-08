"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Can } from "@/lib/casl/ability-context"
import type { Subjects } from "@/lib/casl/subjects"

interface ProtectedDeleteButtonProps {
  onDelete: () => void
  label?: string
  subject: Subjects
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  disabled?: boolean
}

/**
 * Protected button for deleting resources
 * Only shows if user has delete permission for the subject
 * @example
 * <ProtectedDeleteButton
 *   onDelete={handleDelete}
 *   label="Delete Entry"
 *   subject="Entry"
 *   variant="destructive"
 * />
 */
export function ProtectedDeleteButton({
  onDelete,
  label = "Delete",
  subject,
  variant = "destructive",
  size = "default",
  disabled = false,
}: ProtectedDeleteButtonProps) {
  return (
    <Can I="delete" a={subject}>
      <Button onClick={onDelete} variant={variant} size={size} disabled={disabled}>
        <Trash2 className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </Can>
  )
}
