// src/app/api/transactions/retry/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { clubKonnectService } from '@/lib/clubkonnect'
import { transactionLogger } from '@/lib/transaction-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { txId, serviceType, serviceDetails } = body

    if (!txId || !serviceType || !serviceDetails) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the transaction in our logs
    const logs = transactionLogger.getTransactions()
    const transaction = logs.find(log => log.id === txId)

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.status !== 'failed') {
      return NextResponse.json(
        { success: false, error: 'Can only retry failed transactions' },
        { status: 400 }
      )
    }

    // Retry the service based on type
    let result
    switch (serviceType) {
      case 'airtime':
        result = await clubKonnectService.purchaseAirtime(
          serviceDetails.network,
          serviceDetails.amount,
          serviceDetails.phoneNumber,
          `${process.env.NEXT_PUBLIC_APP_URL}/api/callback`
        )
        break

      case 'data':
        result = await clubKonnectService.purchaseData(
          serviceDetails.network,
          serviceDetails.variationCode,
          serviceDetails.phoneNumber,
          `${process.env.NEXT_PUBLIC_APP_URL}/api/callback`
        )
        break

      case 'electricity':
        result = await clubKonnectService.payElectricity(
          serviceDetails.network,
          serviceDetails.customer,
          serviceDetails.amount,
          serviceDetails.customer,
          `${process.env.NEXT_PUBLIC_APP_URL}/api/callback`
        )
        break

      case 'tv':
        result = await clubKonnectService.purchaseTVSubscription(
          serviceDetails.network,
          serviceDetails.variationCode,
          serviceDetails.customer,
          serviceDetails.customer,
          `${process.env.NEXT_PUBLIC_APP_URL}/api/callback`
        )
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported service type' },
          { status: 400 }
        )
    }

    // Check if retry was successful
    const status = (result?.status || '').toUpperCase()
    const statusCode = (result as any)?.statuscode
    const isAccepted = status === 'ORDER_RECEIVED' || status === 'ORDER_COMPLETED' || statusCode === '100' || statusCode === '200'

    if (isAccepted) {
      // Update transaction status to success
      transactionLogger.updateTransactionStatus(txId, 'success')
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Service retry successful'
      })
    } else {
      // Update transaction status with new error
      const errorStatus = status || 'UNKNOWN_ERROR'
      transactionLogger.updateTransactionStatus(txId, 'failed', errorStatus, errorStatus)
      
      return NextResponse.json(
        {
          success: false,
          error: errorStatus,
          data: result
        },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('Error retrying transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retry transaction' },
      { status: 500 }
    )
  }
}
