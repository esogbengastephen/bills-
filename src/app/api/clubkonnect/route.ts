import { NextRequest, NextResponse } from 'next/server'
import { clubKonnectService, mapVTpassToClubKonnect, getCommissionRate } from '@/lib/clubkonnect'

// Handle GET requests for service queries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'query':
        const orderId = searchParams.get('orderId')
        const requestId = searchParams.get('requestId')
        
        if (!orderId && !requestId) {
          return NextResponse.json({ success: false, error: 'OrderID or RequestID is required' }, { status: 400 })
        }
        
        const queryResult = await clubKonnectService.queryTransaction(orderId || undefined, requestId || undefined)
        return NextResponse.json({ success: true, data: queryResult })

      case 'services':
        const services = await clubKonnectService.getAvailableServices()
        return NextResponse.json({ success: true, data: services })

      case 'commission-rates':
        const network = searchParams.get('network')
        if (!network) {
          return NextResponse.json({ success: false, error: 'Network is required' }, { status: 400 })
        }
        
        const rate = getCommissionRate(network)
        return NextResponse.json({ success: true, data: { network, commissionRate: rate } })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('ClubKonnect API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle POST requests for transactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, network, amount, phoneNumber, dataPlan, disco, meterNumber, provider, plan, smartCardNumber, callbackUrl } = body

    let result: any

    switch (action) {
      case 'airtime':
        if (!network || !amount || !phoneNumber) {
          return NextResponse.json({ success: false, error: 'Network, amount, and phone number are required' }, { status: 400 })
        }
        
        result = await clubKonnectService.purchaseAirtime(network, amount, phoneNumber, callbackUrl)
        break

      case 'data':
        if (!network || !dataPlan || !phoneNumber) {
          return NextResponse.json({ success: false, error: 'Network, data plan, and phone number are required' }, { status: 400 })
        }
        
        result = await clubKonnectService.purchaseData(network, dataPlan, phoneNumber, callbackUrl)
        break

      case 'electricity':
        if (!disco || !meterNumber || !amount || !phoneNumber) {
          return NextResponse.json({ success: false, error: 'DISCO, meter number, amount, and phone number are required' }, { status: 400 })
        }
        
        result = await clubKonnectService.payElectricity(disco, meterNumber, amount, phoneNumber, callbackUrl)
        break

      case 'tv':
        if (!provider || !plan || !smartCardNumber || !phoneNumber) {
          return NextResponse.json({ success: false, error: 'Provider, plan, smart card number, and phone number are required' }, { status: 400 })
        }
        
        result = await clubKonnectService.purchaseTVSubscription(provider, plan, smartCardNumber, phoneNumber, callbackUrl)
        break

      case 'cancel':
        const orderId = body.orderId
        if (!orderId) {
          return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
        }
        
        result = await clubKonnectService.cancelTransaction(orderId)
        break

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Error processing ClubKonnect transaction:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
