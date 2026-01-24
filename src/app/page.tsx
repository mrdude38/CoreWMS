import { Suspense } from "react"
import { redirect } from "next/navigation"
import { PackageOpen, TruckIcon, Package, Clock, Users, Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { ProtectedNewButton } from "@/components/protected-new-button"

async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

async function getDashboardData(role: string, clientId?: string | null) {
  const supabase = await createClient()

  const today = new Date().toISOString().split("T")[0]

  // Build queries based on role
  let loadOrdersQuery = supabase
    .from("load_orders")
    .select("*, clients(name), carriers(name)")
    .eq("status", "pendiente")
    .order("created_at", { ascending: false })
    .limit(5)

  let entriesQuery = supabase
    .from("entries")
    .select("*", { count: "exact" })
    .eq("entry_date", today)

  // Client users can only see their own data
  if (role === 'client' && clientId) {
    loadOrdersQuery = loadOrdersQuery.eq('client_id', clientId)
    entriesQuery = entriesQuery.eq('client_id', clientId)
  }

  const [{ data: openLoadOrders }, { data: todayEntries, count: todayEntriesCount }] = await Promise.all([
    loadOrdersQuery,
    entriesQuery,
  ])

  return {
    openLoadOrders: openLoadOrders || [],
    todayEntriesCount: todayEntriesCount || 0,
  }
}

async function DashboardContent() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/auth/login')
  }

  // Client users should be redirected to entries page
  if (profile.role === 'client') {
    redirect('/operations/entries')
  }

  const { openLoadOrders, todayEntriesCount } = await getDashboardData(profile.role, profile.client_id)

  const isAdmin = profile.role === 'admin'
  const isManager = profile.role === 'manager'
  const isOperator = profile.role === 'operator'
  const canManageCatalogs = isAdmin || isManager
  const canCreateEntries = isAdmin || isManager || isOperator

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your warehouse management system</p>
        </div>
        {canCreateEntries && (
          <div className="flex flex-wrap gap-2">
            <ProtectedNewButton
              href="/operations/entries/new"
              label="New Entry"
              subject="Entry"
            />
            <ProtectedNewButton
              href="/operations/load-orders/new"
              label="New Load Order"
              subject="LoadOrder"
            />
          </div>
        )}
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Load Orders</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openLoadOrders.length}</div>
            <p className="text-xs text-muted-foreground">Active orders awaiting dispatch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Entries</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEntriesCount}</div>
            <p className="text-xs text-muted-foreground">Received today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Access</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href="/reports">
                  <Package className="mr-2 h-4 w-4" />
                  View Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operational</div>
            <p className="text-xs text-muted-foreground">All systems running</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Open Load Orders</CardTitle>
            <CardDescription>Active orders awaiting completion</CardDescription>
          </CardHeader>
          <CardContent>
            {openLoadOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No open load orders</div>
            ) : (
              <div className="space-y-4">
                {openLoadOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.order_number}</p>
                        <Badge variant="secondary">{order.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.clients?.name || "No client"} • {order.carriers?.name || "No carrier"}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.total_packages} packages</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/operations/load-orders/${order.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Access frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/operations/entries">
                  <PackageOpen className="mr-2 h-4 w-4" />
                  View All Entries
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/operations/load-orders">
                  <TruckIcon className="mr-2 h-4 w-4" />
                  View All Load Orders
                </Link>
              </Button>
              {canManageCatalogs && (
                <>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/catalogs/clients">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Clients
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/catalogs/suppliers">
                      <Building2 className="mr-2 h-4 w-4" />
                      Manage Suppliers
                    </Link>
                  </Button>
                </>
              )}
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/reports">
                  <Clock className="mr-2 h-4 w-4" />
                  Analytics & Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
