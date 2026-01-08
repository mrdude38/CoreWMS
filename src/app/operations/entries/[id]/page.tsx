import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/casl/server-guards"
import { EntryActions } from "./entry-actions"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getEntry(id: string) {
  await requirePermission('read', 'Entry')

  const supabase = await createClient()

  // First, get the entry with basic relations
  const { data: entry, error } = await supabase
    .from("entries")
    .select(`
      *,
      clients(name),
      suppliers(name)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error('Error fetching entry:', error)
    return null
  }

  if (!entry) return null

  // Get additional relations separately if they exist
  if (entry.carrier_id) {
    const { data: carrier } = await supabase
      .from("carriers")
      .select("name")
      .eq("id", entry.carrier_id)
      .single()
    if (carrier) {
      (entry as any).carriers = carrier
    }
  }

  if (entry.package_type_id) {
    const { data: packageType } = await supabase
      .from("package_types")
      .select("name")
      .eq("id", entry.package_type_id)
      .single()
    if (packageType) {
      (entry as any).package_types = packageType
    }
  }

  if (entry.received_by) {
    const { data: user } = await supabase
      .from("users")
      .select("name")
      .eq("id", entry.received_by)
      .single()
    if (user) {
      (entry as any).users = user
    }
  }

  return entry
}

async function EntryDetail({ id }: { id: string }) {
  const entry = await getEntry(id)

  if (!entry) {
    notFound()
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendiente":
        return "Pending"
      case "recibido":
        return "Received"
      case "salida":
        return "Out for Delivery"
      default:
        return status
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "recibido":
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
          <Link href="/operations/entries">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Entries
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entry {entry.entry_number}</h1>
          <p className="text-muted-foreground">Entry details and information</p>
        </div>
        <EntryActions entryId={entry.id} entryNumber={entry.entry_number} />
      </div>

      <div className="space-y-6">
        {/* General Information */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Basic entry details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entry Number</p>
                <p className="text-base">{entry.entry_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={getStatusVariant(entry.status)}>{getStatusLabel(entry.status)}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entry Date</p>
                <p className="text-base">{new Date(entry.entry_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="text-base">{(entry as any).clients?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                <p className="text-base">{(entry as any).suppliers?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carrier</p>
                <p className="text-base">{(entry as any).carriers?.name || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Information */}
        <Card>
          <CardHeader>
            <CardTitle>Package Information</CardTitle>
            <CardDescription>Details about the packages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Packages</p>
                <p className="text-base">{entry.total_packages || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Package Type</p>
                <p className="text-base">{(entry as any).package_types?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Weight</p>
                <p className="text-base">{entry.total_weight ? `${entry.total_weight} lbs` : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Received By</p>
                <p className="text-base">{(entry as any).users?.name || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Damage Information */}
        {entry.is_damaged && (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Damage Report</CardTitle>
              <CardDescription>Package arrived with damage</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Damage Description</p>
                <p className="text-base">{entry.damage_description || "No description provided"}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        {entry.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base whitespace-pre-wrap">{entry.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-base">{new Date(entry.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Updated At</p>
                <p className="text-base">{new Date(entry.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default async function Page({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-muted-foreground">Loading entry...</div>
        </div>
      }
    >
      <EntryDetail id={id} />
    </Suspense>
  )
}
