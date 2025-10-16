import { NextRequest, NextResponse } from 'next/server'
import { getWalletConnections, getTransactionStats, getWalletStats } from '@/lib/database'

// Get analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'

    switch (type) {
      case 'transactions':
        const transactionStats = await getTransactionStats()
        return NextResponse.json({ success: true, data: transactionStats })

      case 'wallets':
        const walletStats = await getWalletStats()
        return NextResponse.json({ success: true, data: walletStats })

      case 'connections':
        const limit = parseInt(searchParams.get('limit') || '50')
        const walletConnections = await getWalletConnections(limit)
        return NextResponse.json({ success: true, data: walletConnections })

      case 'overview':
      default:
        const [txStats, walletStatsData, recentConnections] = await Promise.all([
          getTransactionStats(),
          getWalletStats(),
          getWalletConnections(10)
        ])

        return NextResponse.json({
          success: true,
          data: {
            transactions: txStats,
            wallets: walletStatsData,
            recentConnections: recentConnections,
          }
        })
    }
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
