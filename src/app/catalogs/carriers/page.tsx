import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Carrier } from "@/lib/types"
import { requirePermission } from "@/lib/casl/server-guards"
import { ProtectedNewButton } from "@/components/protected-new-button"
import { createServerServices } from "@/lib/api/server"

async function getCarriers() {
  await requirePermission('read', 'Catalog')
  
  const { carriers } = createServerServices()
  const response = await carriers.getAll()
  
  if (response.error) {
    console.error('Failed to fetch carriers:', response.error)
    return []
  }
  
  return (response.data || []) as Carrier[]
}

async function CarriersContent() {
  const carriers = await getCarriers()

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carriers</h1>
          <p className="text-muted-foreground">Manage your carrier database</p>
        </div>
        <ProtectedNewButton
          href="/catalogs/carriers/new"
          label="New Carrier"
          subject="Catalog"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Carriers</CardTitle>
          <CardDescription>View and manage all carriers</CardDescription>
        </CardHeader>
        <CardContent>
          {carriers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No carriers found</p>
              <ProtectedNewButton
                href="/catalogs/carriers/new"
                label="Add your first carrier"
                subject="Catalog"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {carriers.map((carrier) => (
                <div
                  key={carrier.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{carrier.name}</p>
                      {carrier.license_plate && (
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{carrier.license_plate}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {carrier.contact_name && <span>Contact: {carrier.contact_name}</span>}
                      {carrier.email && <span>{carrier.email}</span>}
                      {carrier.phone && <span>{carrier.phone}</span>}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/catalogs/carriers/${carrier.id}`}>View</Link>
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
          <div className="text-muted-foreground">Loading carriers...</div>
        </div>
      }
    >
      <CarriersContent />
    </Suspense>
  )
}
