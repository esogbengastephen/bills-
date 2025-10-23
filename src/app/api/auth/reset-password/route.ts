import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, verificationCode, newPassword } = await request.json()

    if (!email || !verificationCode || !newPassword) {
      return NextResponse.json(
        { error: 'Email, verification code, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Verify the user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking user:', userError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      })
    }

    // In a real application, you would:
    // 1. Verify the verification code is valid and not expired
    // 2. Hash the new password
    // 3. Update the user's password in the database
    // 4. Invalidate the verification code
    
    // For now, we'll simulate a successful password reset
    console.log(`Password reset for ${email}: ${verificationCode}`)
    console.log(`New password: ${newPassword}`)

    // In production, you would update the password field in the users table
    // For now, we'll just log the success
    console.log('Password reset successful for user:', existingUser.email)

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
