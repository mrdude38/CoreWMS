"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ProtectedEditButton } from "@/components/protected-edit-button"
import { ProtectedDeleteButton } from "@/components/protected-delete-button"

interface EntryActionsProps {
  entryId: string
  entryNumber: string
}

export function EntryActions({ entryId, entryNumber }: EntryActionsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

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

  const handleResendEmail = async () => {
    setSendingEmail(true)
    try {
      const response = await fetch('/api/emails/entry-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      const successCount = data.results?.filter((r: any) => r.success).length || 0
      alert(`Email notification sent successfully! (${successCount} emails sent)`)
    } catch (err) {
      console.error("Error sending email:", err)
      alert(err instanceof Error ? err.message : "Error sending email notification")
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleResendEmail}
        disabled={sendingEmail}
      >
        {sendingEmail ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        {sendingEmail ? "Sending..." : "Resend Email"}
      </Button>
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
