import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { LoadOrder } from "@/lib/types"
import { requirePermission } from "@/lib/casl/server-guards"
import { ProtectedNewButton } from "@/components/protected-new-button"
import { createServerServices } from "@/lib/api/server"

async function getLoadOrders() {
  await requirePermission('read', 'LoadOrder')

  const { loadOrders } = createServerServices()
  const response = await loadOrders.getAll({ page: 1, page_size: 50 })
  
  if (response.error) {
    console.error('Failed to fetch load orders:', response.error)
    return []
  }

  // Handle both paginated response and direct array
  if (Array.isArray(response.data)) {
    return response.data as LoadOrder[]
  }
  
  return (response.data?.data || response.data || []) as LoadOrder[]
}

async function LoadOrdersContent() {
  const loadOrders = await getLoadOrders()

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "in_progress":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Load Orders</h1>
          <p className="text-muted-foreground">Manage load orders and shipments</p>
        </div>
        <ProtectedNewButton
          href="/operations/load-orders/new"
          label="New Load Order"
          subject="LoadOrder"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Load Orders</CardTitle>
          <CardDescription>View and manage all load orders</CardDescription>
        </CardHeader>
        <CardContent>
          {loadOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No load orders found</p>
              <ProtectedNewButton
                href="/operations/load-orders/new"
                label="Create your first load order"
                subject="LoadOrder"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {loadOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{order.order_number}</p>
                      <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.clients?.name || (order as any).client?.name || "No client"} • {order.carriers?.name || (order as any).carrier?.name || "No carrier"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{order.total_packages} packages</span>
                      {order.destination && (
                        <>
                          <span>•</span>
                          <span>{order.destination}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/operations/load-orders/${order.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-muted-foreground">Loading load orders...</div>
        </div>
      }
    >
      <LoadOrdersContent />
    </Suspense>
  )
}
