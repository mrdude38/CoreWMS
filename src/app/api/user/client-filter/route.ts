import { NextResponse } from 'next/server'
import { getClientFilter } from '@/lib/casl/client-filter'

export async function GET() {
  try {
    const clientId = await getClientFilter()

    return NextResponse.json({
      clientId,
      isClientUser: clientId !== null,
    })
  } catch (error) {
    console.error('Error getting client filter:', error)
    return NextResponse.json(
      { error: 'Failed to get client filter' },
      { status: 500 }
    )
  }
}
