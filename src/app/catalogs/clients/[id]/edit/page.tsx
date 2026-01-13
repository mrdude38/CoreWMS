"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAbility } from "@/lib/casl/ability-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Loader2 } from "lucide-react"
import type { Client } from "@/lib/types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function Page({ params }: PageProps) {
  const router = useRouter()
  const ability = useAbility()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)

  // Get client ID from params
  useEffect(() => {
    params.then(({ id }) => setClientId(id))
  }, [params])

  // Load client data
  useEffect(() => {
    if (!clientId) return

    const loadClient = async () => {
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .single()

        if (fetchError) throw fetchError
        setClient(data as Client)
      } catch (err) {
        console.error('Error loading client:', err)
        setError('Failed to load client data')
      } finally {
        setInitialLoading(false)
      }
    }

    loadClient()
  }, [clientId])

  // Check permissions after ability is loaded
  useEffect(() => {
    // Wait until ability has rules loaded (not empty)
    if (ability.rules.length === 0) return

    if (!ability.can('update', 'Catalog')) {
      router.push('/')
    }
  }, [ability, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!clientId) return

    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          name: formData.get("name") as string,
          contact_name: formData.get("contact_name") as string || null,
          email: formData.get("email") as string || null,
          phone: formData.get("phone") as string || null,
          address: formData.get("address") as string || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId)

      if (updateError) {
        console.error('Update error:', updateError)
        throw updateError
      }

      router.push(`/catalogs/clients/${clientId}`)
    } catch (err) {
      console.error('Error updating client:', err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Client Not Found</h1>
          <p className="text-muted-foreground">The requested client could not be found</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/catalogs/clients">Back to Clients</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/catalogs/clients/${clientId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Client
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
        <p className="text-muted-foreground">Update client information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Update the client details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Enter client name"
                  defaultValue={client.name}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  name="contact_name"
                  placeholder="Enter contact person name"
                  defaultValue={client.contact_name || ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="client@example.com"
                  defaultValue={client.email || ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  defaultValue={client.phone || ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Enter full address"
                  rows={3}
                  defaultValue={client.address || ""}
                />
              </div>
            </div>

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
