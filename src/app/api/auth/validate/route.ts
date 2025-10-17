import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, referralCode } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check if email already exists
    const { data: existingUser, error: emailError } = await supabase
      .from('users')
      .select('email, name, referral_code')
      .eq('email', email)
      .single()

    if (emailError && emailError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking email:', emailError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json({
        exists: true,
        message: 'Email already exists. Please sign in instead.',
        user: {
          email: existingUser.email,
          name: existingUser.name,
          referralCode: existingUser.referral_code
        }
      })
    }

    // If referral code provided, validate it
    if (referralCode) {
      const { data: referrer, error: referralError } = await supabase
        .from('users')
        .select('referral_code, name')
        .eq('referral_code', referralCode)
        .single()

      if (referralError && referralError.code !== 'PGRST116') {
        console.error('Error checking referral code:', referralError)
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      }

      if (!referrer) {
        return NextResponse.json({
          exists: false,
          validReferral: false,
          message: 'Invalid referral code. Please check and try again.'
        })
      }

      return NextResponse.json({
        exists: false,
        validReferral: true,
        message: 'Valid referral code',
        referrer: {
          name: referrer.name,
          referralCode: referrer.referral_code
        }
      })
    }

    return NextResponse.json({
      exists: false,
      validReferral: true,
      message: 'Email available for signup'
    })

  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
