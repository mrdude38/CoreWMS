'use client'

import { usePathname } from 'next/navigation'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Check if we're on an auth route
  const isAuthRoute = pathname?.startsWith('/auth')

  // If it's an auth route, render children without sidebar
  if (isAuthRoute) {
    return <>{children}</>
  }

  // Otherwise, render with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full">
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex-1" />
          </div>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}
