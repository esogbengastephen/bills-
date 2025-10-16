// src/app/api/transactions/status/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { suiClient } from '@/lib/sui'
import { transactionLogger } from '@/lib/transaction-logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const txDigest = searchParams.get('txDigest')
    
    if (!txDigest) {
      return NextResponse.json(
        { success: false, error: 'Transaction digest is required' },
        { status: 400 }
      )
    }

    // Get transaction details from Sui
    let txDetails = null
    try {
      txDetails = await suiClient.getTransactionBlock({
        digest: txDigest,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showBalanceChanges: true,
          showInput: true
        }
      })
    } catch (error: any) {
      // If transaction doesn't exist on blockchain, continue with just our logs
      console.warn('Transaction not found on blockchain:', error.message)
    }

    // Check if transaction exists in our logs
    const logs = await transactionLogger.getTransactions()
    const logEntry = logs.find(log => log.txDigest === txDigest)

    return NextResponse.json({
      success: true,
      data: {
        txDigest,
        status: txDetails?.effects?.status?.status || logEntry?.status || 'unknown',
        executed: txDetails?.effects?.status?.status === 'success',
        gasUsed: txDetails?.effects?.gasUsed?.computationCost || 0,
        timestamp: txDetails?.timestampMs,
        logEntry
      }
    })
  } catch (error: any) {
    console.error('Error fetching transaction status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { txDigest, status, error, errorCode } = body

    if (!txDigest) {
      return NextResponse.json(
        { success: false, error: 'Transaction digest is required' },
        { status: 400 }
      )
    }

    // Update transaction status in our logs
    transactionLogger.updateTransactionStatus(txDigest, status, error, errorCode)

    return NextResponse.json({
      success: true,
      message: 'Transaction status updated'
    })
  } catch (error: any) {
    console.error('Error updating transaction status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction status' },
      { status: 500 }
    )
  }
}
