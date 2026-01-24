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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

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

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*, clients(id, name)')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get auth user for email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)

    return NextResponse.json({
      ...profile,
      email: authUser?.user?.email || null,
      email_confirmed: authUser?.user?.email_confirmed_at ? true : false,
      last_sign_in: authUser?.user?.last_sign_in_at || null,
    })
  } catch (error) {
    console.error('Admin get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

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

    const { full_name, role, is_active, client_id } = await request.json()

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'manager', 'operator', 'viewer', 'client']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
    }

    // Client users must have a client_id
    if (role === 'client' && !client_id) {
      return NextResponse.json({ error: 'Client ID required for client users' }, { status: 400 })
    }

    // Update user profile
    const updateData: Record<string, any> = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (role !== undefined) updateData.role = role
    if (is_active !== undefined) updateData.is_active = is_active
    if (role === 'client') {
      updateData.client_id = client_id
    } else if (role !== undefined) {
      updateData.client_id = null
    }

    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Also update user metadata in auth
    if (full_name || role) {
      const metadataUpdate: Record<string, any> = {}
      if (full_name) metadataUpdate.full_name = full_name
      if (role) metadataUpdate.role = role
      if (role === 'client') {
        metadataUpdate.client_id = client_id
      } else if (role) {
        metadataUpdate.client_id = null
      }

      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: metadataUpdate
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

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

    // Prevent self-deletion
    if (user.id === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete user from auth (this will cascade to user_profiles if FK is set up)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    // Also delete from user_profiles just in case
    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
