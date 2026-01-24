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
import { createClient } from "@/lib/supabase/client"
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
    const supabase = createClient()
    const [clientsRes, packageTypesRes] = await Promise.all([
      supabase.from("clients").select("*").eq("active", true).order("name"),
      supabase.from("package_types").select("*").eq("active", true).order("name"),
    ])

    if (clientsRes.data) setClients(clientsRes.data)
    if (packageTypesRes.data) setPackageTypes(packageTypesRes.data)
  }

  const loadInventoryReport = async () => {
    setLoading(true)
    const supabase = createClient()

    // Get all received entries
    let entriesQuery = supabase
      .from("entries")
      .select(
        `
        *,
        client:clients(name),
        supplier:suppliers(name),
        carrier:carriers(name),
        package_type:package_types(name)
      `,
      )
      .eq("status", "recibido")

    if (inventoryClient !== "all") {
      entriesQuery = entriesQuery.eq("client_id", inventoryClient)
    }

    const { data: entries, error: entriesError } = await entriesQuery.order("entry_date", { ascending: false })

    if (!entries || entries.length === 0) {
      setInventoryData([])
      setLoading(false)
      return
    }

    // Get shipped packages from load_order_items for shipped load orders (status = 'salida')
    const { data: shippedItems, error: shippedError } = await supabase
      .from("load_order_items")
      .select(`
        entry_id,
        packages_quantity,
        load_order:load_orders!inner(status)
      `)
      .eq("load_order.status", "salida")

    // Calculate shipped packages per entry
    const shippedByEntry = new Map<string, number>()
    for (const item of shippedItems || []) {
      const current = shippedByEntry.get(item.entry_id) || 0
      shippedByEntry.set(item.entry_id, current + (item.packages_quantity || 0))
    }

    // Filter out entries where all packages have been shipped and add availability fields
    const inventoryWithAvailability = entries
      .map((entry: any) => {
        const shipped = shippedByEntry.get(entry.id) || 0
        const available = (entry.total_packages || 0) - shipped
        return {
          ...entry,
          shipped_packages: shipped,
          available_packages: available,
        }
      })
      .filter((entry: any) => entry.available_packages > 0)

    setInventoryData(inventoryWithAvailability)
    setLoading(false)
  }

  const loadEntriesReport = async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase.from("entries").select(
      `
        *,
        client:clients(name),
        supplier:suppliers(name),
        carrier:carriers(name),
        package_type:package_types(name),
        received_by_user:user_profiles(full_name)
      `,
    )

    if (entriesClient !== "all") {
      query = query.eq("client_id", entriesClient)
    }

    if (entriesStartDate) {
      query = query.gte("entry_date", entriesStartDate)
    }

    if (entriesEndDate) {
      query = query.lte("entry_date", entriesEndDate)
    }

    if (entriesPackageType !== "all") {
      query = query.eq("package_type_id", entriesPackageType)
    }

    const { data, error } = await query.order("entry_date", { ascending: false })

    if (data) setEntriesData(data)
    setLoading(false)
  }

  const loadExitsReport = async () => {
    setLoading(true)
    const supabase = createClient()

    // Query load orders with client and carrier
    let loadOrdersQuery = supabase
      .from("load_orders")
      .select(`
        id,
        order_number,
        status,
        total_packages,
        pedimento_invoice_number,
        economic_number,
        created_at,
        client:clients(name),
        carrier:carriers(name)
      `)
      .eq("status", "salida")

    if (exitsClient !== "all") {
      loadOrdersQuery = loadOrdersQuery.eq("client_id", exitsClient)
    }

    if (exitsStartDate) {
      loadOrdersQuery = loadOrdersQuery.gte("created_at", exitsStartDate)
    }

    if (exitsEndDate) {
      loadOrdersQuery = loadOrdersQuery.lte("created_at", exitsEndDate)
    }

    const { data: loadOrders, error: loadOrdersError } = await loadOrdersQuery.order("created_at", { ascending: false })

    if (!loadOrders || loadOrders.length === 0) {
      setExitsData([])
      setLoading(false)
      return
    }

    // Query load_order_items with entry details for those load orders
    const loadOrderIds = loadOrders.map((lo: any) => lo.id)
    const { data: items, error: itemsError } = await supabase
      .from("load_order_items")
      .select(`
        load_order_id,
        packages_quantity,
        entry:entries(
          entry_number,
          package_type_id,
          package_type:package_types(id, name)
        )
      `)
      .in("load_order_id", loadOrderIds)

    // Group items by load_order_id and combine entry numbers and package types
    const itemsByLoadOrder = new Map<string, any[]>()
    for (const item of items || []) {
      const existing = itemsByLoadOrder.get(item.load_order_id) || []
      existing.push(item)
      itemsByLoadOrder.set(item.load_order_id, existing)
    }

    // Build combined exit data
    let exitsWithItems = loadOrders.map((lo: any) => {
      const loItems = itemsByLoadOrder.get(lo.id) || []
      const entryNumbers = loItems.map((item: any) => item.entry?.entry_number).filter(Boolean)
      const packageTypes = [...new Set(loItems.map((item: any) => item.entry?.package_type?.name).filter(Boolean))]
      const packageTypeIds = loItems.map((item: any) => item.entry?.package_type_id).filter(Boolean)
      
      return {
        ...lo,
        entries: entryNumbers.join(", ") || "-",
        package_types: packageTypes.join(", ") || "-",
        package_type_ids: packageTypeIds,
      }
    })

    // Filter by package type if selected
    if (exitsPackageType !== "all") {
      exitsWithItems = exitsWithItems.filter((exit: any) => 
        exit.package_type_ids.includes(exitsPackageType)
      )
    }

    setExitsData(exitsWithItems)
    setLoading(false)
  }

  const loadPerformanceReport = async () => {
    setLoading(true)
    const supabase = createClient()

    let entriesQuery = supabase.from("entries").select("entry_date, total_packages, total_weight")

    let loadOrdersQuery = supabase.from("load_orders").select("created_at, total_packages")

    if (performanceStartDate) {
      entriesQuery = entriesQuery.gte("entry_date", performanceStartDate)
      loadOrdersQuery = loadOrdersQuery.gte("created_at", performanceStartDate)
    }

    if (performanceEndDate) {
      entriesQuery = entriesQuery.lte("entry_date", performanceEndDate)
      loadOrdersQuery = loadOrdersQuery.lte("created_at", performanceEndDate)
    }

    const [entriesRes, loadOrdersRes, clientsCountRes, suppliersCountRes, carriersCountRes] = await Promise.all([
      entriesQuery,
      loadOrdersQuery,
      supabase.from("clients").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.from("suppliers").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.from("carriers").select("*", { count: "exact", head: true }).eq("active", true),
    ])

    const entries = entriesRes.data || []
    const loadOrders = loadOrdersRes.data || []

    const totalEntries = entries.length
    const totalLoadOrders = loadOrders.length
    const totalPackagesIn = entries.reduce((sum: number, e: any) => sum + (e.total_packages || 0), 0)
    const totalPackagesOut = loadOrders.reduce((sum: number, e: any) => sum + (e.total_packages || 0), 0)
    const totalWeight = entries.reduce((sum: number, e: any) => sum + (e.total_weight || 0), 0)

    setPerformanceData({
      totalEntries,
      totalLoadOrders,
      totalPackagesIn,
      totalPackagesOut,
      totalWeight,
      activeClients: clientsCountRes.count || 0,
      activeSuppliers: suppliersCountRes.count || 0,
      activeCarriers: carriersCountRes.count || 0,
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
                          <TableCell>{item.package_type?.name || "-"}</TableCell>
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
                          <TableCell>{entry.package_type?.name || "-"}</TableCell>
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
                      <CardTitle className="text-sm font-medium">Total Weight (lbs)</CardTitle>
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
