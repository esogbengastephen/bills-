import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, verificationCode } = await request.json()

    if (!email || !verificationCode) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // In a real application, you would:
    // 1. Check if the verification code exists in the database
    // 2. Verify it hasn't expired (10 minutes)
    // 3. Mark it as used
    
    // For now, we'll do a simple validation
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid verification code format'
      })
    }

    // In development, accept any 6-digit code
    // In production, verify against database
    console.log(`Verifying reset code for ${email}: ${verificationCode}`)

    return NextResponse.json({
      success: true,
      message: 'Verification code is valid'
    })

  } catch (error) {
    console.error('Verify reset code error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
