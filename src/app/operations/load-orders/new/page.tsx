"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAbility } from "@/lib/casl/ability-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Package, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Client, Carrier, Entry } from "@/lib/types"
import { api } from "@/lib/api"

interface EntryWithAvailability extends Entry {
  packages_available: number
  packages_assigned: number
}

interface SelectedEntry {
  entry: EntryWithAvailability
  isPartial: boolean
  quantity: number
}

export default function Page() {
  const router = useRouter()
  const ability = useAbility()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [userClientId, setUserClientId] = useState<string | null>(null)
  const [isClientUser, setIsClientUser] = useState(false)

  const [clients, setClients] = useState<Client[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [entries, setEntries] = useState<EntryWithAvailability[]>([])
  const [filteredEntries, setFilteredEntries] = useState<EntryWithAvailability[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedCarrier, setSelectedCarrier] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("pendiente")
  const [pedimentoInvoice, setPedimentoInvoice] = useState<string>("")
  const [economicNumber, setEconomicNumber] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  // Selected entries with their quantities
  const [selectedEntries, setSelectedEntries] = useState<Map<string, SelectedEntry>>(new Map())

  // Dialog for configuring entry quantity
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogEntry, setDialogEntry] = useState<EntryWithAvailability | null>(null)
  const [dialogIsPartial, setDialogIsPartial] = useState(false)
  const [dialogQuantity, setDialogQuantity] = useState<string>("")

  useEffect(() => {
    if (!ability.can('create', 'LoadOrder')) {
      router.push('/')
    }
  }, [ability, router])

  useEffect(() => {
    const checkUserClient = async () => {
      try {
        const response = await fetch('/api/user/client-filter')
        const data = await response.json()
        setUserClientId(data.clientId)
        setIsClientUser(data.isClientUser)
      } catch (error) {
        console.error('Failed to get client filter:', error)
      }
    }
    checkUserClient()
  }, [])

  useEffect(() => {
    loadData()
  }, [userClientId])

  useEffect(() => {
    // Filter entries by selected client (status already filtered in query)
    if (selectedClient) {
      const filtered = entries.filter(
        (entry) => entry.client_id === selectedClient
      )
      setFilteredEntries(filtered)
    } else {
      setFilteredEntries([])
      setSelectedEntries(new Map())
    }
  }, [selectedClient, entries])

  const loadData = async () => {
    // Load data using backend APIs
    const clientParams = userClientId ? { client_id: userClientId } : {}

    const [clientsRes, carriersRes, entriesRes] = await Promise.all([
      api.get<Client[]>('/catalogs/clients', clientParams),
      api.get<Carrier[]>('/catalogs/carriers'),
      api.get<EntryWithAvailability[]>('/entries/available-for-load-order'),
    ])

    if (clientsRes.data) {
      setClients(clientsRes.data)

      // Auto-select client if only one (client users)
      if (clientsRes.data.length === 1) {
        setSelectedClient(clientsRes.data[0].id)
      }
    }
    if (carriersRes.data) setCarriers(carriersRes.data)

    if (entriesRes.data) {
      // Backend should return entries with availability calculated
      const entriesWithAvailability = entriesRes.data.map((entry) => {
        return {
          ...entry,
          packages_assigned: entry.packages_assigned || 0,
          packages_available: entry.packages_available || entry.total_packages,
        } as EntryWithAvailability
      })

      // Filter out entries with no available inventory
      const availableEntries = entriesWithAvailability.filter(entry => entry.packages_available > 0)
      setEntries(availableEntries)
    }
  }

  const handleEntryClick = (entry: EntryWithAvailability) => {
    setDialogEntry(entry)

    // Check if already selected
    const existing = selectedEntries.get(entry.id)
    if (existing) {
      setDialogIsPartial(existing.isPartial)
      setDialogQuantity(existing.quantity.toString())
    } else {
      setDialogIsPartial(false)
      setDialogQuantity(entry.packages_available.toString())
    }

    setDialogOpen(true)
  }

  const handleDialogConfirm = () => {
    if (!dialogEntry) return

    const quantity = Number.parseInt(dialogQuantity) || 0

    if (quantity <= 0) {
      alert("Quantity must be greater than 0")
      return
    }

    if (quantity > dialogEntry.packages_available) {
      alert(`Quantity cannot exceed ${dialogEntry.packages_available} available packages`)
      return
    }

    const newSelectedEntries = new Map(selectedEntries)
    newSelectedEntries.set(dialogEntry.id, {
      entry: dialogEntry,
      isPartial: dialogIsPartial,
      quantity: quantity,
    })

    setSelectedEntries(newSelectedEntries)
    setDialogOpen(false)
    setDialogEntry(null)
  }

  const handleRemoveEntry = (entryId: string) => {
    const newSelectedEntries = new Map(selectedEntries)
    newSelectedEntries.delete(entryId)
    setSelectedEntries(newSelectedEntries)
  }

  const getTotalPackages = () => {
    let total = 0
    selectedEntries.forEach((selected) => {
      total += selected.quantity
    })
    return total
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate
    if (!selectedClient) {
      setError("Client is required")
      setLoading(false)
      return
    }

    if (!selectedCarrier) {
      setError("Carrier is required")
      setLoading(false)
      return
    }

    if (!pedimentoInvoice.trim()) {
      setError("Pedimento / Invoice Number is required")
      setLoading(false)
      return
    }

    if (selectedEntries.size === 0) {
      setError("At least one entry must be selected")
      setLoading(false)
      return
    }

    try {
      // Prepare items for the load order
      const items = Array.from(selectedEntries.values()).map((selected) => ({
        entry_id: selected.entry.id,
        packages_quantity: selected.quantity,
        is_partial: selected.isPartial,
      }))

      // Create load order with items via backend API
      const response = await api.post<{ id: string; order_number: string }>('/load-orders', {
        client_id: selectedClient,
        carrier_id: selectedCarrier,
        status: selectedStatus,
        total_packages: getTotalPackages(),
        pedimento_invoice_number: pedimentoInvoice || null,
        economic_number: economicNumber.trim() || null,
        notes: notes.trim() || null,
        items: items,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      const loadOrder = response.data

      // Trigger email notification (backend handles this)
      if (loadOrder) {
        try {
          // Get client and carrier info for the email
          const selectedClientData = clients.find(c => c.id === selectedClient)
          const selectedCarrierData = carriers.find(c => c.id === selectedCarrier)

          // Prepare entries data for the email
          const entriesForEmail = Array.from(selectedEntries.values()).map((selected) => ({
            entry_number: selected.entry.entry_number,
            packages_quantity: selected.quantity,
            maniobras_entry_number: (selected.entry as any).maniobras_entry_number || null,
          }))

          // Build the complete load order object for the email
          const loadOrderForEmail = {
            ...loadOrder,
            clients: selectedClientData ? {
              id: selectedClientData.id,
              name: selectedClientData.name,
              email: selectedClientData.email,
            } : null,
            carriers: selectedCarrierData ? {
              id: selectedCarrierData.id,
              name: selectedCarrierData.name,
              email: (selectedCarrierData as any).email || null,
            } : null,
          }

          await api.post('/emails/load-order-notification', {
            loadOrder: loadOrderForEmail,
            entries: entriesForEmail,
          })
        } catch (emailError) {
          console.error('Error sending load order notification:', emailError)
          // Don't throw - continue with navigation even if email fails
        }

        // If status is "salida", also send exit notification
        if (selectedStatus === "salida") {
          try {
            await api.post('/emails/exit-notification', { load_order_id: loadOrder.id })
          } catch (exitEmailError) {
            console.error('Error sending exit notification:', exitEmailError)
          }
        }
      }

      // Redirect to exits list if status is salida, otherwise to load orders
      if (selectedStatus === "salida") {
        router.push("/operations/exits")
      } else {
        router.push("/operations/load-orders")
      }
    } catch (err) {
      console.error("Error creating load order:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">New Load Order</h1>
        <p className="text-muted-foreground">Create a new load order with multiple entries</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client and Carrier Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Select client and carrier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="client_id">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedClient} onValueChange={setSelectedClient} required disabled={isClientUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
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

              <div className="grid gap-2">
                <Label htmlFor="carrier_id">
                  Carrier <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedCarrier} onValueChange={setSelectedCarrier} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a carrier" />
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

              <div className="grid gap-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="salida">Salida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pedimento_invoice_number">
                  Pedimento / Invoice Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pedimento_invoice_number"
                  value={pedimentoInvoice}
                  onChange={(e) => setPedimentoInvoice(e.target.value)}
                  placeholder="Enter pedimento or invoice number"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="economic_number">Economic Number</Label>
                <Input
                  id="economic_number"
                  value={economicNumber}
                  onChange={(e) => setEconomicNumber(e.target.value)}
                  placeholder="Enter economic number"
                />
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes for the load order..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Available Entries</CardTitle>
            <CardDescription>
              {selectedClient
                ? "Click on an entry to add it to the load order and specify quantity"
                : "Select a client first to see available entries"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedClient ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>Please select a client to view available entries</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No received entries for this client</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) => {
                  const isSelected = selectedEntries.has(entry.id)
                  return (
                    <div
                      key={entry.id}
                      onClick={() => handleEntryClick(entry)}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} />
                        <div>
                          <p className="font-medium">{entry.entry_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.packages_available} available of {entry.total_packages} total
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary">
                          {selectedEntries.get(entry.id)?.quantity} packages selected
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Entries Summary */}
        {selectedEntries.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Entries ({selectedEntries.size})</CardTitle>
              <CardDescription>
                Total packages: {getTotalPackages()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from(selectedEntries.values()).map((selected) => (
                  <div
                    key={selected.entry.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{selected.entry.entry_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {selected.quantity} of {selected.entry.packages_available} available
                        {selected.isPartial && " (Partial)"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEntryClick(selected.entry)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveEntry(selected.entry.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading || selectedEntries.size === 0}>
            {loading ? "Creating..." : "Create Load Order"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Quantity Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Entry Quantity</DialogTitle>
            <DialogDescription>
              {dialogEntry && (
                <span>
                  Entry {dialogEntry.entry_number} - {dialogEntry.packages_available} available of{" "}
                  {dialogEntry.total_packages} total
                  {dialogEntry.packages_assigned > 0 && ` (${dialogEntry.packages_assigned} already assigned)`}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_partial"
                checked={dialogIsPartial}
                onCheckedChange={(checked) => {
                  setDialogIsPartial(checked === true)
                  if (!checked && dialogEntry) {
                    setDialogQuantity(dialogEntry.packages_available.toString())
                  }
                }}
              />
              <Label htmlFor="is_partial" className="text-base font-normal cursor-pointer">
                Partial quantity (not all available packages)
              </Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">
                Number of Packages <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={dialogEntry?.packages_available || 0}
                value={dialogQuantity}
                onChange={(e) => setDialogQuantity(e.target.value)}
                placeholder="Enter quantity"
                disabled={!dialogIsPartial}
              />
              {dialogEntry && (
                <p className="text-sm text-muted-foreground">
                  Maximum available: {dialogEntry.packages_available} packages
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleDialogConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
