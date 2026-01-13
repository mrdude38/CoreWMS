import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerAbility } from '@/lib/casl/server-ability'
import { sendEmail, shouldSendNotification } from '@/lib/resend/service'
import { renderToBuffer } from '@react-pdf/renderer'
import { EntryPDF } from '@/lib/pdf/entry-pdf'
import type { EmailAttachment } from '@/lib/resend/types'

export async function POST(request: NextRequest) {
  const DEBUG = process.env.DEBUG_EMAIL === 'true'

  try {
    if (DEBUG) console.log('📧 Entry notification API called')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (DEBUG) console.log('📧 User:', user?.email || 'null')

    if (!user) {
      console.log('📧 Unauthorized - no user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ability = await getServerAbility()
    const canCreateEmail = ability.can('create', 'Email')
    if (DEBUG) console.log('📧 Can create email:', canCreateEmail)

    if (!canCreateEmail) {
      console.log('📧 Insufficient permissions for user:', user.email)
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { entryId } = await request.json()
    if (DEBUG) console.log('📧 Entry ID:', entryId)

    if (!entryId) {
      return NextResponse.json({ error: 'Missing entryId' }, { status: 400 })
    }

    // Fetch entry with relations
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select(`
        *,
        clients (id, name, email),
        suppliers (id, name),
        carriers (id, name)
      `)
      .eq('id', entryId)
      .single()

    if (entryError || !entry) {
      console.log('📧 Entry not found:', entryId, entryError?.message)
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (DEBUG) console.log('📧 Entry found:', entry.entry_number)

    // Fetch entry attachments
    const { data: entryAttachments } = await supabase
      .from('entry_attachments')
      .select('*')
      .eq('entry_id', entryId)

    if (DEBUG) console.log('📧 Found attachments:', entryAttachments?.length || 0)

    // Prepare email attachments
    const emailAttachments: EmailAttachment[] = []

    // Generate PDF
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wms.core-logistics.com'
      const logoUrl = `${appUrl}/logo.png`

      const pdfBuffer = await renderToBuffer(
        EntryPDF({ entry: entry as any, logoUrl })
      )

      emailAttachments.push({
        filename: `Entry-${entry.entry_number}.pdf`,
        content: Buffer.from(pdfBuffer),
        contentType: 'application/pdf',
      })

      if (DEBUG) console.log('📧 PDF generated successfully')
    } catch (pdfError) {
      console.error('📧 PDF generation failed:', pdfError)
      // Continue without PDF if generation fails
    }

    // Fetch file attachments from storage
    if (entryAttachments && entryAttachments.length > 0) {
      for (const attachment of entryAttachments) {
        try {
          // Extract storage path from file_url
          const urlParts = attachment.file_url.split('/storage/v1/object/public/')
          if (urlParts.length > 1) {
            const storagePath = urlParts[1]
            const bucketAndPath = storagePath.split('/')
            const bucket = bucketAndPath[0]
            const filePath = bucketAndPath.slice(1).join('/')

            const { data: fileData, error: fileError } = await supabase
              .storage
              .from(bucket)
              .download(filePath)

            if (fileData && !fileError) {
              const buffer = Buffer.from(await fileData.arrayBuffer())
              emailAttachments.push({
                filename: attachment.file_name,
                content: buffer,
                contentType: attachment.file_type || 'application/octet-stream',
              })
              if (DEBUG) console.log('📧 Attachment fetched:', attachment.file_name)
            }
          }
        } catch (attachError) {
          console.error('📧 Failed to fetch attachment:', attachment.file_name, attachError)
          // Continue with other attachments
        }
      }
    }

    const results: any[] = []

    // Send to client if email exists
    if (entry.clients?.email) {
      if (DEBUG) console.log('📧 Sending to client:', entry.clients.email)
      const result = await sendEmail({
        to: entry.clients.email,
        subject: `New Entry: ${entry.entry_number}`,
        template: 'entry-notification',
        data: {
          entry,
          attachments: entryAttachments || [],
          recipientType: 'client',
          recipientName: entry.clients.name,
        },
        attachments: emailAttachments,
      })
      results.push({ recipient: 'client', ...result })
    }

    // Note: Suppliers and carriers don't have email in the database
    // Only clients receive email notifications

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
                attachments: entryAttachments || [],
                recipientType: 'internal',
                recipientName: profile.full_name,
              },
              attachments: emailAttachments,
            })
            results.push({ recipient: 'internal', ...result })
          }
        }
      }
    }

    if (DEBUG) console.log('📧 Email results:', JSON.stringify(results))

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('📧 Entry notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
