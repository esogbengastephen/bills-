import { NextRequest, NextResponse } from 'next/server'
import { logUserActivity, getUserActivities } from '@/lib/database'

// Log user activity
export async function POST(request: NextRequest) {
  try {
    const { userAddress, action, details } = await request.json()

    if (!userAddress || !action) {
      return NextResponse.json(
        { success: false, error: 'User address and action are required' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const activity = await logUserActivity({
      userAddress,
      action,
      details,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ success: true, data: activity })
  } catch (error: any) {
    console.error('Error logging user activity:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log user activity' },
      { status: 500 }
    )
  }
}

// Get user activities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address is required' },
        { status: 400 }
      )
    }

    const activities = await getUserActivities(userAddress, limit)
    return NextResponse.json({ success: true, data: activities })
  } catch (error: any) {
    console.error('Error fetching user activities:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch user activities' },
      { status: 500 }
    )
  }
}
