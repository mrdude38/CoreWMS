"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAbility } from "@/lib/casl/ability-context"
import { ArrowLeft, Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { LoadOrderScanVerification } from "@/lib/types"
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
  const [economicNumber, setEconomicNumber] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [canShip, setCanShip] = useState<boolean>(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [orderRes, verificationRes] = await Promise.all([
      api.get<any>(`/load-orders/${loadOrderId}`),
      api.get<LoadOrderScanVerification>(`/load-orders/${loadOrderId}/scan-verification`),
    ])

    if (orderRes.error) {
      setError("Failed to load load order")
      setLoadingData(false)
      return
    }

    if (orderRes.data) {
      const orderData = orderRes.data
      setLoadOrder(orderData)
      setEconomicNumber(orderData.economic_number || "")
      setNotes(orderData.notes || "")
      setSelectedStatus(
        orderData.status === "completed" ? "salida" : orderData.status === "open" || orderData.status === "in_progress" ? "pendiente" : orderData.status
      )

      const isExit = orderData.status === "salida" || orderData.status === "completed"
      const canEdit = isExit
        ? ability.can("update", "Exit")
        : ability.can("update", "LoadOrder")

      if (!canEdit) {
        router.push("/")
        return
      }
    }

    if (verificationRes.data) {
      setCanShip(verificationRes.data.can_ship)
    } else {
      setCanShip(true)
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
    const previousIsSalida = previousStatus === "salida" || previousStatus === "completed"
    const isChangingToSalida = selectedStatus === "salida" && !previousIsSalida

    if (isChangingToSalida && !canShip) {
      setError(
        "All packages must be scanned before shipping. Complete scan verification on the load order detail page first."
      )
      setLoading(false)
      return
    }

    const apiStatus =
      selectedStatus === "salida" ? "completed" : selectedStatus === "pendiente" ? "open" : selectedStatus

    try {
      const response = await api.patch(`/load-orders/${loadOrderId}/status`, {
        status: isChangingToSalida ? "completed" : apiStatus,
      })
      if (response.error) throw new Error(response.error)

      const updateRes = await api.patch(`/load-orders/${loadOrderId}`, {
        economic_number: economicNumber.trim() || null,
        notes: notes.trim() || null,
      })

      if (updateRes.error) {
        throw new Error(updateRes.error)
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
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pending</SelectItem>
                  <SelectItem value="salida" disabled={!canShip}>
                    Shipped {!canShip && "(scan all packages first)"}
                  </SelectItem>
                </SelectContent>
              </Select>
              {!canShip && loadOrder?.status !== "salida" && loadOrder?.status !== "completed" && (
                <p className="text-sm text-amber-600">
                  All packages must be scanned before shipping. Complete scan verification on the load order detail page.
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {selectedStatus === "pendiente"
                  ? "Order is pending and awaiting dispatch"
                  : "Order has been dispatched for delivery"}
              </p>
              {selectedStatus === "salida" && loadOrder?.status !== "salida" && loadOrder?.status !== "completed" && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                  <Mail className="h-4 w-4" />
                  <span>
                    An exit notification email will be sent to the client with all attached documents.
                  </span>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="economic_number">Economic Number</Label>
              <Input
                id="economic_number"
                value={economicNumber}
                onChange={(e) => setEconomicNumber(e.target.value)}
                placeholder="Enter economic number"
              />
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
