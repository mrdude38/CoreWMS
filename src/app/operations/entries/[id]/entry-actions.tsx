"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProtectedEditButton } from "@/components/protected-edit-button"
import { ProtectedDeleteButton } from "@/components/protected-delete-button"

interface EntryActionsProps {
  entryId: string
  entryNumber: string
}

export function EntryActions({ entryId, entryNumber }: EntryActionsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete entry ${entryNumber}?`)) {
      return
    }

    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("entries").delete().eq("id", entryId)

      if (error) throw error

      router.push("/operations/entries")
      router.refresh()
    } catch (err) {
      console.error("Error deleting entry:", err)
      alert("Error deleting entry")
      setDeleting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <ProtectedEditButton
        href={`/operations/entries/${entryId}/edit`}
        label="Edit Entry"
        subject="Entry"
      />
      <ProtectedDeleteButton
        onDelete={handleDelete}
        label="Delete Entry"
        subject="Entry"
        disabled={deleting}
      />
    </div>
  )
}
