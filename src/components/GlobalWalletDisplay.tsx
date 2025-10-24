'use client'

import { useWallet } from './WalletProvider'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { useState, useEffect } from 'react'

export function GlobalWalletDisplay() {
  const { walletAddress, isConnected, connectWallet, disconnectWallet } = useWallet()
  const currentAccount = useCurrentAccount()
  const [isConnecting, setIsConnecting] = useState(false)

  // Sync wallet state when currentAccount changes
  useEffect(() => {
    if (currentAccount?.address && !isConnected) {
      connectWallet(currentAccount.address)
    } else if (!currentAccount?.address && isConnected) {
      disconnectWallet()
    }
  }, [currentAccount?.address, isConnected, connectWallet, disconnectWallet])

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
