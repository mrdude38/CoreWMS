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

    const { loadOrderId } = await request.json()

    if (!loadOrderId) {
      return NextResponse.json({ error: 'Missing loadOrderId' }, { status: 400 })
    }

    // Fetch load order with relations
    const { data: loadOrder, error: loadOrderError } = await supabase
      .from('load_orders')
      .select(`
        *,
        clients (id, name, email),
        carriers (id, name, email)
      `)
      .eq('id', loadOrderId)
      .single()

    if (loadOrderError || !loadOrder) {
      return NextResponse.json({ error: 'Load order not found' }, { status: 404 })
    }

    // Fetch associated entries from load_order_items
    const { data: items } = await supabase
      .from('load_order_items')
      .select(`
        packages_quantity,
        entries (entry_number)
      `)
      .eq('load_order_id', loadOrderId)

    const entries = items?.map((item: any) => ({
      entry_number: item.entries.entry_number,
      packages_quantity: item.packages_quantity,
    })) || []

    const results: any[] = []

    // Send to client
    if (loadOrder.clients?.email) {
      const result = await sendEmail({
        to: loadOrder.clients.email,
        subject: `New Load Order: ${loadOrder.order_number}`,
        template: 'load-order-notification',
        data: {
          loadOrder,
          entries,
          recipientType: 'client',
          recipientName: loadOrder.clients.name,
        },
      })
      results.push({ recipient: 'client', ...result })
    }

    // Send to carrier
    if (loadOrder.carriers?.email) {
      const result = await sendEmail({
        to: loadOrder.carriers.email,
        subject: `New Load Order Assignment: ${loadOrder.order_number}`,
        template: 'load-order-notification',
        data: {
          loadOrder,
          entries,
          recipientType: 'carrier',
          recipientName: loadOrder.carriers.name,
        },
      })
      results.push({ recipient: 'carrier', ...result })
    }

    // Send to internal users
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .in('role', ['admin', 'manager'])

    if (profiles) {
      for (const profile of profiles) {
        const shouldNotify = await shouldSendNotification(profile.id, 'load_order_notifications')
        if (shouldNotify) {
          // Get user email from auth.users
          const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
          if (authUser?.user?.email) {
            const result = await sendEmail({
              to: authUser.user.email,
              subject: `New Load Order: ${loadOrder.order_number}`,
              template: 'load-order-notification',
              data: {
                loadOrder,
                entries,
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
    console.error('Load order notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
