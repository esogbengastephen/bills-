import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { generateReferralCode } from '@/lib/referral'

export async function POST(request: NextRequest) {
  try {
    const { email, name, referralCode, walletAddress } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Generate unique referral code for the new user
    let userReferralCode = generateReferralCode()
    
    // Ensure referral code is unique
    let attempts = 0
    while (attempts < 10) {
      const { data: existingCode } = await supabase
        .from('users')
        .select('referral_code')
        .eq('referral_code', userReferralCode)
        .single()

      if (!existingCode) break
      
      userReferralCode = generateReferralCode()
      attempts++
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Failed to generate unique referral code' },
        { status: 500 }
      )
    }

    // Prepare wallet addresses array
    const walletAddresses = walletAddress ? [walletAddress] : []

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        name,
        referral_code: userReferralCode,
        referred_by: referralCode || null,
        wallet_addresses: walletAddresses
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting user:', insertError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        referralCode: newUser.referral_code,
        referredBy: newUser.referred_by,
        walletAddresses: newUser.wallet_addresses
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
