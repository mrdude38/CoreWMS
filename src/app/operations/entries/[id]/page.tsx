import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Download, FileText, ImageIcon, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { requirePermission } from "@/lib/casl/server-guards"
import { serverApi } from "@/lib/api/server"
import { EntryActions } from "./entry-actions"
import type { EntryAttachment } from "@/lib/types"

interface PageProps {
  params: Promise<{ id: string }>
}

interface EntryDetailResponse {
  data?: {
    id: string
    entry_number: string
    entry_date: string
    status: string
    total_packages?: number
    total_weight?: number
    is_damaged?: boolean
    damage_description?: string | null
    notes?: string | null
    created_at: string
    updated_at?: string | null
    client?: { id: string; name?: string }
    supplier?: { id: string; name?: string }
    carrier?: { id: string; name?: string }
    package_type?: string
    received_by?: string | null
    attachments?: EntryAttachment[]
  }
}

async function getEntry(id: string) {
  await requirePermission("read", "Entry")

  const res = await serverApi.get<EntryDetailResponse>(`entries/${id}`)
  const raw = (res as any).data ?? res
  const entry = raw?.data ?? raw

  if (!entry?.id) return null

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
      case "pending":
        return "Pending"
      case "recibido":
      case "received":
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
      case "received":
        return "default"
      case "pendiente":
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  const clientName = entry.client?.name ?? (entry as any).clients?.name
  const supplierName = entry.supplier?.name ?? (entry as any).suppliers?.name
  const carrierName = entry.carrier?.name ?? (entry as any).carriers?.name
  const packageTypeName = entry.package_type ?? (entry as any).package_types?.name
  const receivedByName = (entry as any).users?.name ?? (entry.received_by ? "—" : "N/A")
  const attachmentsList = entry.attachments ?? (entry as any).attachments ?? []

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
        <EntryActions
          entryId={entry.id}
          entryNumber={entry.entry_number}
          entryStatus={entry.status}
          clientName={clientName}
        />
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
                <p className="text-base">{clientName ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                <p className="text-base">{supplierName ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carrier</p>
                <p className="text-base">{carrierName ?? "N/A"}</p>
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
                <p className="text-base">{packageTypeName ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Weight</p>
                <p className="text-base">{entry.total_weight ? `${entry.total_weight} lbs` : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Received By</p>
                <p className="text-base">{receivedByName}</p>
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

        {/* Attachments */}
        {attachmentsList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>{attachmentsList.length} file(s) attached</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attachmentsList.map((attachment: EntryAttachment) => {
                  const isImage = attachment.file_type?.startsWith("image/")
                  const isPdf = attachment.file_type === "application/pdf"
                  const FileIcon = isImage ? ImageIcon : isPdf ? FileText : File

                  return (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-md border bg-muted/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{attachment.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : ""}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a href={attachment.blob_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </div>
                  )
                })}
              </div>
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
