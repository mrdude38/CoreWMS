import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filename = request.nextUrl.searchParams.get('filename')
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    const file = await request.blob()

    // Upload to Vercel Blob storage
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    // Return both the full URL and the pathname (blob_path)
    // The blob_path is what should be stored in the database
    return NextResponse.json({
      url: blob.url,
      blobPath: blob.pathname
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
