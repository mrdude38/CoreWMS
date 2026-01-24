import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

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

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      },
    )

    // IMPORTANT: Use getUser() instead of getSession() for proper JWT validation
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if it's a public route
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // API routes handle their own authentication
    const isApiRoute = pathname.startsWith('/api/')
    if (isApiRoute) {
      return supabaseResponse
    }

    // If user is not authenticated and trying to access protected route
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (user && isPublicRoute && pathname !== '/auth/callback') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Check role-based permissions for authenticated users
    if (user && !isPublicRoute) {
      // Get user profile with role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, client_id, is_active')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // No profile found, redirect to login
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
      }

      if (!profile.is_active) {
        // User is inactive, redirect to logout
        const url = request.nextUrl.clone()
        url.pathname = '/api/auth/logout'
        return NextResponse.redirect(url)
      }

      const userRole = profile.role

      // Client users should be redirected from dashboard to entries
      if (pathname === '/' && userRole === 'client') {
        const url = request.nextUrl.clone()
        url.pathname = '/operations/entries'
        return NextResponse.redirect(url)
      }

      // Check if user has permission to access this route
      const allowedRoles = getRoutePermissions(pathname)
      
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        // User doesn't have permission, redirect to appropriate page
        const url = request.nextUrl.clone()
        if (userRole === 'client') {
          url.pathname = '/operations/entries'
        } else {
          url.pathname = '/'
        }
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  } catch (error) {
    console.error(`[PROXY] ERROR:`, error)
    // On error, redirect to login for safety
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
