import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateReferralCode } from '@/lib/referral'

// Initialize Resend (only if API key is provided)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Mock email service - in production, use a real email service like SendGrid, Resend, etc.
const sendVerificationEmail = async (email: string, code: string, name: string) => {
  try {
    // If Resend API key is not configured, fall back to console logging
    if (!resend) {
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
      
      return { success: true, messageId: `mock_${Date.now()}` }
    }

    // Send real email using Resend
    const { data, error } = await resend.emails.send({
      from: 'PayBills <onboarding@resend.dev>', // Use Resend's default domain for testing
      to: [email],
      subject: 'Verify your PayBills account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to PayBills!</h2>
          <p>Hi ${name},</p>
          <p>Please verify your email address by entering the following code:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
          </div>
          <p>This verification code will expire in 10 minutes.</p>
          <p>If you didn't create an account with PayBills, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The PayBills Team</p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('Email sent successfully:', data)
    return { success: true, messageId: data?.id }
    
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error: 'Failed to send email' }
  }
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
    
    // Generate unique referral code for the new user
    const userReferralCode = generateReferralCode()
    
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
      userReferralCode: userReferralCode,
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
