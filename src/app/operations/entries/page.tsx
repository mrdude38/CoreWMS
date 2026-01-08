import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import type { Entry } from "@/lib/types"
import { requirePermission } from "@/lib/casl/server-guards"
import { ProtectedNewButton } from "@/components/protected-new-button"
import { getClientFilter } from "@/lib/casl/client-filter"

async function getEntries() {
  await requirePermission('read', 'Entry')

  const supabase = await createClient()

  // Get client filter if applicable
  const clientId = await getClientFilter()

  let query = supabase
    .from("entries")
    .select("*, clients(name), suppliers(name)")
    .order("created_at", { ascending: false })

  // Apply client filter for client users
  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data } = await query

  return (data || []) as Entry[]
}

async function EntriesContent() {
  const entries = await getEntries()

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "received":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entries</h1>
          <p className="text-muted-foreground">Manage warehouse entries and receipts</p>
        </div>
        <ProtectedNewButton
          href="/operations/entries/new"
          label="New Entry"
          subject="Entry"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Entries</CardTitle>
          <CardDescription>View and manage all warehouse entries</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No entries found</p>
              <ProtectedNewButton
                href="/operations/entries/new"
                label="Create your first entry"
                subject="Entry"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.entry_number}</p>
                      <Badge variant={getStatusVariant(entry.status)}>{entry.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(entry as any).clients?.name || "No client"} • {(entry as any).suppliers?.name || "No supplier"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(entry.entry_date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{entry.total_packages} packages</span>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/operations/entries/${entry.id}`}>View</Link>
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
          <div className="text-muted-foreground">Loading entries...</div>
        </div>
      }
    >
      <EntriesContent />
    </Suspense>
  )
}
