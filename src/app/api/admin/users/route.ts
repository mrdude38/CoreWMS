import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getServerAbility } from '@/lib/casl/server-ability'

// Create admin client with service role for user management
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    const ability = await getServerAbility()
    if (!ability.can('manage', 'all')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '50')

    // Fetch users from user_profiles with pagination
    const { data: profiles, error: profilesError, count } = await supabaseAdmin
      .from('user_profiles')
      .select('*, clients(id, name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Get auth users to get email and email_confirmed status
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()

    // Merge auth data with profile data
    const usersWithEmail = profiles?.map(profile => {
      const authUser = authUsers?.users.find(u => u.id === profile.id)
      return {
        ...profile,
        email: authUser?.email || null,
        email_confirmed: authUser?.email_confirmed_at ? true : false,
        last_sign_in: authUser?.last_sign_in_at || null,
      }
    }) || []

    return NextResponse.json({
      data: usersWithEmail,
      total: count || 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error) {
    console.error('Admin list users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    const ability = await getServerAbility()
    if (!ability.can('manage', 'all')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { email, password, full_name, role, client_id, skip_email_verification } = await request.json()

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'operator', 'viewer', 'client']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Client users must have a client_id
    if (role === 'client' && !client_id) {
      return NextResponse.json({ error: 'Client ID required for client users' }, { status: 400 })
    }

    // Create user with admin API (bypasses email verification if requested)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: skip_email_verification !== false, // Default to true
      user_metadata: {
        full_name,
        role,
        client_id: role === 'client' ? client_id : null,
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // The database trigger should create the user_profile automatically
    // But let's verify and create if needed
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    if (!existingProfile) {
      // Create user profile manually if trigger didn't work
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name,
          role,
          client_id: role === 'client' ? client_id : null,
          is_active: true,
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Don't fail the request, the user was created
      }
    }

    return NextResponse.json({
      id: authData.user.id,
      email: authData.user.email,
      full_name,
      role,
      client_id: role === 'client' ? client_id : null,
      is_active: true,
      created_at: authData.user.created_at,
    })
  } catch (error) {
    console.error('Admin create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
