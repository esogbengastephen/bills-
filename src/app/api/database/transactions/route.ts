import { NextRequest, NextResponse } from 'next/server'
import { 
  getTransactions, 
  getTransactionsByUser, 
  updateTransactionStatus,
  logUserActivity,
  getUserActivities,
  getWalletConnections,
  getTransactionStats,
  getWalletStats,
  getAdminSetting,
  setAdminSetting
} from '@/lib/database'

// Get all transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userAddress = searchParams.get('userAddress')

    let transactions
    if (userAddress) {
      transactions = await getTransactionsByUser(userAddress, limit)
    } else {
      transactions = await getTransactions(limit, offset)
    }

    return NextResponse.json({ success: true, data: transactions })
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// Update transaction status
export async function PATCH(request: NextRequest) {
  try {
    const { txDigest, status, error } = await request.json()

    if (!txDigest || !status) {
      return NextResponse.json(
        { success: false, error: 'Transaction digest and status are required' },
        { status: 400 }
      )
    }

    const transaction = await updateTransactionStatus(txDigest, status, error)
    return NextResponse.json({ success: true, data: transaction })
  } catch (error: any) {
    console.error('Error updating transaction status:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update transaction status' },
      { status: 500 }
    )
  }
}
