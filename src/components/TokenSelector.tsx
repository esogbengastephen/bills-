'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { getTokenBalance, getTokenMetadata, SUI_TOKEN_ADDRESSES } from '@/lib/sui'

interface Token {
  symbol: string
  name: string
  address: string
  balance: string
  icon: string
  decimals: number
}

interface TokenSelectorProps {
  selectedToken: string
  onTokenSelect: (token: string) => void
  className?: string
}

const SUPPORTED_TOKENS: Token[] = [
  {
    symbol: 'SUI',
    name: 'Sui',
    address: SUI_TOKEN_ADDRESSES.SUI,
    balance: '0.00',
    icon: '🟡',
    decimals: 9
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: SUI_TOKEN_ADDRESSES.testnet.USDC,
    balance: '0.00',
    icon: '💙',
    decimals: 6
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: SUI_TOKEN_ADDRESSES.testnet.USDT,
    balance: '0.00',
    icon: '💚',
    decimals: 6
  }
]

export function TokenSelector({ selectedToken, onTokenSelect, className = '' }: TokenSelectorProps) {
  const currentAccount = useCurrentAccount()
  const [tokens, setTokens] = useState<Token[]>(SUPPORTED_TOKENS)
  const [isOpen, setIsOpen] = useState(false)

  const loadTokenBalances = useCallback(async () => {
    if (!currentAccount?.address) return

    const updatedTokens = await Promise.all(
      SUPPORTED_TOKENS.map(async (token) => {
        try {
          const balance = await getTokenBalance(currentAccount.address, token.address)
          return {
            ...token,
            balance: balance
          }
        } catch (error) {
          console.error(`Error loading balance for ${token.symbol}:`, error)
          return {
            ...token,
            balance: '0.0000'
          }
        }
      })
    )

    setTokens(updatedTokens)
  }, [currentAccount?.address])

  // Load token balances
  useEffect(() => {
    if (currentAccount?.address) {
      loadTokenBalances()
    }
  }, [currentAccount?.address, loadTokenBalances])

  const selectedTokenData = tokens.find(token => token.symbol === selectedToken)

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{selectedTokenData?.icon}</span>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">{selectedTokenData?.symbol}</div>
            <div className="text-xs text-gray-500">Balance: {selectedTokenData?.balance}</div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="py-1">
            {tokens.map((token) => (
              <button
                key={token.symbol}
                type="button"
                onClick={() => {
                  onTokenSelect(token.symbol)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 ${
                  selectedToken === token.symbol ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-2xl">{token.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{token.symbol}</div>
                  <div className="text-xs text-gray-500">{token.name}</div>
                </div>
                <div className="text-sm text-gray-500">{token.balance}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function TokenDisplay({ tokenSymbol, amount, className = '' }: { 
  tokenSymbol: string
  amount: string
  className?: string 
}) {
  const token = SUPPORTED_TOKENS.find(t => t.symbol === tokenSymbol)
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-lg">{token?.icon}</span>
      <span className="font-medium">{amount}</span>
      <span className="text-gray-500">{tokenSymbol}</span>
    </div>
  )
}