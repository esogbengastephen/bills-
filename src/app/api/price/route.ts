import { NextRequest, NextResponse } from 'next/server'
import { coinGeckoService } from '@/lib/coingecko'

// Get current SUI price and exchange rates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const amount = searchParams.get('amount')

    switch (action) {
      case 'price':
        // Get current SUI price
        const priceData = await coinGeckoService.getSuiPrice()
        return NextResponse.json({
          success: true,
          data: priceData,
          timestamp: new Date().toISOString()
        })

      case 'rate':
        // Get current exchange rate
        const rate = await coinGeckoService.getExchangeRate()
        return NextResponse.json({
          success: true,
          rate,
          timestamp: new Date().toISOString()
        })

      case 'convert-sui':
        // Convert SUI to Naira
        if (!amount) {
          return NextResponse.json(
            { success: false, error: 'Amount parameter is required' },
            { status: 400 }
          )
        }
        
        const suiAmount = parseFloat(amount)
        if (isNaN(suiAmount) || suiAmount < 0) {
          return NextResponse.json(
            { success: false, error: 'Invalid amount' },
            { status: 400 }
          )
        }

        const suiConversion = await coinGeckoService.convertSuiToNaira(suiAmount)
        return NextResponse.json({
          success: true,
          data: suiConversion,
          timestamp: new Date().toISOString()
        })

      case 'convert-naira':
        // Convert Naira to SUI
        if (!amount) {
          return NextResponse.json(
            { success: false, error: 'Amount parameter is required' },
            { status: 400 }
          )
        }
        
        const nairaAmount = parseFloat(amount)
        if (isNaN(nairaAmount) || nairaAmount < 0) {
          return NextResponse.json(
            { success: false, error: 'Invalid amount' },
            { status: 400 }
          )
        }

        const nairaConversion = await coinGeckoService.convertNairaToSui(nairaAmount)
        return NextResponse.json({
          success: true,
          data: nairaConversion,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: price, rate, convert-sui, or convert-naira' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('CoinGecko API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch price data' },
      { status: 500 }
    )
  }
}

// Handle POST requests for batch conversions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, amounts } = body

    if (!action || !amounts || !Array.isArray(amounts)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const results = []

    switch (action) {
      case 'convert-sui-batch':
        // Convert multiple SUI amounts to Naira
        for (const amount of amounts) {
          if (typeof amount === 'number' && amount > 0) {
            const conversion = await coinGeckoService.convertSuiToNaira(amount)
            results.push(conversion)
          }
        }
        break

      case 'convert-naira-batch':
        // Convert multiple Naira amounts to SUI
        for (const amount of amounts) {
          if (typeof amount === 'number' && amount > 0) {
            const conversion = await coinGeckoService.convertNairaToSui(amount)
            results.push(conversion)
          }
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action for batch conversion' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Batch conversion error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process batch conversion' },
      { status: 500 }
    )
  }
}
