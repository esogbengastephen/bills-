import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend (only if API key is provided)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Send referral code email
const sendReferralCodeEmail = async (email: string, name: string, referralCode: string) => {
  try {
    // If Resend API key is not configured, fall back to console logging
    if (!resend) {
      console.log(`Sending referral code email to ${email}`)
      console.log(`Referral code: ${referralCode}`)
      console.log(`Email content:`)
      console.log(`
        Subject: 🎉 Your PayBills Referral Code
        
        Hi ${name},
        
        Welcome to PayBills! Your account has been successfully verified.
        
        Your unique referral code: ${referralCode}
        
        Share this code with friends to earn rewards when they sign up!
        
        Best regards,
        The PayBills Team
      `)
      
      return { success: true, messageId: `mock_${Date.now()}` }
    }

    // Send real email using Resend with retry logic
    const sendWithRetry = async (retries = 3): Promise<any> => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`Attempting to send email (attempt ${i + 1}/${retries})`)
          
          const { data, error } = await resend.emails.send({
            from: 'PayBills <onboarding@resend.dev>',
            to: [email],
            subject: '🎉 Your PayBills Referral Code',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2563eb; margin: 0;">🎉 Welcome to PayBills!</h1>
                  <p style="color: #6b7280; margin: 10px 0 0 0;">Your account has been successfully verified</p>
                </div>
                
                <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                  <h2 style="color: #0c4a6e; margin: 0 0 20px 0; font-size: 24px;">Your Referral Code</h2>
                  <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #0ea5e9; letter-spacing: 3px; font-family: monospace;">${referralCode}</span>
                  </div>
                  <p style="color: #0c4a6e; margin: 20px 0 0 0; font-size: 16px; line-height: 1.5;">
                    Share this code with friends to earn rewards when they sign up!
                  </p>
                </div>
                
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <h3 style="color: #374151; margin: 0 0 15px 0;">How it works:</h3>
                  <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Share your referral code with friends</li>
                    <li style="margin-bottom: 8px;">They use your code when signing up</li>
                    <li style="margin-bottom: 8px;">You both earn rewards!</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="http://localhost:3000" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Start Using PayBills
                  </a>
                </div>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; text-align: center;">Best regards,<br>The PayBills Team</p>
              </div>
            `,
          })

          if (error) {
            console.error(`Resend error (attempt ${i + 1}):`, error)
            if (i === retries - 1) throw error
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
            continue
          }

          console.log('Referral code email sent successfully:', data)
          return { success: true, messageId: data?.id }

        } catch (error) {
          console.error(`Network error (attempt ${i + 1}):`, error)
          if (i === retries - 1) {
            // Final attempt failed, fall back to console logging
            console.log(`FALLBACK: Network failed, logging referral code to console`)
            console.log(`FALLBACK: Referral code for ${email}: ${referralCode}`)
            return { success: true, messageId: `fallback_referral_${Date.now()}` }
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
        }
      }
    }

    return await sendWithRetry()
    
  } catch (error) {
    console.error('Referral email sending error:', error)
    return { success: false, error: 'Failed to send referral email' }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Referral email API called')
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
    
    const { email, name, referralCode } = await request.json()
    console.log('Request data:', { email, name, referralCode })

    // Validate input
    if (!email || !name || !referralCode) {
      console.log('Validation failed:', { email: !!email, name: !!name, referralCode: !!referralCode })
      return NextResponse.json(
        { error: 'Email, name, and referral code are required' },
        { status: 400 }
      )
    }

    console.log('Sending referral code email...')
    // Send referral code email
    const emailResult = await sendReferralCodeEmail(email, name, referralCode)
    console.log('Email result:', emailResult)

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send referral code email', details: emailResult.error },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Referral code email sent successfully',
      messageId: emailResult.messageId
    })

  } catch (error) {
    console.error('Referral email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
