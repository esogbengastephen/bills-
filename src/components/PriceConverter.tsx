'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { convertSuiToNaira, convertNairaToSui, formatCurrency, PriceConversion } from '@/lib/coingecko'

interface PriceConverterProps {
  tokenAmount?: number
  tokenSymbol?: string
  nairaAmount?: number
  onTokenChange?: (amount: number) => void
  onNairaChange?: (amount: number) => void
  className?: string
  showUsd?: boolean
}

export function PriceConverter({
  tokenAmount = 0,
  tokenSymbol = 'SUI',
  nairaAmount = 0,
  onTokenChange,
  onNairaChange,
  className = '',
  showUsd = false
}: PriceConverterProps) {
  const [conversion, setConversion] = useState<PriceConversion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Convert token to Naira
  const handleTokenToNaira = useCallback(async (amount: number, symbol: string) => {
    if (amount <= 0) {
      setConversion(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // For now, we'll use SUI conversion for all tokens
      // In a real implementation, you'd have separate conversion functions for each token
      const result = await convertSuiToNaira(amount)
      setConversion(result)
      setLastUpdated(new Date().toLocaleTimeString())
      onNairaChange?.(result.nairaAmount)
    } catch (err) {
      setError('Failed to fetch current exchange rate')
      console.error('Price conversion error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [onNairaChange])

  // Convert Naira to token
  const handleNairaToToken = useCallback(async (amount: number, symbol: string) => {
    if (amount <= 0) {
      setConversion(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // For now, we'll use SUI conversion for all tokens
      const result = await convertNairaToSui(amount)
      setConversion(result)
      setLastUpdated(new Date().toLocaleTimeString())
      onTokenChange?.(result.suiAmount)
    } catch (err) {
      setError('Failed to fetch current exchange rate')
      console.error('Price conversion error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [onTokenChange])

  // Auto-convert when tokenAmount changes
  useEffect(() => {
    if (tokenAmount > 0) {
      handleTokenToNaira(tokenAmount, tokenSymbol)
    }
  }, [tokenAmount, tokenSymbol, handleTokenToNaira])

  // Auto-convert when nairaAmount changes
  useEffect(() => {
    if (nairaAmount > 0) {
      handleNairaToToken(nairaAmount, tokenSymbol)
    }
  }, [nairaAmount, tokenSymbol, handleNairaToToken])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Exchange Rate Display */}
      {conversion && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-semibold">Exchange Rate:</span>
              <span className="ml-2">
                1 {tokenSymbol} = {formatCurrency(conversion.exchangeRate, 'NGN')}
              </span>
            </div>
            {lastUpdated && (
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Updated: {lastUpdated}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conversion Display */}
      {conversion && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{tokenSymbol} Amount:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {conversion.suiAmount.toFixed(4)} {tokenSymbol}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Naira Equivalent:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(conversion.nairaAmount, 'NGN')}
              </span>
            </div>

            {showUsd && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">USD Equivalent:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(conversion.usdAmount, 'USD')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Fetching current exchange rate...
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center">
            <span className="material-icons text-red-500 mr-2 text-sm">error</span>
            <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple price display component
interface PriceDisplayProps {
  suiAmount: number
  className?: string
  showUsd?: boolean
}

export function PriceDisplay({ suiAmount, className = '', showUsd = false }: PriceDisplayProps) {
  const [conversion, setConversion] = useState<PriceConversion | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (suiAmount > 0) {
      setIsLoading(true)
      convertSuiToNaira(suiAmount)
        .then(setConversion)
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [suiAmount])

  if (suiAmount <= 0) return null

  return (
    <div className={`text-sm ${className}`}>
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
          <span className="text-gray-500">Loading...</span>
        </div>
      ) : conversion ? (
        <div className="space-y-1">
          <div className="text-gray-600 dark:text-gray-400">
            ≈ {formatCurrency(conversion.nairaAmount, 'NGN')}
          </div>
          {showUsd && (
            <div className="text-gray-500 dark:text-gray-500 text-xs">
              ≈ {formatCurrency(conversion.usdAmount, 'USD')}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

// Exchange rate ticker component
export function ExchangeRateTicker({ className = '' }: { className?: string }) {
  const [rate, setRate] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const { convertSuiToNaira } = await import('@/lib/coingecko')
        const conversion = await convertSuiToNaira(1)
        setRate(conversion.exchangeRate)
        setLastUpdated(new Date().toLocaleTimeString())
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRate()
    
    // Update every 30 seconds
    const interval = setInterval(fetchRate, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-xs text-gray-500 dark:text-gray-400">SUI/NGN:</span>
      {isLoading ? (
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-16 rounded"></div>
      ) : rate ? (
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          ₦{rate.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ) : (
        <span className="text-xs text-gray-500">N/A</span>
      )}
      {lastUpdated && (
        <span className="text-xs text-gray-400">({lastUpdated})</span>
      )}
    </div>
  )
}
