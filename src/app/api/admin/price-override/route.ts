import { NextRequest, NextResponse } from 'next/server'
import * as database from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * Admin Price Override API
 * 
 * Allows admin to set custom exchange rates for tokens
 * Overrides CoinGecko API rates when set
 */

interface PriceOverride {
  token: 'SUI' | 'USDC' | 'USDT'
  priceInNaira: number
  setBy: string
  expiresAt?: string
}

// Get price overrides
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!database.isDatabaseAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Database not available'
      }, { status: 503 })
    }

    if (token) {
      // Get specific token override
      const override = await database.getAdminSetting(`price_override_${token}`)
      
      if (!override) {
        return NextResponse.json({
          success: true,
          data: null,
          message: `No price override set for ${token}`
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          token,
          priceInNaira: parseFloat(override.value),
          description: override.description,
          updatedAt: override.updatedAt
        }
      })
    }

    // Get all token overrides
    const sui = await database.getAdminSetting('price_override_SUI')
    const usdc = await database.getAdminSetting('price_override_USDC')
    const usdt = await database.getAdminSetting('price_override_USDT')

    return NextResponse.json({
      success: true,
      data: {
        SUI: sui ? {
          priceInNaira: parseFloat(sui.value),
          updatedAt: sui.updatedAt
        } : null,
        USDC: usdc ? {
          priceInNaira: parseFloat(usdc.value),
          updatedAt: usdc.updatedAt
        } : null,
        USDT: usdt ? {
          priceInNaira: parseFloat(usdt.value),
          updatedAt: usdt.updatedAt
        } : null
      }
    })

  } catch (error: any) {
    logger.error('Error fetching price overrides', { error: error.message })
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch price overrides'
    }, { status: 500 })
  }
}

// Set price override (admin only)
export async function POST(request: NextRequest) {
  try {
    const body: PriceOverride = await request.json()
    const { token, priceInNaira, setBy } = body

    // Validate input
    if (!token || !['SUI', 'USDC', 'USDT'].includes(token)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token. Must be SUI, USDC, or USDT'
      }, { status: 400 })
    }

    if (!priceInNaira || priceInNaira <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid price. Must be positive number'
      }, { status: 400 })
    }

    if (!setBy) {
      return NextResponse.json({
        success: false,
        error: 'setBy (admin address) is required'
      }, { status: 400 })
    }

    // TODO: Verify setBy is admin wallet
    const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '0x84716bc5b17eafc9efe7dd18cc62896808ec7725c13caf598da166a262710580'
    if (setBy !== ADMIN_WALLET) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: Only admin can set price overrides'
      }, { status: 403 })
    }

    if (!database.isDatabaseAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Database not available'
      }, { status: 503 })
    }

    // Set price override in database
    await database.setAdminSetting(
      `price_override_${token}`,
      priceInNaira.toString(),
      `Admin price override for ${token} = ₦${priceInNaira} | Set by ${setBy.slice(0, 10)}...`
    )

    logger.info('Price override set', {
      token,
      priceInNaira,
      setBy
    })

    return NextResponse.json({
      success: true,
      message: `Price override set for ${token}`,
      data: {
        token,
        priceInNaira,
        setBy
      }
    })

  } catch (error: any) {
    logger.error('Error setting price override', { error: error.message })
    return NextResponse.json({
      success: false,
      error: 'Failed to set price override'
    }, { status: 500 })
  }
}

// Delete price override (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const adminAddress = searchParams.get('admin')

    if (!token || !['SUI', 'USDC', 'USDT'].includes(token)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token. Must be SUI, USDC, or USDT'
      }, { status: 400 })
    }

    if (!adminAddress) {
      return NextResponse.json({
        success: false,
        error: 'Admin address required'
      }, { status: 400 })
    }

    // Verify admin
    const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '0x84716bc5b17eafc9efe7dd18cc62896808ec7725c13caf598da166a262710580'
    if (adminAddress !== ADMIN_WALLET) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: Only admin can delete price overrides'
      }, { status: 403 })
    }

    if (!database.isDatabaseAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Database not available'
      }, { status: 503 })
    }

    // Delete by setting to null or removing
    await database.setAdminSetting(
      `price_override_${token}`,
      '0',
      `Price override removed for ${token} by ${adminAddress.slice(0, 10)}...`
    )

    logger.info('Price override removed', {
      token,
      removedBy: adminAddress
    })

    return NextResponse.json({
      success: true,
      message: `Price override removed for ${token}`
    })

  } catch (error: any) {
    logger.error('Error deleting price override', { error: error.message })
    return NextResponse.json({
      success: false,
      error: 'Failed to delete price override'
    }, { status: 500 })
  }
}

