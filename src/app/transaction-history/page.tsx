import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { WalletProvider } from '@/components/SuiWalletProvider'
import { SimpleWalletDisplay } from '@/components/SimpleWallet'

interface Transaction {
  id: string
  user_address: string
  service_type: string
  token_type: string
  amount: number
  service_details: any
  tx_digest: string
  status: string
  created_at: string
  updated_at: string
}

function getServiceIcon(serviceType: string): string {
  switch (serviceType.toLowerCase()) {
    case 'airtime':
      return '📱'
    case 'data':
      return '📶'
    case 'electricity':
      return '💡'
    case 'tv':
      return '📺'
    default:
      return '💳'
  }
}

function getServiceDisplayName(serviceType: string): string {
  switch (serviceType.toLowerCase()) {
    case 'airtime':
      return 'Airtime Purchase'
    case 'data':
      return 'Data Purchase'
    case 'electricity':
      return 'Electricity Bill'
    case 'tv':
      return 'TV Subscription'
    default:
      return 'Payment'
  }
}

function formatServiceDetails(serviceType: string, serviceDetails: any): string {
  try {
    const details = typeof serviceDetails === 'string' ? JSON.parse(serviceDetails) : serviceDetails
    
    switch (serviceType.toLowerCase()) {
      case 'airtime':
        return `${details.network || 'Unknown'} - ${details.phoneNumber || 'N/A'}`
      case 'data':
        return `${details.network || 'Unknown'} - ${details.dataPlan || 'N/A'}`
      case 'electricity':
        return `Meter #${details.meterNumber || 'N/A'}`
      case 'tv':
        return `${details.provider || 'Unknown'} - ${details.plan || 'N/A'}`
      default:
        return 'Payment Details'
    }
  } catch {
    return 'Payment Details'
  }
}

function formatAmount(amount: number, tokenType: string): string {
  const formattedAmount = amount.toFixed(2)
  return `${formattedAmount} ${tokenType}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return 'Today'
  } else if (diffDays === 2) {
    return 'Yesterday'
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'success':
    case 'confirmed':
      return 'text-green-600 dark:text-green-400'
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'failed':
    case 'refunded':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

async function TransactionHistoryContent() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch transactions from Supabase
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-4">
              ❌ Error Loading Transactions
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error.message}
            </p>
            <div className="bg-red-100 dark:bg-red-900/40 p-4 rounded">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Possible solutions:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 mt-2">
                <li>Make sure you've run the SQL schema in Supabase</li>
                <li>Check that your environment variables are correct</li>
                <li>Verify the transactions table exists</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Transaction History
            </h1>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {transactions?.length || 0} transactions
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="max-w-md mx-auto px-4 py-6">
        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Transactions Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your transaction history will appear here once you make your first payment.
            </p>
            <a 
              href="/airtime-purchase"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Make Your First Payment
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction: Transaction) => (
              <div 
                key={transaction.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start space-x-4">
                  {/* Service Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                      {getServiceIcon(transaction.service_type)}
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {getServiceDisplayName(transaction.service_type)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formatServiceDetails(transaction.service_type, transaction.service_details)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${getStatusColor(transaction.status)}`}>
                          {formatAmount(transaction.amount, transaction.token_type)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.status === 'success' || transaction.status === 'confirmed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                      
                      {/* Transaction Hash */}
                      <a 
                        href={`https://suiexplorer.com/txblock/${transaction.tx_digest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View on Explorer
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto px-4 pb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> All transactions are recorded on the Sui blockchain and can be verified using the transaction hash.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function TransactionHistoryPage() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Wallet Display - Centered at top */}
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-md mx-auto px-4 py-4">
            <SimpleWalletDisplay />
          </div>
        </div>
        
        {/* Main Content */}
        <TransactionHistoryContent />
      </div>
    </WalletProvider>
  )
}
