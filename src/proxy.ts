import { type NextRequest, NextResponse } from "next/server"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"
const AUTH_COOKIE = "corewms_access_token"

// Define route access by role
const routePermissions: Record<string, string[]> = {
  // Admin only routes
  '/admin': ['admin'],
  '/admin/users': ['admin'],
  
  // Admin and Manager routes
  '/catalogs': ['admin', 'manager'],
  '/catalogs/clients': ['admin', 'manager'],
  '/catalogs/suppliers': ['admin', 'manager'],
  '/catalogs/carriers': ['admin', 'manager'],
  
  // Operations - available to most roles
  '/operations/entries': ['admin', 'manager', 'operator', 'viewer', 'client'],
  '/operations/load-orders': ['admin', 'manager', 'operator', 'viewer', 'client'],
  '/operations/exits': ['admin', 'manager', 'operator', 'viewer', 'client'],
  '/operations/shipments': ['admin', 'manager', 'operator', 'viewer'],
  '/operations/inspections': ['admin', 'manager', 'operator'],
  
  // Reports - for non-client users
  '/reports': ['admin', 'manager', 'operator', 'viewer'],
  
  // Dashboard - for non-client users
  '/': ['admin', 'manager', 'operator', 'viewer'],
  
  // Profile - all authenticated users
  '/profile': ['admin', 'manager', 'operator', 'viewer', 'client'],
}

// Routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
]

// Check if the path matches any permission pattern
function getRoutePermissions(path: string): string[] | null {
  // Check exact match first
  if (routePermissions[path]) {
    return routePermissions[path]
  }
  
  // Check parent paths (for nested routes like /admin/users/new)
  const segments = path.split('/').filter(Boolean)
  while (segments.length > 0) {
    const parentPath = '/' + segments.join('/')
    if (routePermissions[parentPath]) {
      return routePermissions[parentPath]
    }
    segments.pop()
  }
  
  return null
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip for static files
  if (pathname.includes('.')) {
    return NextResponse.next()
  }

  const response = NextResponse.next({ request })
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  const isApiRoute = pathname.startsWith("/api/")

  if (isApiRoute) {
    return response
  }

  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value

    if (!token) {
      if (!isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        url.searchParams.set("redirect", pathname)
        return NextResponse.redirect(url)
      }
      return response
    }

    const meRes = await fetch(`${API_BASE}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!meRes.ok) {
      if (!isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        url.searchParams.set("redirect", pathname)
        const redirect = NextResponse.redirect(url)
        redirect.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 })
        return redirect
      }
      return response
    }

    const data = await meRes.json()
    const profile = data?.profile ?? data

    if (!profile?.role) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    if (profile.is_active === false) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      const redirect = NextResponse.redirect(url)
      redirect.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 })
      return redirect
    }

    if (isPublicRoute && pathname !== "/auth/callback") {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }

    const userRole = profile.role
    if (pathname === "/" && userRole === "client") {
      const url = request.nextUrl.clone()
      url.pathname = "/operations/entries"
      return NextResponse.redirect(url)
    }

    const allowedRoles = getRoutePermissions(pathname)
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      const url = request.nextUrl.clone()
      url.pathname = userRole === "client" ? "/operations/entries" : "/"
      return NextResponse.redirect(url)
    }

    return response
  } catch (error) {
    console.error("[PROXY] ERROR:", error)
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
