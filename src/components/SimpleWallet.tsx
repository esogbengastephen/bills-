'use client'

import React, { useState, useEffect } from 'react'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { getTokenBalance, SUI_TOKEN_ADDRESSES } from '@/lib/sui'

// Create a wallet context to share wallet state across components
export const WalletContext = React.createContext<{
  address: string | null
  balance: string
  isLoading: boolean
  isConnected: boolean
}>({
  address: null,
  balance: '0.00',
  isLoading: false,
  isConnected: false
})

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const currentAccount = useCurrentAccount()
  const [balance, setBalance] = useState('0.00')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch balance when account changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!currentAccount?.address) {
        setBalance('0.00')
        return
      }


      // Log wallet connection activity
      try {
        await fetch('/api/database/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: currentAccount.address,
            action: 'connect_wallet',
            details: {
              timestamp: new Date().toISOString(),
            },
          }),
        })
      } catch (error) {
        console.warn('Failed to log wallet connection:', error)
      }

      setIsLoading(true)
      try {
        // Use the same balance fetching logic as TokenSelector
        const balance = await getTokenBalance(currentAccount.address, SUI_TOKEN_ADDRESSES.SUI)
        setBalance(balance)
      } catch (error) {
        console.error('Error fetching balance:', error)
        setBalance('0.00')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [currentAccount?.address])

  return (
    <WalletContext.Provider value={{
      address: currentAccount?.address || null,
      balance,
      isLoading,
      isConnected: !!currentAccount
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export function SimpleWalletDisplay() {
  const { address, balance, isLoading, isConnected } = React.useContext(WalletContext)


  if (!isConnected || !address) {
    return (
      <ConnectButton />
    )
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-tr from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">S</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {shortAddress}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isLoading ? 'Loading...' : `${balance} SUI`}
          </div>
        </div>
      </div>
      <ConnectButton />
    </div>
  )
}

export function NetworkIndicator() {
  return (
    <div className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
      TESTNET
    </div>
  )
}