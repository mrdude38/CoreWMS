"use client"
import { BarChart3, Home, Package, PackageOpen, TruckIcon, Users, Building2, Truck, Settings, LogOut, User } from "lucide-react"
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

const menuItems = {
  main: [
    {
      title: "Dashboard",
      icon: Home,
      url: "/",
    },
  ],
  operations: [
    {
      title: "Entries",
      icon: PackageOpen,
      url: "/operations/entries",
    },
    {
      title: "Load Orders",
      icon: TruckIcon,
      url: "/operations/load-orders",
    },
    {
      title: "Shipments",
      icon: Package,
      url: "/operations/shipments",
    },
  ],
  catalogs: [
    {
      title: "Clients",
      icon: Users,
      url: "/catalogs/clients",
    },
    {
      title: "Suppliers",
      icon: Building2,
      url: "/catalogs/suppliers",
    },
    {
      title: "Carriers",
      icon: Truck,
      url: "/catalogs/carriers",
    },
  ],
  reports: [
    {
      title: "Reports",
      icon: BarChart3,
      url: "/reports",
    },
  ],
  admin: [
    {
      title: "User Management",
      icon: Settings,
      url: "/admin/users",
    },
  ],
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, signOut } = useAuth()

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
            src="/images/core-20logistics-20logo-ai.jpg"
            alt="Core Logistics"
            className="h-10 w-auto object-contain"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
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

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.operations.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>Catalogs</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.catalogs.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.reports.map((item) => (
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

        <Can I="manage" a="User">
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.admin.map((item) => (
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
        </Can>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-white">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium">{profile.full_name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
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
