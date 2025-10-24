import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, walletAddress } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get current user data
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('wallet_addresses')
      .eq('email', email)
      .single()

    if (fetchError) {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const currentAddresses = user.wallet_addresses || []

    if (walletAddress) {
      // Connect wallet - add address if not already present
      if (!currentAddresses.includes(walletAddress)) {
        const updatedAddresses = [...currentAddresses, walletAddress]

        const { error: updateError } = await supabase
          .from('users')
          .update({ wallet_addresses: updatedAddresses })
          .eq('email', email)

        if (updateError) {
          console.error('Error updating wallet addresses:', updateError)
          return NextResponse.json(
            { error: 'Failed to update wallet addresses' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Wallet address added successfully',
          walletAddresses: updatedAddresses
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Wallet address already exists',
        walletAddresses: currentAddresses
      })
    } else {
      // Disconnect wallet - clear all addresses
      const { error: updateError } = await supabase
        .from('users')
        .update({ wallet_addresses: [] })
        .eq('email', email)

      if (updateError) {
        console.error('Error clearing wallet addresses:', updateError)
        return NextResponse.json(
          { error: 'Failed to clear wallet addresses' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Wallet addresses cleared successfully',
        walletAddresses: []
      })
    }

  } catch (error) {
    console.error('Wallet update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
