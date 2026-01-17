"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAbility } from "@/lib/casl/ability-context"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const loadOrderId = params.id as string
  const ability = useAbility()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [loadOrder, setLoadOrder] = useState<any>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>("pendiente")

  // Permission check is done after data loads to check if it's an exit

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    const { data: orderData, error: orderError } = await supabase
      .from("load_orders")
      .select("*")
      .eq("id", loadOrderId)
      .single()

    if (orderError) {
      setError("Failed to load load order")
      setLoadingData(false)
      return
    }

    if (orderData) {
      setLoadOrder(orderData)
      setSelectedStatus(orderData.status)

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from("load_orders")
        .update({
          status: selectedStatus,
        })
        .eq("id", loadOrderId)

      if (updateError) {
        throw new Error(updateError.message || updateError.details || updateError.hint || "Unknown error")
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
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {selectedStatus === "pendiente"
                  ? "Order is pending and awaiting dispatch"
                  : "Order has been dispatched for delivery"}
              </p>
            </div>

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/operations/load-orders/${loadOrderId}`)}
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
