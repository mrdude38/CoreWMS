import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerAbility } from '@/lib/casl/server-ability'
import { sendEmail, shouldSendNotification } from '@/lib/resend/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ability = await getServerAbility()
    if (!ability.can('create', 'Email')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { entryId } = await request.json()

    if (!entryId) {
      return NextResponse.json({ error: 'Missing entryId' }, { status: 400 })
    }

    // Fetch entry with relations
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select(`
        *,
        clients (id, name, email),
        suppliers (id, name, email),
        carriers (id, name, email)
      `)
      .eq('id', entryId)
      .single()

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const results: any[] = []

    // Send to client if email exists
    if (entry.clients?.email) {
      const result = await sendEmail({
        to: entry.clients.email,
        subject: `New Entry: ${entry.entry_number}`,
        template: 'entry-notification',
        data: {
          entry,
          recipientType: 'client',
          recipientName: entry.clients.name,
        },
      })
      results.push({ recipient: 'client', ...result })
    }

    // Send to supplier if email exists
    if (entry.suppliers?.email) {
      const result = await sendEmail({
        to: entry.suppliers.email,
        subject: `New Entry: ${entry.entry_number}`,
        template: 'entry-notification',
        data: {
          entry,
          recipientType: 'supplier',
          recipientName: entry.suppliers.name,
        },
      })
      results.push({ recipient: 'supplier', ...result })
    }

    // Send to internal users with notification preferences enabled
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .in('role', ['admin', 'manager'])

    if (profiles) {
      for (const profile of profiles) {
        const shouldNotify = await shouldSendNotification(profile.id, 'entry_notifications')
        if (shouldNotify) {
          // Get user email from auth.users
          const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
          if (authUser?.user?.email) {
            const result = await sendEmail({
              to: authUser.user.email,
              subject: `New Entry: ${entry.entry_number}`,
              template: 'entry-notification',
              data: {
                entry,
                recipientType: 'internal',
                recipientName: profile.full_name,
              },
            })
            results.push({ recipient: 'internal', ...result })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Entry notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
