import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerAbility } from '@/lib/casl/server-ability'
import { sendEmail } from '@/lib/resend/service'
import type { SendEmailParams } from '@/lib/resend/types'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permissions
    const ability = await getServerAbility()
    if (!ability.can('create', 'Email')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: SendEmailParams = await request.json()

    // Validate required fields
    if (!body.to || !body.subject || !body.template) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, template' },
        { status: 400 }
      )
    }

    // Send email
    const result = await sendEmail(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
