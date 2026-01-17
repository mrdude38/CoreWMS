"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useAbility } from "@/lib/casl/ability-context"

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const entryId = params.id as string
  const ability = useAbility()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [entry, setEntry] = useState<any>(null)

  // Inspection states
  const [hasInvoice, setHasInvoice] = useState(false)
  const [hasRevision, setHasRevision] = useState(false)
  const [hasClassification, setHasClassification] = useState(false)

  useEffect(() => {
    if (!ability.can('read', 'Entry')) {
      router.push('/')
    }
  }, [ability, router])

  useEffect(() => {
    loadEntry()
  }, [entryId])

  const loadEntry = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("entries")
      .select(`
        *,
        clients(name),
        suppliers(name),
        carriers(name)
      `)
      .eq("id", entryId)
      .single()

    if (data) {
      setEntry(data)
      setHasInvoice(data.has_invoice ?? false)
      setHasRevision(data.has_revision ?? false)
      setHasClassification(data.has_classification ?? false)
    }

    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)

    const supabase = createClient()

    const { error } = await supabase
      .from("entries")
      .update({
        has_invoice: hasInvoice,
        has_revision: hasRevision,
        has_classification: hasClassification,
      })
      .eq("id", entryId)

    if (error) {
      console.error("Error saving inspection:", error)
      alert("Error saving inspection")
    } else {
      router.push("/operations/inspections")
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-muted-foreground">Loading entry...</div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-muted-foreground">Entry not found</div>
      </div>
    )
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
          <Link href="/operations/inspections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inspections
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Inspect Entry {entry.entry_number}</h1>
        <p className="text-muted-foreground">Review and update inspection status</p>
      </div>

      <div className="space-y-6">
        {/* Entry Information */}
        <Card>
          <CardHeader>
            <CardTitle>Entry Information</CardTitle>
            <CardDescription>Basic entry details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entry Number</p>
                <p className="text-base">{entry.entry_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={getStatusVariant(entry.status)}>{entry.status}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="text-base">{entry.clients?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                <p className="text-base">{entry.suppliers?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entry Date</p>
                <p className="text-base">{new Date(entry.entry_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Packages</p>
                <p className="text-base">{entry.total_packages}</p>
              </div>
              {entry.description && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-base">{entry.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inspection Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Checklist</CardTitle>
            <CardDescription>Mark each item as completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Factura */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {hasInvoice ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <Label htmlFor="has_invoice" className="text-base font-medium cursor-pointer">
                      Factura
                    </Label>
                    <p className="text-sm text-muted-foreground">Entry has associated invoice documentation</p>
                  </div>
                </div>
                <Checkbox
                  id="has_invoice"
                  checked={hasInvoice}
                  onCheckedChange={(checked) => setHasInvoice(checked === true)}
                  className="h-6 w-6"
                />
              </div>

              {/* Revision */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {hasRevision ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <Label htmlFor="has_revision" className="text-base font-medium cursor-pointer">
                      Revision
                    </Label>
                    <p className="text-sm text-muted-foreground">Entry has been physically reviewed</p>
                  </div>
                </div>
                <Checkbox
                  id="has_revision"
                  checked={hasRevision}
                  onCheckedChange={(checked) => setHasRevision(checked === true)}
                  className="h-6 w-6"
                />
              </div>

              {/* Clasificacion */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {hasClassification ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <Label htmlFor="has_classification" className="text-base font-medium cursor-pointer">
                      Clasificacion
                    </Label>
                    <p className="text-sm text-muted-foreground">Entry has been properly classified</p>
                  </div>
                </div>
                <Checkbox
                  id="has_classification"
                  checked={hasClassification}
                  onCheckedChange={(checked) => setHasClassification(checked === true)}
                  className="h-6 w-6"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Inspection"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/operations/inspections")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
