import { NextRequest, NextResponse } from 'next/server'
import { circleService } from '@/lib/circle'
import { logger } from '@/lib/logger'

// Handle Circle payment operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'create-payment':
        const { sourceWalletId, destinationAddress, amount, tokenType, description } = data
        
        if (!sourceWalletId || !destinationAddress || !amount || !tokenType) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields for payment creation' },
            { status: 400 }
          )
        }

        logger.info('Creating Circle payment', { 
          sourceWalletId, 
          destinationAddress, 
          amount, 
          tokenType, 
          description 
        })

        const paymentResult = await circleService.createPayment({
          sourceWalletId,
          destinationAddress,
          amount,
          tokenType,
          description: description || 'Bill Payment'
        })

        if (!paymentResult.success) {
          logger.error('Circle payment creation failed', { 
            error: paymentResult.error,
            params: { sourceWalletId, destinationAddress, amount, tokenType }
          })
          
          return NextResponse.json(
            { success: false, error: paymentResult.error },
            { status: 400 }
          )
        }

        logger.info('Circle payment created successfully', { 
          paymentId: paymentResult.paymentId,
          params: { sourceWalletId, destinationAddress, amount, tokenType }
        })

        return NextResponse.json({
          success: true,
          data: {
            paymentId: paymentResult.paymentId
          },
          message: 'Payment created successfully'
        })

      case 'get-payment-status':
        const { paymentId } = data
        
        if (!paymentId) {
          return NextResponse.json(
            { success: false, error: 'Payment ID is required' },
            { status: 400 }
          )
        }

        const statusResult = await circleService.getPaymentStatus(paymentId)
        
        return NextResponse.json({
          success: true,
          data: {
            status: statusResult.status,
            error: statusResult.error
          }
        })

      case 'create-wallet':
        const { userId } = data
        
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID is required' },
            { status: 400 }
          )
        }

        logger.info('Creating Circle wallet', { userId })

        const walletResult = await circleService.createWallet(userId)
        
        if (!walletResult.success) {
          logger.error('Circle wallet creation failed', { 
            error: walletResult.error,
            userId 
          })
          
          return NextResponse.json(
            { success: false, error: walletResult.error },
            { status: 400 }
          )
        }

        logger.info('Circle wallet created successfully', { 
          walletId: walletResult.walletId,
          userId 
        })

        return NextResponse.json({
          success: true,
          data: {
            walletId: walletResult.walletId
          },
          message: 'Wallet created successfully'
        })

      case 'get-balance':
        const { walletId, tokenType: balanceTokenType } = data
        
        if (!walletId || !balanceTokenType) {
          return NextResponse.json(
            { success: false, error: 'Wallet ID and token type are required' },
            { status: 400 }
          )
        }

        const balance = await circleService.getWalletBalance(walletId, balanceTokenType)
        
        return NextResponse.json({
          success: true,
          data: {
            balance,
            tokenType: balanceTokenType
          }
        })

      case 'estimate-fees':
        const { sourceWalletId: feeWalletId, destinationAddress: feeDestination, amount: feeAmount, tokenType: feeTokenType } = data
        
        if (!feeWalletId || !feeDestination || !feeAmount || !feeTokenType) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields for fee estimation' },
            { status: 400 }
          )
        }

        const feeResult = await circleService.estimateFees({
          sourceWalletId: feeWalletId,
          destinationAddress: feeDestination,
          amount: feeAmount,
          tokenType: feeTokenType
        })

        if (feeResult.error) {
          return NextResponse.json(
            { success: false, error: feeResult.error },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          data: {
            fees: feeResult.fees
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Circle API error:', error)
    logger.error('Circle API error', { error: error.message })
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET requests for Circle operations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'health':
        return NextResponse.json({
          success: true,
          message: 'Circle API is healthy',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Circle API GET error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
