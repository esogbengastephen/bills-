'use client'

import { ConnectButton, useCurrentAccount, useWallets, useConnectWallet } from '@mysten/dapp-kit'
import { useState } from 'react'

export default function ConnectionDebugPage() {
  const account = useCurrentAccount()
  const wallets = useWallets()
  const { mutate: connect } = useConnectWallet()
  const [connectionLog, setConnectionLog] = useState<string[]>([])

  const addLog = (message: string) => {
    setConnectionLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testDirectConnection = async () => {
    addLog('🔄 Testing direct connection...')
    
    if (wallets.length === 0) {
      addLog('❌ No wallets available')
      return
    }

    const wallet = wallets[0] // Try first wallet
    addLog(`🧪 Testing with wallet: ${wallet.name}`)

    try {
      await connect({ wallet })
      addLog(`✅ Connection successful with ${wallet.name}`)
    } catch (error: any) {
      addLog(`❌ Connection failed: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Connection Debug Page
        </h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Status</h2>
          
          <div className="space-y-4">
            <div>
              <strong>Available Wallets:</strong> {wallets.length}
              {wallets.length > 0 && (
                <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {wallets.map((wallet, index) => (
                    <li key={index}>• {wallet.name} ({wallet.version})</li>
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
          <h2 className="text-xl font-semibold mb-4">Connection Methods</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Method 1: Official ConnectButton</h3>
              <ConnectButton />
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Method 2: Direct Connection</h3>
              <button
                onClick={testDirectConnection}
                disabled={wallets.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Test Direct Connection
              </button>
            </div>
          </div>
        </div>

        {connectionLog.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Connection Log</h2>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded max-h-64 overflow-y-auto">
              {connectionLog.map((log, index) => (
                <div key={index} className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Troubleshooting Tips:
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Make sure your wallet is on TESTNET</li>
            <li>• Try clicking the ConnectButton and selecting your wallet</li>
            <li>• If Slush doesn't work, try installing Sui Wallet</li>
            <li>• Check wallet permissions for localhost</li>
            <li>• Try refreshing the page after connecting</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
