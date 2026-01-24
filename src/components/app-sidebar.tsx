"use client"
import { BarChart3, Home, Package, PackageOpen, TruckIcon, Users, Building2, Truck, Settings, LogOut, User, ClipboardCheck, LogIn as ExitIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Can } from "@/lib/casl/ability-context"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

// Define menu items with role requirements
const menuItems = {
  main: [
    {
      title: "Dashboard",
      icon: Home,
      url: "/",
      // Only non-client users see dashboard
      allowedRoles: ['admin', 'manager', 'operator', 'viewer'],
    },
  ],
  operations: [
    {
      title: "Entries",
      icon: PackageOpen,
      url: "/operations/entries",
      allowedRoles: ['admin', 'manager', 'operator', 'viewer', 'client'],
    },
    {
      title: "Load Orders",
      icon: TruckIcon,
      url: "/operations/load-orders",
      allowedRoles: ['admin', 'manager', 'operator', 'viewer', 'client'],
    },
    {
      title: "Exits",
      icon: ExitIcon,
      url: "/operations/exits",
      allowedRoles: ['admin', 'manager', 'operator', 'viewer', 'client'],
    },
    {
      title: "Shipments",
      icon: Package,
      url: "/operations/shipments",
      allowedRoles: ['admin', 'manager', 'operator', 'viewer'],
    },
    {
      title: "Inspections",
      icon: ClipboardCheck,
      url: "/operations/inspections",
      // Only operators and above can do inspections
      allowedRoles: ['admin', 'manager', 'operator'],
    },
  ],
  catalogs: [
    {
      title: "Clients",
      icon: Users,
      url: "/catalogs/clients",
      allowedRoles: ['admin', 'manager'],
    },
    {
      title: "Suppliers",
      icon: Building2,
      url: "/catalogs/suppliers",
      allowedRoles: ['admin', 'manager'],
    },
    {
      title: "Carriers",
      icon: Truck,
      url: "/catalogs/carriers",
      allowedRoles: ['admin', 'manager'],
    },
  ],
  reports: [
    {
      title: "Reports",
      icon: BarChart3,
      url: "/reports",
      // Viewers and above can see reports
      allowedRoles: ['admin', 'manager', 'operator', 'viewer'],
    },
  ],
  admin: [
    {
      title: "User Management",
      icon: Settings,
      url: "/admin/users",
      // Only admin can manage users
      allowedRoles: ['admin'],
    },
  ],
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, signOut } = useAuth()

  const userRole = profile?.role || 'viewer'

  // Helper function to check if user can see a menu item
  const canSeeMenuItem = (allowedRoles: string[]) => {
    return allowedRoles.includes(userRole)
  }

  // Filter menu items based on role
  const visibleOperations = menuItems.operations.filter(item => canSeeMenuItem(item.allowedRoles))
  const visibleCatalogs = menuItems.catalogs.filter(item => canSeeMenuItem(item.allowedRoles))
  const visibleReports = menuItems.reports.filter(item => canSeeMenuItem(item.allowedRoles))
  const visibleAdmin = menuItems.admin.filter(item => canSeeMenuItem(item.allowedRoles))
  const showDashboard = menuItems.main[0].allowedRoles.includes(userRole)

  const handleSignOut = async () => {
    try {
      // Clear local state immediately for UI feedback
      await signOut()

      // Call server-side logout endpoint to clear server cookies
      await fetch('/auth/logout', { method: 'POST' })

      // Force a complete page reload to clear all state
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, force redirect to login
      window.location.href = '/auth/login'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Core Logistics"
            className="h-10 w-auto object-contain"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Dashboard - only for non-client users */}
        {showDashboard && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.main.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Operations - filtered by role */}
        {visibleOperations.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleOperations.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url + '/')}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Catalogs - only for admin and manager */}
        {visibleCatalogs.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Catalogs</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleCatalogs.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url + '/')}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Reports/Analytics - for non-client users */}
        {visibleReports.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleReports.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Administration - only for admin */}
        {visibleAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdmin.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url + '/')}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 px-2 overflow-hidden">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-white">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm min-w-0 flex-1">
                  <span className="font-medium truncate w-full">{profile.full_name}</span>
                  <span className="text-xs text-muted-foreground capitalize truncate w-full">
                    {profile.role}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div className="text-xs text-muted-foreground mt-2">v1.0.0</div>
      </SidebarFooter>
    </Sidebar>
  )
}
