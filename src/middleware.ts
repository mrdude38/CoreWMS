import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, etc.
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Create a response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated and trying to access auth routes, redirect to home
  if (user && isPublicRoute && !pathname.includes('/callback')) {
    return NextResponse.redirect(new URL('/', request.url))
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
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (!profile.is_active) {
      // User is inactive, redirect to login with message
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('message', 'Your account has been deactivated')
      
      // Clear session by redirecting to logout first
      return NextResponse.redirect(new URL('/auth/logout', request.url))
    }

    const userRole = profile.role

    // Client users should be redirected from dashboard to entries
    if (pathname === '/' && userRole === 'client') {
      return NextResponse.redirect(new URL('/operations/entries', request.url))
    }

    // Check if user has permission to access this route
    const allowedRoles = getRoutePermissions(pathname)
    
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      // User doesn't have permission, redirect to appropriate page
      if (userRole === 'client') {
        return NextResponse.redirect(new URL('/operations/entries', request.url))
      } else {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
