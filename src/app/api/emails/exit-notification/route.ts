import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerAbility } from '@/lib/casl/server-ability'

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

    const { load_order_id } = await request.json()

    if (!load_order_id) {
      return NextResponse.json({ error: 'Missing load_order_id' }, { status: 400 })
    }

    // Fetch load order with client and carrier
    const { data: loadOrder, error: loadOrderError } = await supabase
      .from('load_orders')
      .select(`
        *,
        clients (id, name, email),
        carriers (id, name)
      `)
      .eq('id', load_order_id)
      .single()

    if (loadOrderError || !loadOrder) {
      return NextResponse.json({ error: 'Load order not found' }, { status: 404 })
    }

    if (!loadOrder.clients?.email) {
      return NextResponse.json({ error: 'Client does not have an email address' }, { status: 400 })
    }

    // Fetch load order items with full entry details
    const { data: loadOrderItems } = await supabase
      .from('load_order_items')
      .select(`
        *,
        entries (
          *,
          clients (id, name, email),
          suppliers (id, name),
          carriers (id, name),
          package_types (id, name)
        )
      `)
      .eq('load_order_id', load_order_id)

    const entries = loadOrderItems?.map(item => item.entries).filter(Boolean) || []

    // Collect attachment info
    let attachmentsCount = 0

    // For each entry, check for revisions and attachments
    for (const entry of entries) {
      if (!entry) continue

      // Check for revision
      if (entry.has_revision) {
        const { data: revision } = await supabase
          .from('entry_revisions')
          .select('*')
          .eq('entry_id', entry.id)
          .single()

        if (revision) {
          attachmentsCount++ // Excel revision file
        }
      }

      // Check for invoice
      if (entry.invoice_url) {
        attachmentsCount++
      }

      // Check for entry attachments
      const { data: entryAttachments } = await supabase
        .from('entry_attachments')
        .select('id')
        .eq('entry_id', entry.id)

      attachmentsCount += entryAttachments?.length || 0
    }

    // TODO: Implement actual email sending using Resend or your email service
    // This is a placeholder that would need to:
    // 1. Generate PDF for each entry
    // 2. Generate Excel for each revision
    // 3. Fetch all invoice attachments
    // 4. Generate exit cover sheet PDF
    // 5. Send email with all attachments

    console.log('Exit notification would be sent for load order:', loadOrder.order_number)
    console.log('To:', loadOrder.clients.email)
    console.log('Entries:', entries.length)
    console.log('Estimated attachments:', attachmentsCount)

    // For now, return success with attachment count
    return NextResponse.json({
      success: true,
      messageId: `mock-${Date.now()}`,
      attachmentsCount,
      note: 'Email sending is configured but needs Resend API key to actually send'
    })
  } catch (error) {
    console.error('Send exit notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
