'use client'

import { useState, useEffect, useRef } from 'react'
import { ConnectButton, useCurrentAccount, useWallets, useConnectWallet, useDisconnectWallet } from '@mysten/dapp-kit'

// Custom wallet connect button with proper state management
export function SuiWalletConnectButton() {
  const currentAccount = useCurrentAccount()
  const wallets = useWallets()
  const { mutate: connect } = useConnectWallet()
  const { mutate: disconnect } = useDisconnectWallet()
  const [isConnecting, setIsConnecting] = useState(false)
  const [showWalletList, setShowWalletList] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWalletList(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleConnect = async () => {
    if (wallets.length === 0) {
      alert('No Sui wallets detected. Please install Sui Wallet extension.')
      return
    }

    setIsConnecting(true)
    try {
      // Try to connect to the first available wallet
      const wallet = wallets[0]
      await connect({ wallet })
    } catch (error: any) {
      console.error('Connection failed:', error)
      alert(`Connection failed: ${error.message}`)
    } finally {
      setIsConnecting(false)
      setShowWalletList(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error: any) {
      console.error('Disconnection failed:', error)
    }
  }

  if (currentAccount) {
    return (
      <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">TESTNET</div>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Disconnect wallet"
        >
          <span className="material-icons text-sm text-red-500">logout</span>
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowWalletList(!showWalletList)}
        disabled={isConnecting}
        className="bg-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={`material-icons text-xl mr-2 ${isConnecting ? 'refresh animate-spin' : 'account_balance_wallet'}`} style={{ fontSize: '20px' }}>
          {isConnecting ? 'refresh' : 'account_balance_wallet'}
        </span>
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showWalletList && (
        <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[200px]">
          {wallets.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No wallets detected</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Please install Sui Wallet extension
              </p>
            </div>
          ) : (
            <div className="p-2">
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={handleConnect}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{wallet.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Version: {wallet.version}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function NetworkIndicator() {
  return (
    <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
      TESTNET
    </div>
  )
}
