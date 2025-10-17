import { SuiWalletProvider } from '@/components/SuiWalletProvider'
import { SimpleWalletDisplay } from '@/components/SimpleWallet'
import TransactionHistoryContent from '@/components/TransactionHistoryContent'

export default function TransactionHistoryPage() {
  return (
    <SuiWalletProvider>
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
    </SuiWalletProvider>
  )
}
