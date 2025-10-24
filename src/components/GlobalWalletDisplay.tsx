'use client'

import { useWallet } from './WalletProvider'
import { useWalletKit } from '@mysten/dapp-kit'
import { useState } from 'react'

export function GlobalWalletDisplay() {
  const { walletAddress, isConnected, connectWallet, disconnectWallet } = useWallet()
  const { currentWallet, connect, disconnect } = useWalletKit()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      await connect()
      
      // Wait for wallet to be available
      if (currentWallet?.accounts?.[0]?.address) {
        const address = currentWallet.accounts[0].address
        await connectWallet(address)
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      await disconnectWallet()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isConnected && walletAddress) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3">
              <span className="material-icons text-green-600 dark:text-green-400 text-lg">
                account_balance_wallet
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Wallet Connected
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                {formatAddress(walletAddress)}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
      >
        {isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Connecting...
          </>
        ) : (
          <>
            <span className="material-icons mr-2">account_balance_wallet</span>
            Connect Wallet
          </>
        )}
      </button>
    </div>
  )
}
