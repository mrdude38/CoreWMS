import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
  // getSession() only reads from cookies without validating the token
  // getUser() makes a request to Supabase to validate the JWT
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // If there's an auth error (invalid/expired token), treat as no user
  if (error) {
    console.log(`⚠️ Auth error: ${error.message}`)
  }

  // Debug logging
  console.log(`🔍 Middleware: ${request.nextUrl.pathname} - User: ${user ? user.email : 'null'}`)

  // Define public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/callback', '/auth/reset-password']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // API routes handle their own authentication - don't redirect them
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  if (isApiRoute) {
    return supabaseResponse
  }

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    console.log(`🚫 Redirecting to login - no user found for: ${request.nextUrl.pathname}`)
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && isPublicRoute && request.nextUrl.pathname !== '/auth/callback') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Role-based route protection
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // If not admin, redirect to home
    if (!profile || profile.role !== 'admin') {
      console.log(`🚫 Access denied to admin route for user: ${user.email} (role: ${profile?.role || 'unknown'})`)
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
