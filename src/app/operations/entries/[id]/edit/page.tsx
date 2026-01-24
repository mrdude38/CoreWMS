"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, ArrowLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Client, Supplier, Carrier, PackageType, UserProfile, Entry } from "@/lib/types"
import Link from "next/link"
import { useAbility } from "@/lib/casl/ability-context"
import { api } from "@/lib/api"

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const entryId = params.id as string
  const ability = useAbility()

  // Check permission on mount
  useEffect(() => {
    if (!ability.can('update', 'Entry')) {
      router.push('/')
    }
  }, [ability, router])

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [entry, setEntry] = useState<Entry | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [packageTypes, setPackageTypes] = useState<PackageType[]>([])
  const [operators, setOperators] = useState<UserProfile[]>([])

  // Form states
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>("")
  const [trackingNumber, setTrackingNumber] = useState<string>("")
  const [poNumber, setPoNumber] = useState<string>("")
  const [maniobrasEntryNumber, setManiobrasEntryNumber] = useState<string>("")
  const [selectedPackageTypeId, setSelectedPackageTypeId] = useState<string>("")
  const [selectedReceivedBy, setSelectedReceivedBy] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("pendiente")
  const [totalPackages, setTotalPackages] = useState<string>("0")
  const [totalWeight, setTotalWeight] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isDamaged, setIsDamaged] = useState(false)
  const [damageDescription, setDamageDescription] = useState<string>("")

  // Supplier dialog states
  const [showSupplierDialog, setShowSupplierDialog] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState("")
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
    // Load all data in parallel using backend APIs
    const [entryRes, clientsRes, suppliersRes, carriersRes, packageTypesRes, operatorsRes] = await Promise.all([
      api.get<Entry>(`/entries/${entryId}`),
      api.get<Client[]>('/catalogs/clients'),
      api.get<Supplier[]>('/catalogs/suppliers'),
      api.get<Carrier[]>('/catalogs/carriers'),
      api.get<PackageType[]>('/catalogs/package-types'),
      api.get<UserProfile[]>('/catalogs/operators'),
    ])

    if (clientsRes.data) setClients(clientsRes.data)
    if (suppliersRes.data) setSuppliers(suppliersRes.data)
    if (carriersRes.data) setCarriers(carriersRes.data)
    if (packageTypesRes.data) setPackageTypes(packageTypesRes.data)
    if (operatorsRes.data) setOperators(operatorsRes.data)

    if (entryRes.data) {
      const entryData = entryRes.data as Entry
      setEntry(entryData)

      // Pre-fill form
      setSelectedClientId(entryData.client_id || "")
      setSelectedSupplierId(entryData.supplier_id || "")
      setSelectedCarrierId(entryData.carrier_id || "")
      setTrackingNumber(entryData.tracking_number || "")
      setPoNumber(entryData.po_number || "")
      setManiobrasEntryNumber((entryData as any).maniobras_entry_number || "")
      setSelectedPackageTypeId((entryData as any).package_type_id || "")
      setSelectedReceivedBy(entryData.received_by || "")
      setSelectedStatus(entryData.status)
      setTotalPackages(entryData.total_packages?.toString() || "0")
      setTotalWeight(entryData.total_weight?.toString() || "")
      setDescription(entryData.description || "")
      setNotes(entryData.notes || "")
      setIsDamaged(entryData.is_damaged || false)
      setDamageDescription(entryData.damage_description || "")
    }

    setLoadingData(false)
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
      const response = await api.post<Supplier>('/catalogs/suppliers', {
        name: newSupplierName,
      })

      if (response.error) throw new Error(response.error)

      // Refresh suppliers
      await loadData()
      if (selectedClientId) {
        await filterSuppliersByClient(selectedClientId)
      }

      // Reset form
      setNewSupplierName("")
      setShowSupplierDialog(false)
    } catch (err: any) {
      console.error("Error adding supplier:", err)
      const errorMessage = err?.message || JSON.stringify(err)
      alert(`Error adding supplier: ${errorMessage}`)
    } finally {
      setAddingSupplier(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const updateData = {
        client_id: selectedClientId,
        supplier_id: selectedSupplierId,
        carrier_id: selectedCarrierId || null,
        tracking_number: trackingNumber,
        po_number: poNumber,
        maniobras_entry_number: maniobrasEntryNumber || null,
        package_type_id: selectedPackageTypeId || null,
        status: selectedStatus,
        total_packages: Number.parseInt(totalPackages) || 0,
        total_weight: totalWeight ? Number.parseFloat(totalWeight) : null,
        received_by: selectedReceivedBy || null,
        description: description || null,
        notes: notes || null,
        is_damaged: isDamaged,
        damage_description: isDamaged ? damageDescription : null,
      }

      const response = await api.patch(`/entries/${entryId}`, updateData)

      if (response.error) {
        throw new Error(response.error)
      }

      router.push(`/operations/entries/${entryId}`)
    } catch (err) {
      console.error("Error updating entry:", err)
      setError(err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
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

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/operations/entries/${entryId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Entry
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Entry {entry.entry_number}</h1>
        <p className="text-muted-foreground">Update entry information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entry Details</CardTitle>
          <CardDescription>Entry number: {entry.entry_number}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Client - Required */}
              <div className="grid gap-2">
                <Label htmlFor="client_id" className="text-base">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select required value={selectedClientId} onValueChange={setSelectedClientId}>
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
                  <Select required value={selectedSupplierId} onValueChange={setSelectedSupplierId} disabled={!selectedClientId}>
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

              {/* Carrier - Required */}
              <div className="grid gap-2">
                <Label htmlFor="carrier_id">
                  Carrier <span className="text-destructive">*</span>
                </Label>
                <Select required value={selectedCarrierId} onValueChange={setSelectedCarrierId}>
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

              {/* Tracking Number - Required */}
              <div className="grid gap-2">
                <Label htmlFor="tracking_number">
                  Tracking Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tracking_number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  required
                />
              </div>

              {/* PO Number - Required */}
              <div className="grid gap-2">
                <Label htmlFor="po_number">
                  PO Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="po_number"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Enter PO number"
                  required
                />
              </div>

              {/* CW Entry Number - Optional */}
              <div className="grid gap-2">
                <Label htmlFor="maniobras_entry_number">
                  No. Entrada CW
                </Label>
                <Input
                  id="maniobras_entry_number"
                  value={maniobrasEntryNumber}
                  onChange={(e) => setManiobrasEntryNumber(e.target.value)}
                  placeholder="Numero de entrada CW"
                />
              </div>

              {/* Status - Required */}
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-base">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select required value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pending</SelectItem>
                    <SelectItem value="recibido">Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Total Packages - Required */}
              <div className="grid gap-2">
                <Label htmlFor="total_packages">
                  Total Packages <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="total_packages"
                  type="number"
                  placeholder="0"
                  value={totalPackages}
                  onChange={(e) => setTotalPackages(e.target.value)}
                  min="0"
                  required
                />
              </div>

              {/* Package Type - Required */}
              <div className="grid gap-2">
                <Label htmlFor="package_type">
                  Package Type <span className="text-destructive">*</span>
                </Label>
                <Select required value={selectedPackageTypeId} onValueChange={setSelectedPackageTypeId}>
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

              {/* Total Weight - Required */}
              <div className="grid gap-2">
                <Label htmlFor="total_weight_lbs">
                  Total Weight (lbs) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="total_weight_lbs"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={totalWeight}
                  onChange={(e) => setTotalWeight(e.target.value)}
                  min="0"
                  required
                />
              </div>

              {/* Received By - Required */}
              <div className="grid gap-2">
                <Label htmlFor="received_by">
                  Received By <span className="text-destructive">*</span>
                </Label>
                <Select required value={selectedReceivedBy} onValueChange={setSelectedReceivedBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((operator) => (
                      <SelectItem key={operator.id} value={operator.id}>
                        {operator.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description - Required, Full width */}
            <div className="grid gap-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Merchandise description..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Notes - Full width */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
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
                    placeholder="Describe the damage..."
                    rows={3}
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                  />
                </div>
              )}
            </div>

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/operations/entries/${entryId}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
