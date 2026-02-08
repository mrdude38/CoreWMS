import { Suspense } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { serverApi } from "@/lib/api/server"

async function getExits() {
  const res = await serverApi.get<{ data?: any[] }>("load-orders", { status: "completed" })
  const raw = (res as any).data ?? res
  return Array.isArray((raw as any).data) ? (raw as any).data : []
}

async function ExitsContent() {
  const exits = await getExits()

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Exits</h1>
        <p className="text-muted-foreground">Load orders that have been completed (exits)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Exits</CardTitle>
          <CardDescription>View all completed load orders (exits)</CardDescription>
        </CardHeader>
        <CardContent>
          {exits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No exits found</p>
              <p className="text-sm mt-2">Completed load orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exits.map((exit) => (
                <div key={exit.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{exit.order_number}</p>
                      <Badge variant="default">Completed</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(exit.client ?? exit.clients)?.name ?? "No client"} • {(exit.carrier ?? exit.carriers)?.name ?? "No carrier"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{exit.total_packages ?? 0} packages</span>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/operations/load-orders/${exit.id}`}>View Details</Link>
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
          <div className="text-muted-foreground">Loading exits...</div>
        </div>
      }
    >
      <ExitsContent />
    </Suspense>
  )
}
