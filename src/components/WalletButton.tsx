'use client'

import { useState } from 'react'

interface WalletButtonProps {
  isConnected: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export default function WalletButton({ isConnected, onConnect, onDisconnect }: WalletButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      if (isConnected) {
        await onDisconnect()
      } else {
        await onConnect()
      }
    } catch (error) {
      console.error('Wallet operation failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      className={`
        bg-primary text-white font-semibold py-3 px-6 rounded-lg shadow-md 
        transition-all duration-200 flex items-center justify-center min-h-[44px]
        hover:bg-indigo-600 active:bg-indigo-700 focus:outline-none focus:ring-2 
        focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
        ${isLoading ? 'animate-pulse' : ''}
      `}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isConnected ? 'Disconnect wallet' : 'Connect wallet'}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          <span className="text-sm">Connecting...</span>
        </div>
      ) : (
        <>
          <span className="material-icons text-xl mr-2">account_balance_wallet</span>
          <span className="text-sm sm:text-base">
            {isConnected ? 'Disconnect' : 'Connect Wallet'}
          </span>
        </>
      )}
    </button>
  )
}
