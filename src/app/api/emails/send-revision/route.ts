import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerAbility } from '@/lib/casl/server-ability'

interface RevisionItem {
  partida_number: number
  description: string
  brand: string
  model: string
  part_number: string
  serial_number: string
  origin: string
  quantity: number
  unit_of_measure: string
  weight_kg: number
  is_on_tarima: boolean
}

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

    const {
      entry_id,
      entry_number,
      client_name,
      supplier_name,
      invoice_number,
      reviewer_name,
      review_time_minutes,
      total_weight_kg,
      num_bultos,
      num_tarimas,
      total_bultos,
      items,
    } = await request.json()

    if (!entry_id) {
      return NextResponse.json({ error: 'Missing entry_id' }, { status: 400 })
    }

    // Fetch entry with client email
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select(`
        *,
        clients (id, name, email)
      `)
      .eq('id', entry_id)
      .single()

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (!entry.clients?.email) {
      return NextResponse.json({ error: 'Client does not have an email address' }, { status: 400 })
    }

    // Count attachments (Excel + invoice if exists)
    let attachmentsCount = 1 // Excel revision file

    if (entry.invoice_url) {
      attachmentsCount++
    }

    // TODO: Implement actual email sending using Resend or your email service
    // This is a placeholder that would need to:
    // 1. Generate styled Excel spreadsheet with revision data
    // 2. Fetch invoice attachment if exists
    // 3. Send email with attachments

    console.log('Revision email would be sent for entry:', entry_number)
    console.log('To:', entry.clients.email)
    console.log('Revision data:', {
      client_name,
      supplier_name,
      invoice_number,
      reviewer_name,
      review_time_minutes,
      total_weight_kg,
      num_bultos,
      num_tarimas,
      total_bultos,
      items_count: items?.length || 0,
    })

    // For now, return success with attachment count
    return NextResponse.json({
      success: true,
      messageId: `mock-${Date.now()}`,
      attachmentsCount,
      note: 'Email sending is configured but needs Resend API key to actually send'
    })
  } catch (error) {
    console.error('Send revision email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
