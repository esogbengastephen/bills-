import { NextRequest, NextResponse } from 'next/server'

// Mock email service - in production, use a real email service like SendGrid, Resend, etc.
const sendVerificationEmail = async (email: string, code: string, name: string) => {
  // Simulate email sending
  console.log(`Sending verification email to ${email}`)
  console.log(`Verification code: ${code}`)
  console.log(`Email content:`)
  console.log(`
    Subject: Verify your PayBills account
    
    Hi ${name},
    
    Welcome to PayBills! Please verify your email address by entering the following code:
    
    Verification Code: ${code}
    
    This code will expire in 10 minutes.
    
    If you didn't create an account with PayBills, please ignore this email.
    
    Best regards,
    The PayBills Team
  `)
  
  // In production, replace this with actual email sending logic
  return { success: true, messageId: `msg_${Date.now()}` }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, referralCode } = await request.json()

    // Validate input
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationCode, name)

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      // In development, include the code for testing
      ...(process.env.NODE_ENV === 'development' && { verificationCode })
    })

  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle verification code validation
export async function PUT(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    // Validate input
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // In production, verify the code against your database
    // For now, we'll simulate verification
    const isValid = code.length === 6 && /^\d+$/.test(code)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
