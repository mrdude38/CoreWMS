import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { serverApi } from "@/lib/api/server"
import { requirePermission } from "@/lib/casl/server-guards"
import { getClientFilter } from "@/lib/casl/client-filter"
import { CheckCircle2, XCircle } from "lucide-react"

async function getEntries() {
  await requirePermission("read", "Entry")

  const clientId = await getClientFilter()
  const params: Record<string, string | number> = { page: 1, page_size: 500 }
  if (clientId) params.client_id = clientId

  const res = await serverApi.get<{ data?: any[] }>("entries", params as any)
  const raw = (res as any).data ?? res
  return Array.isArray((raw as any).data) ? (raw as any).data : []
}

function InspectionStatus({ completed, label }: { completed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {completed ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

async function InspectionsContent() {
  const entries = await getEntries()

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "received":
      case "recibido":
        return "secondary"
      default:
        return "outline"
    }
  }

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      'pendiente': 'Pending',
      'recibido': 'Received',
      'received': 'Received',
      'pending': 'Pending',
      'completed': 'Completed',
    }
    return translations[status.toLowerCase()] || status
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inspections</h1>
          <p className="text-muted-foreground">Review and inspect warehouse entries</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entry Inspections</CardTitle>
          <CardDescription>Track inspection status for all entries</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No entries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.entry_number}</p>
                      <Badge variant={getStatusVariant(entry.status)}>{translateStatus(entry.status)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(entry.client ?? entry.clients)?.name ?? "No client"} • {(entry.supplier ?? entry.suppliers)?.name ?? "No supplier"}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <InspectionStatus completed={entry.has_invoice ?? false} label="Invoice" />
                      <InspectionStatus completed={entry.has_revision ?? false} label="Revision" />
                      <InspectionStatus completed={entry.has_classification ?? false} label="Classification" />
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/operations/inspections/${entry.id}`}>Inspect</Link>
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
          <div className="text-muted-foreground">Loading inspections...</div>
        </div>
      }
    >
      <InspectionsContent />
    </Suspense>
  )
}
