'use client'

import { useState, useEffect } from 'react'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { SuiClient } from '@mysten/sui/client'

// Compact wallet display for headers
export function CompactWalletDisplay() {
  const [keypair, setKeypair] = useState<Ed25519Keypair | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Initialize Sui client for testnet
  const suiClient = new SuiClient({
    url: 'https://fullnode.testnet.sui.io:443'
  })

  // Set client flag on mount and load wallet
  useEffect(() => {
    // Use a small timeout to ensure proper hydration
    const timer = setTimeout(() => {
      setIsClient(true)
      
      // Load wallet from localStorage immediately after client-side hydration
      const savedWallet = localStorage.getItem('sui-wallet-keypair')
      if (savedWallet) {
        try {
          const loadedKeypair = Ed25519Keypair.fromSecretKey(savedWallet)
          setKeypair(loadedKeypair)
        } catch (error) {
          console.error('Error loading saved wallet:', error)
          localStorage.removeItem('sui-wallet-keypair')
        }
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Save wallet to localStorage when it changes
  useEffect(() => {
    if (keypair && isClient) {
      localStorage.setItem('sui-wallet-keypair', keypair.getSecretKey())
    }
  }, [keypair, isClient])

  // Get balance for current address
  const getBalance = async () => {
    if (!keypair) return

    setIsLoading(true)
    try {
      const address = keypair.getPublicKey().toSuiAddress()
      const balance = await suiClient.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI'
      })
      setBalance((parseInt(balance.totalBalance) / 1e9).toFixed(4))
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance('0')
    } finally {
      setIsLoading(false)
    }
  }

  // Load balance when keypair changes
  useEffect(() => {
    if (keypair) {
      getBalance()
    }
  }, [keypair])

  // Generate new wallet
  const generateNewWallet = () => {
    const newKeypair = new Ed25519Keypair()
    setKeypair(newKeypair)
  }

  // Disconnect wallet
  const disconnectWallet = () => {
    setKeypair(null)
    setBalance('0')
    if (isClient) {
      localStorage.removeItem('sui-wallet-keypair')
    }
  }

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300">
        Loading...
      </div>
    )
  }

  if (!keypair) {
    return (
      <button
        onClick={generateNewWallet}
        className="bg-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-600 transition-colors flex items-center"
      >
        <span className="material-icons text-xl mr-2" style={{ fontSize: '20px' }}>
          account_balance_wallet
        </span>
        Connect Wallet
      </button>
    )
  }

  const address = keypair.getPublicKey().toSuiAddress()
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
      <button
        onClick={disconnectWallet}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Disconnect wallet"
      >
        <span className="material-icons text-sm text-red-500">logout</span>
      </button>
    </div>
  )
}

// Network indicator component
export function NetworkIndicator() {
  return (
    <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
      TESTNET
    </div>
  )
}
