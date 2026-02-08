"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProtectedEditButton } from "@/components/protected-edit-button"
import { ProtectedDeleteButton } from "@/components/protected-delete-button"
import { PrintLabelsDialog } from "@/components/barcode/print-labels-dialog"
import { api } from "@/lib/api"

interface EntryActionsProps {
  entryId: string
  entryNumber: string
  entryStatus?: string
  clientName?: string
}

export function EntryActions({
  entryId,
  entryNumber,
  entryStatus,
  clientName,
}: EntryActionsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [printLabelsOpen, setPrintLabelsOpen] = useState(false)

  const canPrintLabels =
    (entryStatus === "recibido" || entryStatus === "received") && !!entryId

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete entry ${entryNumber}?`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await api.delete(`/entries/${entryId}`)

      if (response.error) throw new Error(response.error)

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
      const response = await api.post('/emails/entry-notification', { entryId })

      if (response.error) {
        throw new Error(response.error)
      }

      const successCount = (response.data as any)?.results?.filter((r: any) => r.success).length || 0
      alert(`Email notification sent successfully! (${successCount} emails sent)`)
    } catch (err) {
      console.error("Error sending email:", err)
      alert(err instanceof Error ? err.message : "Error sending email notification")
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canPrintLabels && (
        <Button
          variant="outline"
          onClick={() => setPrintLabelsOpen(true)}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Labels
        </Button>
      )}
      <PrintLabelsDialog
        open={printLabelsOpen}
        onOpenChange={setPrintLabelsOpen}
        entryId={entryId}
        entryNumber={entryNumber}
        clientName={clientName}
      />
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
