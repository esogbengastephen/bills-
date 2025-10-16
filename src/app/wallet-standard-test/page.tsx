'use client'

import { ConnectButton, useCurrentAccount, useWallets } from '@mysten/dapp-kit'

export default function WalletTestPage() {
  const account = useCurrentAccount()
  const wallets = useWallets()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Sui Wallet Test (Wallet Standard)
        </h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Detection</h2>
          
          <div className="space-y-4">
            <div>
              <strong>Available Wallets:</strong> {wallets.length}
              {wallets.length > 0 && (
                <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {wallets.map((wallet, index) => (
                    <li key={index}>• {wallet.name}</li>
                  ))}
                </ul>
              )}
            </div>
            
            <div>
              <strong>Connection Status:</strong> {account ? '✅ Connected' : '❌ Not Connected'}
            </div>
            
            {account && (
              <div>
                <strong>Account Address:</strong> {account.address}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Connect Button</h2>
          <ConnectButton />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Expected Results:
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Available Wallets should show the number of installed Sui wallets</li>
            <li>• Connect Button should show available wallets when clicked</li>
            <li>• After connecting, you should see your wallet address</li>
            <li>• Make sure you're on TESTNET in your wallet</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
