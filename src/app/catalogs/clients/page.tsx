import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import type { Client } from "@/lib/types"
import { requirePermission } from "@/lib/casl/server-guards"
import { ProtectedNewButton } from "@/components/protected-new-button"

async function getClients() {
  await requirePermission('read', 'Catalog')
  const supabase = await createClient()
  const { data } = await supabase.from("clients").select("*").order("name", { ascending: true })

  return (data || []) as Client[]
}

async function ClientsContent() {
  const clients = await getClients()

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your client database</p>
        </div>
        <ProtectedNewButton
          href="/catalogs/clients/new"
          label="New Client"
          subject="Catalog"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>View and manage all clients</CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No clients found</p>
              <ProtectedNewButton
                href="/catalogs/clients/new"
                label="Add your first client"
                subject="Catalog"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{client.name}</p>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {client.contact_name && <span>Contact: {client.contact_name}</span>}
                      {client.email && <span>{client.email}</span>}
                      {client.phone && <span>{client.phone}</span>}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/catalogs/clients/${client.id}`}>View</Link>
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
          <div className="text-muted-foreground">Loading clients...</div>
        </div>
      }
    >
      <ClientsContent />
    </Suspense>
  )
}
