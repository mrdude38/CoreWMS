import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user is active
    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: profile.id,
      email: user.email,
      full_name: profile.full_name,
      role: profile.role,
      client_id: profile.client_id,
      is_active: profile.is_active,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
