import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import type { LoadOrder } from "@/lib/types"

async function getExits() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("load_orders")
    .select("*, clients(name), carriers(name), entries(entry_number)")
    .eq("status", "salida")
    .order("created_at", { ascending: false })

  return (data || []) as LoadOrder[]
}

async function ExitsContent() {
  const exits = await getExits()

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Exits</h1>
        <p className="text-muted-foreground">Load orders marked as exits (Salida)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Exits</CardTitle>
          <CardDescription>View all load orders that have been marked as exits</CardDescription>
        </CardHeader>
        <CardContent>
          {exits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No exits found</p>
              <p className="text-sm mt-2">Load orders with status "Salida" will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exits.map((exit) => (
                <div key={exit.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{exit.order_number}</p>
                      <Badge variant="default">Salida</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(exit as any).clients?.name || "No client"} • {(exit as any).carriers?.name || "No carrier"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Entry: {(exit as any).entries?.entry_number || "N/A"}</span>
                      <span>•</span>
                      <span>{exit.total_packages} packages</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
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
