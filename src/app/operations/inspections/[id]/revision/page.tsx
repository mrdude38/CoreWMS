"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Package, Download } from "lucide-react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import type { EntryRevisionItem } from "@/lib/types"

interface RevisionItem {
  id?: string
  partida_number: number
  description: string
  brand: string
  model: string
  part_number: string
  serial_number: string
  origin: string
  quantity: number
  unit_of_measure: string
  weight_kg: number
}

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const entryId = params.id as string
  const { profile } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [entry, setEntry] = useState<any>(null)
  const [revision, setRevision] = useState<any>(null)

  // Form states
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [reviewTimeMinutes, setReviewTimeMinutes] = useState(0)
  const [numBultos, setNumBultos] = useState(0)
  const [numTarimas, setNumTarimas] = useState(0)
  const [items, setItems] = useState<RevisionItem[]>([])

  // Dialog state for bultos
  const [bultosDialogOpen, setBultosDialogOpen] = useState(false)
  const [tempBultos, setTempBultos] = useState(0)
  const [tempTarimas, setTempTarimas] = useState(0)

  // New item state
  const [newItem, setNewItem] = useState<RevisionItem>({
    partida_number: 1,
    description: "",
    brand: "",
    model: "",
    part_number: "",
    serial_number: "",
    origin: "",
    quantity: 0,
    unit_of_measure: "",
    weight_kg: 0,
  })

  useEffect(() => {
    loadData()
  }, [entryId])

  const loadData = async () => {
    const supabase = createClient()

    // Load entry
    const { data: entryData } = await supabase
      .from("entries")
      .select(`
        *,
        clients(name),
        suppliers(name)
      `)
      .eq("id", entryId)
      .single()

    if (entryData) {
      setEntry(entryData)
    }

    // Load existing revision if any
    const { data: revisionData } = await supabase
      .from("entry_revisions")
      .select("*")
      .eq("entry_id", entryId)
      .single()

    if (revisionData) {
      setRevision(revisionData)
      setInvoiceNumber(revisionData.invoice_number || "")
      setReviewTimeMinutes(revisionData.review_time_minutes || 0)
      setNumBultos(revisionData.num_bultos || 0)
      setNumTarimas(revisionData.num_tarimas || 0)

      // Load revision items
      const { data: itemsData } = await supabase
        .from("entry_revision_items")
        .select("*")
        .eq("revision_id", revisionData.id)
        .order("partida_number", { ascending: true })

      if (itemsData) {
        setItems(itemsData)
      }
    }

    setLoading(false)
  }

  const calculateTotalWeight = () => {
    return items.reduce((sum, item) => sum + (item.weight_kg || 0), 0)
  }

  const handleAddItem = () => {
    const nextPartida = items.length > 0 ? Math.max(...items.map(i => i.partida_number)) + 1 : 1
    setItems([
      ...items,
      {
        ...newItem,
        partida_number: nextPartida,
      },
    ])
    setNewItem({
      partida_number: nextPartida + 1,
      description: "",
      brand: "",
      model: "",
      part_number: "",
      serial_number: "",
      origin: "",
      quantity: 0,
      unit_of_measure: "",
      weight_kg: 0,
    })
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof RevisionItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const handleSaveBultos = () => {
    setNumBultos(tempBultos)
    setNumTarimas(tempTarimas)
    setBultosDialogOpen(false)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const supabase = createClient()

      const revisionData = {
        entry_id: entryId,
        invoice_number: invoiceNumber,
        reviewer_id: profile?.id,
        review_time_minutes: reviewTimeMinutes,
        total_weight_kg: calculateTotalWeight(),
        num_bultos: numBultos,
        num_tarimas: numTarimas,
      }

      let revisionId = revision?.id

      if (revision) {
        // Update existing revision
        const { error } = await supabase
          .from("entry_revisions")
          .update(revisionData)
          .eq("id", revision.id)

        if (error) throw error

        // Delete existing items and re-insert
        await supabase
          .from("entry_revision_items")
          .delete()
          .eq("revision_id", revision.id)
      } else {
        // Create new revision
        const { data, error } = await supabase
          .from("entry_revisions")
          .insert(revisionData)
          .select()
          .single()

        if (error) throw error
        revisionId = data.id
      }

      // Insert items
      if (items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          revision_id: revisionId,
          partida_number: item.partida_number,
          description: item.description,
          brand: item.brand,
          model: item.model,
          part_number: item.part_number,
          serial_number: item.serial_number,
          origin: item.origin,
          quantity: item.quantity,
          unit_of_measure: item.unit_of_measure,
          weight_kg: item.weight_kg,
        }))

        const { error: itemsError } = await supabase
          .from("entry_revision_items")
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      // Update entry to mark revision as complete
      await supabase
        .from("entries")
        .update({ has_revision: true })
        .eq("id", entryId)

      router.push(`/operations/inspections/${entryId}`)
    } catch (err) {
      console.error("Error saving revision:", err)
      alert("Error saving revision")
    } finally {
      setSaving(false)
    }
  }

  const handleExportExcel = () => {
    if (items.length === 0) {
      alert("No hay partidas para exportar")
      return
    }

    // Prepare data for export
    const exportData = items.map((item) => ({
      "# Partida": item.partida_number,
      "Descripcion": item.description,
      "Marca": item.brand,
      "Modelo": item.model,
      "ID/# Parte": item.part_number,
      "# Serie": item.serial_number,
      "Origen": item.origin,
      "Cantidad": item.quantity,
      "Unidad de Medida": item.unit_of_measure,
      "Peso (KG)": item.weight_kg,
    }))

    // Add summary row
    exportData.push({
      "# Partida": "",
      "Descripcion": "",
      "Marca": "",
      "Modelo": "",
      "ID/# Parte": "",
      "# Serie": "",
      "Origen": "",
      "Cantidad": "",
      "Unidad de Medida": "TOTAL:",
      "Peso (KG)": calculateTotalWeight(),
    })

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    ws["!cols"] = [
      { wch: 10 },  // # Partida
      { wch: 30 },  // Descripcion
      { wch: 15 },  // Marca
      { wch: 15 },  // Modelo
      { wch: 15 },  // ID/# Parte
      { wch: 15 },  // # Serie
      { wch: 12 },  // Origen
      { wch: 10 },  // Cantidad
      { wch: 15 },  // Unidad de Medida
      { wch: 12 },  // Peso (KG)
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Revision")

    // Generate filename with entry number and date
    const date = new Date().toISOString().split("T")[0]
    const filename = `Revision_${entry?.entry_number || "Entry"}_${date}.xlsx`

    // Download
    XLSX.writeFile(wb, filename)
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-muted-foreground">Loading revision...</div>
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
    <div className="max-w-6xl">
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/operations/inspections/${entryId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inspection
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Revision - Entry {entry.entry_number}</h1>
        <p className="text-muted-foreground">Physical review of entry items</p>
      </div>

      <div className="space-y-6">
        {/* Top Section - Revision Info */}
        <Card>
          <CardHeader>
            <CardTitle>Revision Information</CardTitle>
            <CardDescription>General revision details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="invoice_number">Numero de Factura</Label>
                <Input
                  id="invoice_number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Invoice number..."
                />
              </div>

              <div className="grid gap-2">
                <Label>Revisor</Label>
                <Input
                  value={profile?.full_name || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="review_time">Tiempo de Revision (minutos)</Label>
                <Input
                  id="review_time"
                  type="number"
                  value={reviewTimeMinutes}
                  onChange={(e) => setReviewTimeMinutes(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="grid gap-2">
                <Label>Peso Total (KG)</Label>
                <Input
                  value={calculateTotalWeight().toFixed(2)}
                  disabled
                  className="bg-muted font-medium"
                />
              </div>

              <div className="grid gap-2">
                <Label>Bultos / Tarimas</Label>
                <Dialog open={bultosDialogOpen} onOpenChange={setBultosDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        setTempBultos(numBultos)
                        setTempTarimas(numTarimas)
                      }}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      {numBultos} bultos, {numTarimas} tarimas
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bultos y Tarimas</DialogTitle>
                      <DialogDescription>
                        Ingrese el numero de bultos y tarimas
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="bultos">Numero de Bultos</Label>
                        <Input
                          id="bultos"
                          type="number"
                          value={tempBultos}
                          onChange={(e) => setTempBultos(parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="tarimas">Numero de Tarimas</Label>
                        <Input
                          id="tarimas"
                          type="number"
                          value={tempTarimas}
                          onChange={(e) => setTempTarimas(parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBultosDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveBultos}>Guardar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section - Items Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Partidas ({items.length})</CardTitle>
                <CardDescription>Items included in this revision</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={items.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]"># Partida</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>ID/# Parte</TableHead>
                    <TableHead># Serie</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead className="w-[80px]">Cantidad</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="w-[100px]">Peso (KG)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.partida_number}
                          onChange={(e) => handleItemChange(index, "partida_number", parseInt(e.target.value) || 0)}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          placeholder="Description..."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.brand}
                          onChange={(e) => handleItemChange(index, "brand", e.target.value)}
                          placeholder="Brand..."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.model}
                          onChange={(e) => handleItemChange(index, "model", e.target.value)}
                          placeholder="Model..."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.part_number}
                          onChange={(e) => handleItemChange(index, "part_number", e.target.value)}
                          placeholder="Part #..."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.serial_number}
                          onChange={(e) => handleItemChange(index, "serial_number", e.target.value)}
                          placeholder="Serial #..."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.origin}
                          onChange={(e) => handleItemChange(index, "origin", e.target.value)}
                          placeholder="Origin..."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.unit_of_measure}
                          onChange={(e) => handleItemChange(index, "unit_of_measure", e.target.value)}
                          placeholder="PZ, KG..."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.weight_kg}
                          onChange={(e) => handleItemChange(index, "weight_kg", parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Add new item row */}
                  <TableRow className="bg-muted/50">
                    <TableCell>
                      <Input
                        type="number"
                        value={newItem.partida_number}
                        onChange={(e) => setNewItem({ ...newItem, partida_number: parseInt(e.target.value) || 0 })}
                        className="w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        placeholder="Description..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newItem.brand}
                        onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                        placeholder="Brand..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newItem.model}
                        onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
                        placeholder="Model..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newItem.part_number}
                        onChange={(e) => setNewItem({ ...newItem, part_number: e.target.value })}
                        placeholder="Part #..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newItem.serial_number}
                        onChange={(e) => setNewItem({ ...newItem, serial_number: e.target.value })}
                        placeholder="Serial #..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newItem.origin}
                        onChange={(e) => setNewItem({ ...newItem, origin: e.target.value })}
                        placeholder="Origin..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newItem.unit_of_measure}
                        onChange={(e) => setNewItem({ ...newItem, unit_of_measure: e.target.value })}
                        placeholder="PZ, KG..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={newItem.weight_kg}
                        onChange={(e) => setNewItem({ ...newItem, weight_kg: parseFloat(e.target.value) || 0 })}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAddItem}
                        className="text-primary hover:text-primary"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No items added yet. Use the row above to add items.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Revision"}
          </Button>
          <Button variant="outline" onClick={() => router.push(`/operations/inspections/${entryId}`)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
