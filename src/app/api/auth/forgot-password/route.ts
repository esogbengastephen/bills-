import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check if email exists
    const { data: existingUser, error: emailError } = await supabase
      .from('users')
      .select('email, name')
      .eq('email', email)
      .single()

    if (emailError && emailError.code !== 'PGRST116') {
      console.error('Error checking email:', emailError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Email not found. Please check your email address or sign up for a new account.'
      })
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Store verification code in database (you might want to create a separate table for this)
    // For now, we'll use a simple approach with localStorage on the client side
    
    // Send verification email
    if (resend) {
      try {
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Password Reset Code - PayBills',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #007BFF, #0056b3); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">PayBills Account Recovery</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-bottom: 20px;">Hello ${existingUser.name},</h2>
                
                <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                  You requested to reset your password. Use the verification code below to proceed with password reset:
                </p>
                
                <div style="background: #f8f9fa; border: 2px dashed #007BFF; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                  <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                  <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #007BFF; letter-spacing: 3px;">${verificationCode}</p>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404; font-size: 14px;">
                    <strong>⏰ This code expires in 10 minutes</strong><br>
                    If you didn't request this password reset, please ignore this email.
                  </p>
                </div>
                
                <p style="color: #666; line-height: 1.6; margin-top: 25px;">
                  Enter this code in the password reset form to create a new password for your account.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="margin: 0; color: #999; font-size: 12px;">
                    This email was sent from PayBills. If you have any questions, please contact our support team.
                  </p>
                </div>
              </div>
            </div>
          `
        })

        console.log('Password reset email sent successfully to:', email)
        
        return NextResponse.json({
          success: true,
          message: 'Password reset code sent successfully',
          verificationCode: verificationCode // In production, don't return this
        })

      } catch (emailError) {
        console.error('Resend error:', emailError)
        
        // Fallback: log the code for development
        console.log('=== PASSWORD RESET CODE (Development Mode) ===')
        console.log(`Email: ${email}`)
        console.log(`Code: ${verificationCode}`)
        console.log('==============================================')
        
        return NextResponse.json({
          success: true,
          message: 'Password reset code sent (check console for development)',
          verificationCode: verificationCode
        })
      }
    } else {
      // Fallback when Resend is not configured
      console.log('=== PASSWORD RESET CODE (No Email Service) ===')
      console.log(`Email: ${email}`)
      console.log(`Code: ${verificationCode}`)
      console.log('==============================================')
      
      return NextResponse.json({
        success: true,
        message: 'Password reset code generated (check console)',
        verificationCode: verificationCode
      })
    }

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
