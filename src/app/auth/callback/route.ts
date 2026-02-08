import { NextResponse } from 'next/server'

/**
 * Auth callback (e.g. OAuth or magic link). Backend-only auth:
 * If the backend redirects here with a token in the query, we could set the cookie and redirect.
 * Otherwise redirect to login or next.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type')
  const token = searchParams.get('token')

  if (token && type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset-password?token=${encodeURIComponent(token)}`)
  }
  if (token) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
