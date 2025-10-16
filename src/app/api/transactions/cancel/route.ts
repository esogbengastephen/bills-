// src/app/api/transactions/cancel/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { transactionLogger } from '@/lib/transaction-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { txId, reason } = body

    if (!txId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
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

    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Can only cancel pending transactions' },
        { status: 400 }
      )
    }

    // Update transaction status to cancelled
    transactionLogger.updateTransactionStatus(
      txId, 
      'failed', 
      reason || 'Transaction cancelled by admin',
      'CANCELLED'
    )

    return NextResponse.json({
      success: true,
      message: 'Transaction cancelled successfully'
    })

  } catch (error: any) {
    console.error('Error cancelling transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel transaction' },
      { status: 500 }
    )
  }
}
