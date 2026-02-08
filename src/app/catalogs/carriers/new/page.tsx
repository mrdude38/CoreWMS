"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAbility } from "@/lib/casl/ability-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"

export default function Page() {
  const router = useRouter()
  const ability = useAbility()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ability.can('create', 'Catalog')) {
      router.push('/')
    }
  }, [ability, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await api.post("catalogs/carriers", {
        name: formData.get("name") as string,
        contact_name: (formData.get("contact_name") as string) || undefined,
        email: (formData.get("email") as string) || undefined,
        phone: (formData.get("phone") as string) || undefined,
        license_plate: (formData.get("license_plate") as string) || undefined,
      })
      if ((res as any).error) throw new Error((res as any).error)
      router.push("/catalogs/carriers")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">New Carrier</h1>
        <p className="text-muted-foreground">Add a new carrier to the system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carrier Information</CardTitle>
          <CardDescription>Fill in the carrier details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input id="name" name="name" required placeholder="Enter carrier name" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input id="contact_name" name="contact_name" placeholder="Enter contact person name" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="carrier@example.com" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="license_plate">License Plate</Label>
                <Input id="license_plate" name="license_plate" placeholder="ABC-1234" />
              </div>
            </div>

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Carrier"}
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
