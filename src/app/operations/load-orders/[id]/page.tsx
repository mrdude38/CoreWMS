"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Truck, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ProtectedEditButton } from "@/components/protected-edit-button"
import { ProtectedDeleteButton } from "@/components/protected-delete-button"
import { ScanVerificationPanel } from "@/components/barcode/scan-verification-panel"
import type { LoadOrderScanVerification } from "@/lib/types"
import { api } from "@/lib/api"

interface LoadOrderItem {
  id: string
  entry_id: string
  packages_quantity: number
  is_partial?: boolean
  entry?: { entry_number: string; total_packages: number }
  entries?: { entry_number: string; total_packages: number }
}

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loadOrder, setLoadOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [shipping, setShipping] = useState(false)
  const [scanVerification, setScanVerification] = useState<LoadOrderScanVerification | null>(null)

  const loadData = useCallback(async () => {
    if (!id) return
    const res = await api.get<any>(`/load-orders/${id}`)
    if (res.error || !res.data) {
      setLoadOrder(null)
      setLoading(false)
      return
    }
    const order = res.data
    setLoadOrder({
      ...order,
      items: order.items ?? [],
    })
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await api.delete(`/load-orders/${id}`)
      if (res.error) throw new Error(res.error)
      router.push("/operations/load-orders")
    } catch (err) {
      console.error("Error deleting load order:", err)
      alert("Error deleting load order")
      setDeleting(false)
    }
  }

  const handleShip = async () => {
    setShipping(true)
    try {
      const res = await api.patch(`/load-orders/${id}/status`, { status: "completed" })
      if (res.error) throw new Error(res.error)
      await loadData()
      setScanVerification(null)
        // Refetch verification (panel will refetch when it re-mounts or we could pass a key)
    } catch (err) {
      console.error("Error shipping load order:", err)
      alert(err instanceof Error ? err.message : "Failed to ship")
    } finally {
      setShipping(false)
    }
  }

  if (loading) {
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendiente":
      case "open":
      case "in_progress":
        return "Pending"
      case "salida":
      case "completed":
        return "Shipped"
      case "cancelled":
        return "Cancelled"
      default:
        return status
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "salida":
      case "completed":
        return "default"
      case "pendiente":
      case "open":
      case "in_progress":
        return "secondary"
      default:
        return "outline"
    }
  }

  const isShipped =
    loadOrder.status === "salida" || loadOrder.status === "completed"
  const canShip =
    !isShipped &&
    (scanVerification?.can_ship ?? loadOrder.scan_verified === true)
  const clientName =
    loadOrder.clients?.name ?? (loadOrder as any).client?.name ?? "N/A"
  const carrierName =
    loadOrder.carriers?.name ?? (loadOrder as any).carrier?.name ?? "N/A"
  const items: LoadOrderItem[] = loadOrder.items ?? []

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/operations/load-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Load Orders
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Load Order {loadOrder.order_number}</h1>
          <p className="text-muted-foreground">Load order details and information</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canShip && (
            <Button onClick={handleShip} disabled={shipping}>
              {shipping ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Truck className="mr-2 h-4 w-4" />
              )}
              {shipping ? "Shipping..." : "Ship / Mark as Shipped"}
            </Button>
          )}
          <ProtectedEditButton
            href={`/operations/load-orders/${loadOrder.id}/edit`}
            label="Edit"
            subject={isShipped ? "Exit" : "LoadOrder"}
          />
          <ProtectedDeleteButton
            onDelete={() => {
              if (confirm(`Are you sure you want to delete load order ${loadOrder.order_number}?`)) {
                handleDelete()
              }
            }}
            label="Delete"
            subject={isShipped ? "Exit" : "LoadOrder"}
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* General Information */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Basic load order details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                <p className="text-base">{loadOrder.order_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={getStatusVariant(loadOrder.status)}>{getStatusLabel(loadOrder.status)}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="text-base">{clientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carrier</p>
                <p className="text-base">{carrierName}</p>
              </div>
              {(loadOrder.scan_verified ?? false) && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Scan verified</span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Packages</p>
                <p className="text-base">{loadOrder.total_packages || 0}</p>
              </div>
              {loadOrder.pedimento_invoice_number && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pedimento/Invoice Number</p>
                  <p className="text-base">{loadOrder.pedimento_invoice_number}</p>
                </div>
              )}
              {loadOrder.economic_number && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Economic Number</p>
                  <p className="text-base">{loadOrder.economic_number}</p>
                </div>
              )}
              {loadOrder.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-base">{loadOrder.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scan verification */}
        {!isShipped && (
          <ScanVerificationPanel
            loadOrderId={loadOrder.id}
            onVerificationChange={setScanVerification}
          />
        )}

        {/* Entries/Items */}
        <Card>
          <CardHeader>
            <CardTitle>Entries ({items.length})</CardTitle>
            <CardDescription>Entries included in this load order</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No entries in this load order</div>
            ) : (
              <div className="space-y-3">
                {items.map((item: LoadOrderItem) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{(item.entry ?? item.entries)?.entry_number ?? "Unknown Entry"}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.packages_quantity} of {(item.entry ?? item.entries)?.total_packages ?? 0} packages
                        {item.is_partial && " (Partial)"}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/operations/entries/${item.entry_id}`}>View Entry</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-base">{new Date(loadOrder.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Updated At</p>
                <p className="text-base">{new Date(loadOrder.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}