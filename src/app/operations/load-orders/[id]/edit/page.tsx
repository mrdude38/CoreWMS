"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAbility } from "@/lib/casl/ability-context"
import { ArrowLeft, Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const loadOrderId = params.id as string
  const ability = useAbility()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)

  const [loadOrder, setLoadOrder] = useState<any>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>("pendiente")
  const [notes, setNotes] = useState<string>("")

  // Permission check is done after data loads to check if it's an exit

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const response = await api.get<any>(`/load-orders/${loadOrderId}`)

    if (response.error) {
      setError("Failed to load load order")
      setLoadingData(false)
      return
    }

    if (response.data) {
      const orderData = response.data
      setLoadOrder(orderData)
      setSelectedStatus(orderData.status)
      setNotes(orderData.notes || "")

      // Check permissions - exits (status=salida) can only be edited by admin
      const isExit = orderData.status === 'salida'
      const canEdit = isExit
        ? ability.can('update', 'Exit')
        : ability.can('update', 'LoadOrder')

      if (!canEdit) {
        router.push('/')
        return
      }
    }

    setLoadingData(false)
  }

  const sendExitNotification = async () => {
    setSendingEmail(true)
    try {
      const response = await api.post<{ attachmentsCount?: number }>('/emails/exit-notification', {
        load_order_id: loadOrderId,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Notification sent",
        description: `Exit email sent successfully with ${response.data?.attachmentsCount || 0} attachments.`,
      })
    } catch (err) {
      console.error("Error sending exit notification:", err)
      toast({
        title: "Error sending email",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const previousStatus = loadOrder?.status
    const isChangingToSalida = selectedStatus === "salida" && previousStatus !== "salida"

    try {
      const response = await api.patch(`/load-orders/${loadOrderId}`, {
        status: selectedStatus,
        notes: notes.trim() || null,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Send exit notification email when status changes to "salida"
      if (isChangingToSalida) {
        await sendExitNotification()
      }

      router.push(`/operations/load-orders/${loadOrderId}`)
    } catch (err) {
      console.error("Error updating load order:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-muted-foreground">Loading load order...</div>
      </div>
    )
  }

  if (!loadOrder) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-muted-foreground">Load order not found</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/operations/load-orders/${loadOrderId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Load Order
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Load Order {loadOrder.order_number}</h1>
        <p className="text-muted-foreground">Update load order status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Load Order Status</CardTitle>
          <CardDescription>Change the status of this load order</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pending</SelectItem>
                  <SelectItem value="salida">Shipped</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {selectedStatus === "pendiente"
                  ? "Order is pending and awaiting dispatch"
                  : "Order has been dispatched for delivery"}
              </p>
              {selectedStatus === "salida" && loadOrder?.status !== "salida" && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                  <Mail className="h-4 w-4" />
                  <span>
                    An exit notification email will be sent to the client with all attached documents.
                  </span>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for the load order..."
                rows={3}
              />
            </div>

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading || sendingEmail}>
                {loading || sendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {sendingEmail ? "Sending email..." : "Saving..."}
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/operations/load-orders/${loadOrderId}`)}
                disabled={loading || sendingEmail}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
