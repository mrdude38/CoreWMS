import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { serverApi } from "@/lib/api/server"
import type { LoadOrder } from "@/lib/types"

async function getShipments(): Promise<LoadOrder[]> {
  const res = await serverApi.get<{ data?: LoadOrder[] }>("load-orders", { status: "completed" })
  return Array.isArray(res.data) ? res.data : []
}

async function ShipmentsContent() {
  const shipments = await getShipments()

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/operations/load-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Load Orders
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
        <p className="text-muted-foreground">Load orders that have been dispatched</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shipments</CardTitle>
          <CardDescription>Load orders that have been completed (shipped)</CardDescription>
        </CardHeader>
        <CardContent>
          {shipments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No shipments found</p>
              <p className="text-sm">Completed load orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shipments.map((order: LoadOrder) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{order.order_number}</p>
                      <Badge variant="default">Shipped</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(order.client ?? order.clients)?.name ?? "No client"} • {(order.carrier ?? order.carriers)?.name ?? "No carrier"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{order.total_packages ?? 0} packages</span>
                      <span>•</span>
                      <span>Dispatched: {order.updated_at ? new Date(order.updated_at).toLocaleDateString() : "—"}</span>
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
          <div className="text-muted-foreground">Loading shipments...</div>
        </div>
      }
    >
      <ShipmentsContent />
    </Suspense>
  )
}
