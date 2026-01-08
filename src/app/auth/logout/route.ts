import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const supabase = await createClient()

    // Sign out from Supabase - this clears the session
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Server logout error:', error)
    }

    // Manually delete all Supabase cookies to ensure complete logout
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    // Delete all cookies that start with 'sb-'
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        cookieStore.delete(cookie.name)
      }
    })

    console.log('✅ Logout successful - cookies cleared')

    // Return success
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('❌ Unexpected logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
