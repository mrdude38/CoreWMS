"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import type { Client, PackageType } from "@/lib/types"
import { Download, Filter } from "lucide-react"
import { format } from "date-fns"
import { useAbility } from "@/lib/casl/ability-context"

export default function Page() {
  const router = useRouter()
  const ability = useAbility()
  const [clients, setClients] = useState<Client[]>([])
  const [packageTypes, setPackageTypes] = useState<PackageType[]>([])
  const [loading, setLoading] = useState(false)

  // Inventory filters
  const [inventoryClient, setInventoryClient] = useState<string>("all")
  const [inventoryData, setInventoryData] = useState<any[]>([])

  // Entries filters
  const [entriesClient, setEntriesClient] = useState<string>("all")
  const [entriesStartDate, setEntriesStartDate] = useState<string>("")
  const [entriesEndDate, setEntriesEndDate] = useState<string>("")
  const [entriesPackageType, setEntriesPackageType] = useState<string>("all")
  const [entriesData, setEntriesData] = useState<any[]>([])

  // Exits filters
  const [exitsClient, setExitsClient] = useState<string>("all")
  const [exitsStartDate, setExitsStartDate] = useState<string>("")
  const [exitsEndDate, setExitsEndDate] = useState<string>("")
  const [exitsPackageType, setExitsPackageType] = useState<string>("all")
  const [exitsData, setExitsData] = useState<any[]>([])

  // Performance filters
  const [performanceStartDate, setPerformanceStartDate] = useState<string>("")
  const [performanceEndDate, setPerformanceEndDate] = useState<string>("")
  const [performanceData, setPerformanceData] = useState<any>(null)

  useEffect(() => {
    if (!ability.can('read', 'Report')) {
      router.push('/')
    }
  }, [ability, router])

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    const [clientsRes, packageTypesRes] = await Promise.all([
      api.get<{ data?: Client[] }>("catalogs/clients", { active: true }),
      api.get<{ data?: PackageType[] }>("catalogs/package-types"),
    ])
    const clientsList = (clientsRes as any).data ?? []
    const typesList = (packageTypesRes as any).data ?? []
    if (Array.isArray(clientsList)) setClients(clientsList)
    if (Array.isArray(typesList)) setPackageTypes(typesList)
  }

  const loadInventoryReport = async () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (inventoryClient !== "all") params.client_id = inventoryClient
    const res = await api.get<{ data?: Array<{ entry: any; available: number; shipped?: number; assigned?: number }>; total?: number }>("reports/inventory", params as any)
    const raw = (res as any).data ?? res
    const list = Array.isArray((raw as any).data) ? (raw as any).data : []
    const inventoryWithAvailability = list.map((item: any) => {
      const entry = item.entry ?? {}
      const available = item.available ?? 0
      const shipped = item.shipped ?? 0
      return {
        id: entry.id,
        entry_number: entry.entry_number,
        client: entry.client,
        supplier: entry.supplier,
        carrier: entry.carrier,
        package_type: entry.package_type,
        total_packages: entry.total_packages,
        total_weight: entry.total_weight,
        entry_date: entry.entry_date,
        shipped_packages: shipped,
        available_packages: available,
      }
    }).filter((row: any) => (row.available_packages ?? 0) > 0)
    setInventoryData(inventoryWithAvailability)
    setLoading(false)
  }

  const loadEntriesReport = async () => {
    setLoading(true)
    const params: Record<string, string | number | undefined> = { page: 1, page_size: 500 }
    if (entriesClient !== "all") params.client_id = entriesClient
    if (entriesStartDate) params.start_date = entriesStartDate
    if (entriesEndDate) params.end_date = entriesEndDate
    const res = await api.get<{ data?: any[] }>("reports/entries", params)
    const raw = (res as any).data ?? res
    let list = Array.isArray((raw as any).data) ? (raw as any).data : []
    if (entriesPackageType !== "all") {
      list = list.filter((e: any) => (e.package_type_id ?? e.package_type) === entriesPackageType || (typeof e.package_type === "object" && e.package_type?.id === entriesPackageType))
    }
    setEntriesData(list)
    setLoading(false)
  }

  const loadExitsReport = async () => {
    setLoading(true)
    const params: Record<string, string | number | undefined> = { page: 1, page_size: 500 }
    if (exitsClient !== "all") params.client_id = exitsClient
    if (exitsStartDate) params.start_date = exitsStartDate
    if (exitsEndDate) params.end_date = exitsEndDate
    const res = await api.get<{ data?: any[] }>("reports/exits", params)
    const raw = (res as any).data ?? res
    const loadOrders = Array.isArray((raw as any).data) ? (raw as any).data : []
    const exitsWithItems = loadOrders.map((lo: any) => {
      const items = lo.items ?? []
      const entryNumbers = items.map((item: any) => (item.entry ?? item.entries)?.entry_number).filter(Boolean)
      const packageTypeNames = [...new Set(items.map((item: any) => {
        const e = item.entry ?? item.entries
        return typeof e?.package_type === "string" ? e.package_type : e?.package_type?.name
      }).filter(Boolean))]
      const packageTypeIds = items.map((item: any) => (item.entry ?? item.entries)?.package_type_id).filter(Boolean)
      return {
        ...lo,
        entries: entryNumbers.length ? entryNumbers.join(", ") : "-",
        package_types: packageTypeNames.length ? packageTypeNames.join(", ") : "-",
        package_type_ids: packageTypeIds,
      }
    })
    let filtered = exitsWithItems
    if (exitsPackageType !== "all") {
      filtered = exitsWithItems.filter((exit: any) => (exit.package_type_ids ?? []).includes(exitsPackageType))
    }
    setExitsData(filtered)
    setLoading(false)
  }

  const loadPerformanceReport = async () => {
    setLoading(true)
    const params: Record<string, string | undefined> = {}
    if (performanceStartDate) params.start_date = performanceStartDate
    if (performanceEndDate) params.end_date = performanceEndDate
    const res = await api.get<{ data?: any }>("reports/performance", params as any)
    const raw = (res as any).data ?? res
    const d = (raw as any).data ?? raw
    setPerformanceData({
      totalEntries: d.entries_count ?? 0,
      totalLoadOrders: d.load_orders_count ?? 0,
      totalPackagesIn: d.total_packages_entries ?? 0,
      totalPackagesOut: d.total_packages_load_orders ?? 0,
      totalWeight: d.total_weight_kg ?? 0,
      activeClients: d.clients_count ?? 0,
      activeSuppliers: d.suppliers_count ?? 0,
      activeCarriers: d.carriers_count ?? 0,
    })
    setLoading(false)
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (typeof value === "object" && value !== null) {
              return JSON.stringify(value).replace(/,/g, ";")
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Comprehensive reports and analytics for warehouse operations</p>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="entries">Entries Report</TabsTrigger>
          <TabsTrigger value="exits">Exits Report</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Inventory Report */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Inventory Report</CardTitle>
              <CardDescription>View current inventory with filtering options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Client</Label>
                  <Select value={inventoryClient} onValueChange={setInventoryClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="All clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={loadInventoryReport} disabled={loading}>
                  <Filter className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportToCSV(inventoryData, "inventory-report")}
                  disabled={inventoryData.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {inventoryData.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entry Number</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Package Type</TableHead>
                        <TableHead>Weight (lbs)</TableHead>
                        <TableHead>Entry Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.entry_number}</TableCell>
                          <TableCell>{item.client?.name}</TableCell>
                          <TableCell>{item.supplier?.name}</TableCell>
                          <TableCell>{item.carrier?.name || "-"}</TableCell>
                          <TableCell className="font-medium text-green-600">{item.available_packages}</TableCell>
                          <TableCell>{item.total_packages}</TableCell>
                          <TableCell>{typeof item.package_type === "object" ? item.package_type?.name : item.package_type || "-"}</TableCell>
                          <TableCell>{item.total_weight?.toFixed(2)}</TableCell>
                          <TableCell>{format(new Date(item.entry_date), "MMM dd, yyyy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entries Report */}
        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entries Report</CardTitle>
              <CardDescription>Detailed report of all entries with advanced filtering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Client</Label>
                  <Select value={entriesClient} onValueChange={setEntriesClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="All clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={entriesStartDate} onChange={(e) => setEntriesStartDate(e.target.value)} />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={entriesEndDate} onChange={(e) => setEntriesEndDate(e.target.value)} />
                </div>

                <div>
                  <Label>Package Type</Label>
                  <Select value={entriesPackageType} onValueChange={setEntriesPackageType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {packageTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={loadEntriesReport} disabled={loading}>
                  <Filter className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportToCSV(entriesData, "entries-report")}
                  disabled={entriesData.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {entriesData.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entry Number</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Packages</TableHead>
                        <TableHead>Package Type</TableHead>
                        <TableHead>Weight (lbs)</TableHead>
                        <TableHead>Received By</TableHead>
                        <TableHead>Entry Date</TableHead>
                        <TableHead>Damaged</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entriesData.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.entry_number}</TableCell>
                          <TableCell>{entry.client?.name}</TableCell>
                          <TableCell>{entry.supplier?.name}</TableCell>
                          <TableCell>{entry.carrier?.name || "-"}</TableCell>
                          <TableCell>
                            <span className="capitalize">{entry.status}</span>
                          </TableCell>
                          <TableCell>{entry.total_packages}</TableCell>
                          <TableCell>{typeof entry.package_type === "object" ? entry.package_type?.name : entry.package_type || "-"}</TableCell>
                          <TableCell>{entry.total_weight?.toFixed(2)}</TableCell>
                          <TableCell>{entry.received_by_user?.full_name || "-"}</TableCell>
                          <TableCell>{format(new Date(entry.entry_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{entry.is_damaged ? "Yes" : "No"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exits Report */}
        <TabsContent value="exits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exits Report</CardTitle>
              <CardDescription>Detailed report of all exits with advanced filtering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Client</Label>
                  <Select value={exitsClient} onValueChange={setExitsClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="All clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={exitsStartDate} onChange={(e) => setExitsStartDate(e.target.value)} />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={exitsEndDate} onChange={(e) => setExitsEndDate(e.target.value)} />
                </div>

                <div>
                  <Label>Package Type</Label>
                  <Select value={exitsPackageType} onValueChange={setExitsPackageType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {packageTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={loadExitsReport} disabled={loading}>
                  <Filter className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportToCSV(exitsData, "exits-report")}
                  disabled={exitsData.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {exitsData.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order Number</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Entries</TableHead>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Packages</TableHead>
                        <TableHead>Package Types</TableHead>
                        <TableHead>Pedimento/Invoice</TableHead>
                        <TableHead>Exit Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exitsData.map((exit) => (
                        <TableRow key={exit.id}>
                          <TableCell className="font-medium">{exit.order_number}</TableCell>
                          <TableCell>{exit.client?.name}</TableCell>
                          <TableCell>{exit.entries}</TableCell>
                          <TableCell>{exit.carrier?.name}</TableCell>
                          <TableCell>{exit.total_packages}</TableCell>
                          <TableCell>{exit.package_types}</TableCell>
                          <TableCell>{exit.pedimento_invoice_number || "-"}</TableCell>
                          <TableCell>{format(new Date(exit.created_at), "MMM dd, yyyy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Report */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance & Analytics</CardTitle>
              <CardDescription>Overall warehouse performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={performanceStartDate}
                    onChange={(e) => setPerformanceStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={performanceEndDate}
                    onChange={(e) => setPerformanceEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={loadPerformanceReport} disabled={loading}>
                <Filter className="h-4 w-4 mr-2" />
                Generate Report
              </Button>

              {performanceData && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceData.totalEntries}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Exits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceData.totalLoadOrders}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Packages In</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceData.totalPackagesIn}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Packages Out</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceData.totalPackagesOut}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Weight (kg)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceData.totalWeight.toFixed(2)}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceData.activeClients}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceData.activeSuppliers}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Active Carriers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceData.activeCarriers}</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
