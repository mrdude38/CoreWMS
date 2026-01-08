import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import type { Supplier } from "@/lib/types"
import { requirePermission } from "@/lib/casl/server-guards"
import { ProtectedNewButton } from "@/components/protected-new-button"

async function getSuppliers() {
  await requirePermission('read', 'Catalog')
  const supabase = await createClient()
  const { data } = await supabase.from("suppliers").select("*").order("name", { ascending: true })

  return (data || []) as Supplier[]
}

async function SuppliersContent() {
  const suppliers = await getSuppliers()

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">Manage your supplier database</p>
        </div>
        <ProtectedNewButton
          href="/catalogs/suppliers/new"
          label="New Supplier"
          subject="Catalog"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
          <CardDescription>View and manage all suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No suppliers found</p>
              <ProtectedNewButton
                href="/catalogs/suppliers/new"
                label="Add your first supplier"
                subject="Catalog"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{supplier.name}</p>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {supplier.contact_name && <span>Contact: {supplier.contact_name}</span>}
                      {supplier.email && <span>{supplier.email}</span>}
                      {supplier.phone && <span>{supplier.phone}</span>}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/catalogs/suppliers/${supplier.id}`}>View</Link>
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
          <div className="text-muted-foreground">Loading suppliers...</div>
        </div>
      }
    >
      <SuppliersContent />
    </Suspense>
  )
}
