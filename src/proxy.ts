import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function proxy(request: NextRequest) {
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

    // Define public routes that don't require authentication
    const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/callback', '/auth/reset-password']
    const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    // API routes handle their own authentication
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
    if (isApiRoute) {
      return supabaseResponse
    }

    // If user is not authenticated and trying to access protected route
    if (!user && !isPublicRoute) {
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
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/'
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
