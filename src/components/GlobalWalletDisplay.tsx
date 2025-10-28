'use client'

import { useWallet } from './WalletProvider'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { useState, useEffect } from 'react'

export function GlobalWalletDisplay() {
  const { walletAddress, isConnected, connectWallet, disconnectWallet, isLoading } = useWallet()
  const currentAccount = useCurrentAccount()
  const [isConnecting, setIsConnecting] = useState(false)

  // Sync wallet state when currentAccount changes (no forced disconnects on null during reload)
  useEffect(() => {
    if (currentAccount?.address) {
      if (!isConnected || walletAddress !== currentAccount.address) {
        console.log('Connecting wallet from GlobalWalletDisplay:', currentAccount.address)
        connectWallet(currentAccount.address)
      }
    }
    // Do not auto-disconnect here; users disconnect explicitly via wallet UI or sign out
  }, [currentAccount?.address, isConnected, walletAddress, connectWallet])

  // Show loading state while wallet context is initializing
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading wallet...</span>
        </div>
      </div>
    )
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
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <ConnectButton />
    </div>
  )
}
