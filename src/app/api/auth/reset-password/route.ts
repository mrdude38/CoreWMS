import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import PasswordReset from '@/emails/password-reset'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  // Debug mode controlled by environment variable
  const DEBUG = process.env.DEBUG_PASSWORD_RESET === 'true'

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if email notifications are enabled
    if (process.env.EMAIL_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'Email notifications are not enabled', debug: DEBUG ? { EMAIL_ENABLED: process.env.EMAIL_ENABLED } : undefined },
        { status: 503 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Verify user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json({
        success: true,
        debug: DEBUG ? { stage: 'listUsers', error: listError.message } : undefined
      })
    }

    const userExists = users?.some((user: { email?: string }) => user.email === email)

    if (!userExists) {
      return NextResponse.json({
        success: true,
        debug: DEBUG ? { stage: 'userCheck', userCount: users?.length, userFound: false } : undefined
      })
    }

    // Generate a password reset link using Admin API
    const { data: resetData, error: adminResetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${request.nextUrl.origin}/auth/callback?type=recovery`,
      }
    })

    if (adminResetError) {
      console.error('Error generating admin reset link:', adminResetError)
      throw adminResetError
    }

    const resetUrl = resetData.properties?.action_link

    if (!resetUrl) {
      throw new Error('Failed to generate reset URL')
    }

    // Send email with Resend
    const { error: emailError } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: 'Reset your CoreWMS password',
      react: PasswordReset({ resetUrl }),
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      return NextResponse.json({
        success: false,
        debug: DEBUG ? { stage: 'sendEmail', error: emailError } : undefined
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      debug: DEBUG ? { stage: 'complete', emailSent: true } : undefined
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request', debug: DEBUG ? { stage: 'catch', error: String(error) } : undefined },
      { status: 500 }
    )
  }
}
