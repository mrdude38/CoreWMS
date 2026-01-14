"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { Upload, Plus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Client, Supplier, Carrier, PackageType, User } from "@/lib/types"
import { useAbility } from "@/lib/casl/ability-context"

export default function Page() {
  const router = useRouter()
  const ability = useAbility()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check permission on mount
  useEffect(() => {
    if (!ability.can('create', 'Entry')) {
      router.push('/')
    }
  }, [ability, router])

  // Data states
  const [clients, setClients] = useState<Client[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [packageTypes, setPackageTypes] = useState<PackageType[]>([])
  const [users, setUsers] = useState<User[]>([])

  // Form states
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [isDamaged, setIsDamaged] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  // Supplier dialog states
  const [showSupplierDialog, setShowSupplierDialog] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState("")
  const [newSupplierContact, setNewSupplierContact] = useState("")
  const [newSupplierEmail, setNewSupplierEmail] = useState("")
  const [newSupplierPhone, setNewSupplierPhone] = useState("")
  const [addingSupplier, setAddingSupplier] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedClientId) {
      filterSuppliersByClient(selectedClientId)
    } else {
      setFilteredSuppliers([])
    }
  }, [selectedClientId, suppliers])

  const loadData = async () => {
    const supabase = createClient()

    // Load all data in parallel
    const [clientsRes, suppliersRes, carriersRes, packageTypesRes, usersRes] = await Promise.all([
      supabase.from("clients").select("*").order("name"),
      supabase.from("suppliers").select("*").order("name"),
      supabase.from("carriers").select("*").order("name"),
      supabase.from("package_types").select("*").order("name"),
      supabase.from("users").select("*").order("name"),
    ])

    if (clientsRes.data) setClients(clientsRes.data)
    if (suppliersRes.data) setSuppliers(suppliersRes.data)
    if (carriersRes.data) setCarriers(carriersRes.data)
    if (packageTypesRes.data) setPackageTypes(packageTypesRes.data)
    if (usersRes.data) setUsers(usersRes.data)
  }

  const filterSuppliersByClient = async (clientId: string) => {
    // TODO: Implement client_suppliers table later
    // For now, show all suppliers
    setFilteredSuppliers(suppliers)
  }

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim()) return

    setAddingSupplier(true)
    try {
      const supabase = createClient()

      // Insert new supplier
      const { data: newSupplier, error: supplierError } = await supabase
        .from("suppliers")
        .insert({
          name: newSupplierName,
          contact_name: newSupplierContact,
          email: newSupplierEmail,
          phone: newSupplierPhone,
        })
        .select()
        .single()

      if (supplierError) throw supplierError

      // TODO: Link to selected client using client_suppliers table later

      // Refresh suppliers
      await loadData()
      if (selectedClientId) {
        await filterSuppliersByClient(selectedClientId)
      }

      // Reset form
      setNewSupplierName("")
      setNewSupplierContact("")
      setNewSupplierEmail("")
      setNewSupplierPhone("")
      setShowSupplierDialog(false)
    } catch (err) {
      console.error("Error adding supplier:", err)
      alert("Error adding supplier")
    } finally {
      setAddingSupplier(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const supabase = createClient()

      // Entry number will be auto-generated by trigger
      const entryData = {
        client_id: formData.get("client_id") as string,
        supplier_id: formData.get("supplier_id") as string,
        carrier_id: (formData.get("carrier_id") as string) || null,
        package_type_id: (formData.get("package_type") as string) || null,
        entry_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        status: formData.get("status") as string || "pendiente",
        total_packages: Number.parseInt(formData.get("total_packages") as string) || 0,
        total_weight_lbs: Number.parseFloat(formData.get("total_weight_lbs") as string) || null,
        received_by: (formData.get("received_by") as string) || null,
        description: (formData.get("description") as string) || null,
        notes: formData.get("notes") as string || null,
        is_damaged: isDamaged,
        damage_description: isDamaged ? (formData.get("damage_description") as string) : null,
      }

      const { data: entry, error: insertError } = await supabase
        .from("entries")
        .insert(entryData)
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message || insertError.details || insertError.hint || "Unknown error")
      }

      // Upload files if any
      if (files.length > 0 && entry) {
        for (const file of files) {
          const fileName = `${entry.id}/${Date.now()}-${file.name}`

          // Upload to Vercel Blob
          const uploadResponse = await fetch(`/api/upload?filename=${fileName}`, {
            method: "POST",
            body: file,
          })

          if (uploadResponse.ok) {
            const { url } = await uploadResponse.json()

            // Save attachment record
            await supabase.from("entry_attachments").insert({
              entry_id: entry.id,
              file_name: file.name,
              file_url: url,
              file_type: file.type,
              file_size: file.size,
            })
          }
        }
      }

      // Trigger email notification (fire and forget)
      if (entry) {
        fetch('/api/emails/entry-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryId: entry.id }),
          credentials: 'include', // Include auth cookies
        }).catch(console.error) // Don't block on email errors
      }

      router.push("/operations/entries")
    } catch (err) {
      console.error("Error creating entry:", err)
      setError(err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">New Entry</h1>
        <p className="text-muted-foreground">Create a new warehouse entry</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entry Details</CardTitle>
          <CardDescription>Entry number will be auto-generated</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Client - Required */}
              <div className="grid gap-2">
                <Label htmlFor="client_id" className="text-base">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select name="client_id" required value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier - Required with add option */}
              <div className="grid gap-2">
                <Label htmlFor="supplier_id" className="text-base">
                  Supplier <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Select name="supplier_id" required disabled={!selectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedClientId ? "Select supplier" : "Select client first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSuppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
                    <DialogTrigger asChild>
                      <Button type="button" size="icon" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Supplier</DialogTitle>
                        <DialogDescription>Create a new supplier for this entry</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="new_supplier_name">Supplier Name *</Label>
                          <Input
                            id="new_supplier_name"
                            value={newSupplierName}
                            onChange={(e) => setNewSupplierName(e.target.value)}
                            placeholder="Enter supplier name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new_supplier_contact">Contact Name</Label>
                          <Input
                            id="new_supplier_contact"
                            value={newSupplierContact}
                            onChange={(e) => setNewSupplierContact(e.target.value)}
                            placeholder="Enter contact name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new_supplier_email">Email</Label>
                          <Input
                            id="new_supplier_email"
                            type="email"
                            value={newSupplierEmail}
                            onChange={(e) => setNewSupplierEmail(e.target.value)}
                            placeholder="email@example.com"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new_supplier_phone">Phone</Label>
                          <Input
                            id="new_supplier_phone"
                            value={newSupplierPhone}
                            onChange={(e) => setNewSupplierPhone(e.target.value)}
                            placeholder="Enter phone number"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddSupplier}
                          disabled={!newSupplierName || addingSupplier}
                          className="w-full"
                        >
                          {addingSupplier ? "Adding..." : "Add Supplier"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Carrier */}
              <div className="grid gap-2">
                <Label htmlFor="carrier_id">Carrier</Label>
                <Select name="carrier_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.map((carrier) => (
                      <SelectItem key={carrier.id} value={carrier.id}>
                        {carrier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status - Required */}
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-base">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select name="status" defaultValue="pendiente" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pending</SelectItem>
                    <SelectItem value="recibido">Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Total Packages */}
              <div className="grid gap-2">
                <Label htmlFor="total_packages">Total Packages</Label>
                <Input
                  id="total_packages"
                  name="total_packages"
                  type="number"
                  placeholder="0"
                  defaultValue="0"
                  min="0"
                />
              </div>

              {/* Package Type */}
              <div className="grid gap-2">
                <Label htmlFor="package_type">Package Type</Label>
                <Select name="package_type">
                  <SelectTrigger>
                    <SelectValue placeholder="Select package type" />
                  </SelectTrigger>
                  <SelectContent>
                    {packageTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Total Weight */}
              <div className="grid gap-2">
                <Label htmlFor="total_weight_lbs">Total Weight (lbs)</Label>
                <Input
                  id="total_weight_lbs"
                  name="total_weight_lbs"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  min="0"
                />
              </div>

              {/* Received By */}
              <div className="grid gap-2">
                <Label htmlFor="received_by">Received By</Label>
                <Select name="received_by">
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description - Full width */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Merchandise description..." rows={2} />
            </div>

            {/* Notes - Full width */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Additional notes..." rows={3} />
            </div>

            {/* Attachments */}
            <div className="grid gap-2">
              <Label htmlFor="attachments">Attachments</Label>
              <div className="flex items-center gap-2">
                <Input id="attachments" type="file" multiple onChange={handleFileChange} className="hidden" />
                <Button type="button" variant="outline" onClick={() => document.getElementById("attachments")?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
                <span className="text-sm text-muted-foreground">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </span>
              </div>
              {files.length > 0 && (
                <div className="mt-2 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between rounded-md border bg-muted/50 p-2">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Damaged Checkbox with Description */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_damaged"
                  checked={isDamaged}
                  onCheckedChange={(checked) => setIsDamaged(checked === true)}
                />
                <Label htmlFor="is_damaged" className="text-base font-normal cursor-pointer">
                  Package arrived damaged
                </Label>
              </div>

              {isDamaged && (
                <div className="grid gap-2">
                  <Label htmlFor="damage_description">Damage Description</Label>
                  <Textarea
                    id="damage_description"
                    name="damage_description"
                    placeholder="Describe the damage..."
                    rows={3}
                  />
                </div>
              )}
            </div>

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Entry"}
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
