"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
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
import { createClient } from "@/lib/supabase/client"
import { ProtectedEditButton } from "@/components/protected-edit-button"
import { ProtectedDeleteButton } from "@/components/protected-delete-button"

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loadOrder, setLoadOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    const supabase = createClient()

    const { data: orderData } = await supabase
      .from("load_orders")
      .select(`
        *,
        clients(name),
        carriers(name)
      `)
      .eq("id", id)
      .single()

    if (!orderData) {
      setLoading(false)
      return
    }

    // Get load order items with entry details
    const { data: items } = await supabase
      .from("load_order_items")
      .select(`
        *,
        entries(entry_number, total_packages)
      `)
      .eq("load_order_id", id)

    setLoadOrder({
      ...orderData,
      items: items || [],
    })
    setLoading(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const supabase = createClient()

      // Delete load order (items will be deleted automatically due to CASCADE)
      const { error } = await supabase.from("load_orders").delete().eq("id", id)

      if (error) throw error

      router.push("/operations/load-orders")
    } catch (err) {
      console.error("Error deleting load order:", err)
      alert("Error deleting load order")
      setDeleting(false)
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
        return "Pendiente"
      case "salida":
        return "Salida"
      default:
        return status
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "salida":
        return "default"
      case "pendiente":
        return "secondary"
      default:
        return "outline"
    }
  }

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
        <div className="flex gap-2">
          <ProtectedEditButton
            href={`/operations/load-orders/${loadOrder.id}/edit`}
            label="Edit"
            subject={loadOrder.status === 'salida' ? 'Exit' : 'LoadOrder'}
          />
          <ProtectedDeleteButton
            onDelete={() => {
              if (confirm(`Are you sure you want to delete load order ${loadOrder.order_number}?`)) {
                handleDelete()
              }
            }}
            label="Delete"
            subject={loadOrder.status === 'salida' ? 'Exit' : 'LoadOrder'}
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
                <p className="text-base">{loadOrder.clients?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carrier</p>
                <p className="text-base">{loadOrder.carriers?.name || "N/A"}</p>
              </div>
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
            </div>
          </CardContent>
        </Card>

        {/* Entries/Items */}
        <Card>
          <CardHeader>
            <CardTitle>Entries ({loadOrder.items.length})</CardTitle>
            <CardDescription>Entries included in this load order</CardDescription>
          </CardHeader>
          <CardContent>
            {loadOrder.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No entries in this load order</div>
            ) : (
              <div className="space-y-3">
                {loadOrder.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.entries?.entry_number || "Unknown Entry"}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.packages_quantity} of {item.entries?.total_packages || 0} packages
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