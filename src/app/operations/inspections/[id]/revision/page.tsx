"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Package, Download, Mail, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

// SAT Units of Measure
const SAT_UNITS = [
  "KILO",
  "GRAMO",
  "METRO LINEAL",
  "METRO CUADRADO",
  "METRO CUBICO",
  "PIEZA",
  "CABEZA",
  "LITRO",
  "JUEGO",
  "KILOWATT",
  "MILLAR",
  "GRUESA",
  "KILOWATT/HORA",
  "TONELADA",
  "BARRIL",
  "GRAMO NETO",
  "DECENAS",
  "CIENTOS",
  "DOCENAS",
  "CAJA",
  "BOTELLA",
  "PAR",
]

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
  is_on_tarima: boolean
}

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const entryId = params.id as string
  const { profile } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
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
    is_on_tarima: false,
  })

  useEffect(() => {
    loadData()
  }, [entryId])

  const loadData = async () => {
    // Load entry with revision data
    const response = await api.get<any>(`/entries/${entryId}/revision`)

    if (response.data) {
      const { entry, revision, items: revisionItems } = response.data

      if (entry) {
        setEntry(entry)
      }

      if (revision) {
        setRevision(revision)
        setInvoiceNumber(revision.invoice_number || "")
        setReviewTimeMinutes(revision.review_time_minutes || 0)
        setNumBultos(revision.num_bultos || 0)
        setNumTarimas(revision.num_tarimas || 0)

        if (revisionItems) {
          setItems(revisionItems.map((item: any) => ({
            ...item,
            is_on_tarima: item.is_on_tarima || false
          })))
        }
      }
    }

    setLoading(false)
  }

  const calculateTotalWeight = () => {
    return items.reduce((sum, item) => sum + (item.weight_kg || 0), 0)
  }

  const calculateTotalBultos = () => {
    return numBultos + numTarimas
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
      is_on_tarima: false,
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
      const revisionData = {
        invoice_number: invoiceNumber || null,
        reviewer_id: profile?.id || null,
        review_time_minutes: reviewTimeMinutes || 0,
        total_weight_kg: calculateTotalWeight(),
        num_bultos: numBultos || 0,
        num_tarimas: numTarimas || 0,
        items: items.map((item) => ({
          partida_number: item.partida_number || 1,
          description: item.description || null,
          brand: item.brand || null,
          model: item.model || null,
          part_number: item.part_number || null,
          serial_number: item.serial_number || null,
          origin: item.origin || null,
          quantity: item.quantity || 0,
          unit_of_measure: item.unit_of_measure || null,
          weight_kg: item.weight_kg || 0,
          is_on_tarima: item.is_on_tarima || false,
        })),
      }

      const response = await api.post(`/entries/${entryId}/revision`, revisionData)

      if (response.error) {
        throw new Error(response.error)
      }

      router.push(`/operations/inspections/${entryId}`)
    } catch (err: any) {
      console.error("Error saving revision:", err)
      alert(`Error saving revision: ${err?.message || "Unknown error"}`)
    } finally {
      setSaving(false)
    }
  }

  const handleExportExcel = () => {
    if (items.length === 0) {
      alert("No items to export")
      return
    }

    // Prepare data for export
    const exportData: Record<string, string | number | boolean>[] = items.map((item) => {
      const row: Record<string, string | number | boolean> = {
        "# Item": item.partida_number,
        "Description": item.description,
        "Brand": item.brand,
        "Model": item.model,
        "Part ID/#": item.part_number,
        "Serial #": item.serial_number,
        "Origin": item.origin,
        "Quantity": item.quantity,
        "Unit": item.unit_of_measure,
        "Weight (KG)": item.weight_kg,
      }
      if (numTarimas > 0) {
        row["On Pallet"] = item.is_on_tarima ? "Yes" : "No"
      }
      return row
    })

    // Add summary row
    const summaryRow: Record<string, string | number | boolean> = {
      "# Item": "",
      "Description": "",
      "Brand": "",
      "Model": "",
      "Part ID/#": "",
      "Serial #": "",
      "Origin": "",
      "Quantity": "",
      "Unit": "TOTAL:",
      "Weight (KG)": calculateTotalWeight(),
    }
    if (numTarimas > 0) {
      summaryRow["On Pallet"] = ""
    }
    exportData.push(summaryRow)

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    ws["!cols"] = [
      { wch: 10 },  // # Item
      { wch: 35 },  // Description
      { wch: 15 },  // Brand
      { wch: 15 },  // Model
      { wch: 15 },  // Part ID/#
      { wch: 15 },  // Serial #
      { wch: 12 },  // Origin
      { wch: 10 },  // Quantity
      { wch: 12 },  // Unit
      { wch: 12 },  // Weight (KG)
      { wch: 10 },  // On Pallet
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Revision")

    // Generate filename with entry number and date
    const date = new Date().toISOString().split("T")[0]
    const filename = `Revision_${entry?.entry_number || "Entry"}_${date}.xlsx`

    // Download
    XLSX.writeFile(wb, filename)
  }

  const handleSendEmail = async () => {
    if (!entry?.clients?.email) {
      toast({
        title: "Cannot send email",
        description: "This entry does not have a client email address",
        variant: "destructive",
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "Cannot send email",
        description: "No items to include in the revision",
        variant: "destructive",
      })
      return
    }

    setSendingEmail(true)
    try {
      const response = await api.post<{ attachmentsCount?: number }>('/emails/send-revision', {
        entry_id: entryId,
        entry_number: entry.entry_number,
        client_name: entry.clients?.name,
        supplier_name: entry.suppliers?.name,
        invoice_number: invoiceNumber,
        reviewer_name: profile?.full_name,
        review_time_minutes: reviewTimeMinutes,
        total_weight_kg: calculateTotalWeight(),
        num_bultos: numBultos,
        num_tarimas: numTarimas,
        total_bultos: calculateTotalBultos(),
        items: items.map(item => ({
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
          is_on_tarima: item.is_on_tarima,
        })),
      })

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Email sent",
        description: `Revision email sent successfully with ${response.data?.attachmentsCount || 0} attachments`,
      })
    } catch (err) {
      console.error("Error sending revision email:", err)
      toast({
        title: "Error sending email",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSendingEmail(false)
    }
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
                <Label htmlFor="invoice_number">Invoice Number</Label>
                <Input
                  id="invoice_number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Invoice number..."
                />
              </div>

              <div className="grid gap-2">
                <Label>Reviewer</Label>
                <Input
                  value={profile?.full_name || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="review_time">Review Time (minutes)</Label>
                <Input
                  id="review_time"
                  type="number"
                  value={reviewTimeMinutes}
                  onChange={(e) => setReviewTimeMinutes(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="grid gap-2">
                <Label>Total Weight (KG)</Label>
                <Input
                  value={calculateTotalWeight().toFixed(2)}
                  disabled
                  className="bg-muted font-medium"
                />
              </div>

              <div className="grid gap-2">
                <Label>Packages / Pallets</Label>
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
                      {numBultos} packages, {numTarimas} pallets
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Packages and Pallets</DialogTitle>
                      <DialogDescription>
                        Enter the number of packages and pallets
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="bultos">Number of Packages</Label>
                        <Input
                          id="bultos"
                          type="number"
                          value={tempBultos}
                          onChange={(e) => setTempBultos(parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="tarimas">Number of Pallets</Label>
                        <Input
                          id="tarimas"
                          type="number"
                          value={tempTarimas}
                          onChange={(e) => setTempTarimas(parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total: {tempBultos + tempTarimas}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBultosDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveBultos}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-2">
                <Label>Total Packages</Label>
                <Input
                  value={calculateTotalBultos()}
                  disabled
                  className="bg-muted font-medium"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section - Items Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Line Items ({items.length})</CardTitle>
                <CardDescription>Items included in this revision</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={items.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendEmail}
                  disabled={items.length === 0 || sendingEmail || !entry?.clients?.email}
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]"># Item</TableHead>
                    <TableHead className="min-w-[150px]">Description</TableHead>
                    <TableHead className="min-w-[100px]">Brand</TableHead>
                    <TableHead className="min-w-[100px]">Model</TableHead>
                    <TableHead className="min-w-[100px]">Part ID/#</TableHead>
                    <TableHead className="min-w-[100px]">Serial #</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead className="w-[80px]">Qty</TableHead>
                    <TableHead className="w-[130px]">Unit</TableHead>
                    <TableHead className="w-[100px]">Weight (KG)</TableHead>
                    {numTarimas > 0 && <TableHead className="w-[80px] text-center">On Pallet</TableHead>}
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="align-top">
                        <Input
                          type="number"
                          value={item.partida_number}
                          onChange={(e) => handleItemChange(index, "partida_number", parseInt(e.target.value) || 0)}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          placeholder="Description..."
                          className="min-w-[150px] min-h-[60px]"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={item.brand}
                          onChange={(e) => handleItemChange(index, "brand", e.target.value)}
                          placeholder="Brand..."
                          className="min-w-[100px] min-h-[60px]"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={item.model}
                          onChange={(e) => handleItemChange(index, "model", e.target.value)}
                          placeholder="Model..."
                          className="min-w-[100px] min-h-[60px]"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={item.part_number}
                          onChange={(e) => handleItemChange(index, "part_number", e.target.value)}
                          placeholder="Part #..."
                          className="min-w-[100px] min-h-[60px]"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Textarea
                          value={item.serial_number}
                          onChange={(e) => handleItemChange(index, "serial_number", e.target.value)}
                          placeholder="Serial #..."
                          className="min-w-[100px] min-h-[60px]"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          value={item.origin}
                          onChange={(e) => handleItemChange(index, "origin", e.target.value)}
                          placeholder="Origin..."
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Select
                          value={item.unit_of_measure}
                          onValueChange={(value) => handleItemChange(index, "unit_of_measure", value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Unit..." />
                          </SelectTrigger>
                          <SelectContent>
                            {SAT_UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.weight_kg}
                          onChange={(e) => handleItemChange(index, "weight_kg", parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      {numTarimas > 0 && (
                        <TableCell className="text-center align-top">
                          <Checkbox
                            checked={item.is_on_tarima}
                            onCheckedChange={(checked) => handleItemChange(index, "is_on_tarima", checked === true)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="align-top">
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
                    <TableCell className="align-top">
                      <Input
                        type="number"
                        value={newItem.partida_number}
                        onChange={(e) => setNewItem({ ...newItem, partida_number: parseInt(e.target.value) || 0 })}
                        className="w-16"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Textarea
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        placeholder="Description..."
                        className="min-w-[150px] min-h-[60px]"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Textarea
                        value={newItem.brand}
                        onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                        placeholder="Brand..."
                        className="min-w-[100px] min-h-[60px]"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Textarea
                        value={newItem.model}
                        onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
                        placeholder="Model..."
                        className="min-w-[100px] min-h-[60px]"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Textarea
                        value={newItem.part_number}
                        onChange={(e) => setNewItem({ ...newItem, part_number: e.target.value })}
                        placeholder="Part #..."
                        className="min-w-[100px] min-h-[60px]"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Textarea
                        value={newItem.serial_number}
                        onChange={(e) => setNewItem({ ...newItem, serial_number: e.target.value })}
                        placeholder="Serial #..."
                        className="min-w-[100px] min-h-[60px]"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        value={newItem.origin}
                        onChange={(e) => setNewItem({ ...newItem, origin: e.target.value })}
                        placeholder="Origin..."
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Select
                        value={newItem.unit_of_measure}
                        onValueChange={(value) => setNewItem({ ...newItem, unit_of_measure: value })}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Unit..." />
                        </SelectTrigger>
                        <SelectContent>
                          {SAT_UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        type="number"
                        step="0.01"
                        value={newItem.weight_kg}
                        onChange={(e) => setNewItem({ ...newItem, weight_kg: parseFloat(e.target.value) || 0 })}
                        className="w-24"
                      />
                    </TableCell>
                    {numTarimas > 0 && (
                      <TableCell className="text-center align-top">
                        <Checkbox
                          checked={newItem.is_on_tarima}
                          onCheckedChange={(checked) => setNewItem({ ...newItem, is_on_tarima: checked === true })}
                        />
                      </TableCell>
                    )}
                    <TableCell className="align-top">
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
