'use client'

import React, { useState, useEffect } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { circleService } from '@/lib/circle'
import { logger } from '@/lib/logger'

interface CirclePaymentProps {
  amount: string
  tokenType: 'USDC'
  serviceType: 'airtime' | 'data' | 'electricity' | 'tv'
  serviceDetails: any
  onSuccess: (paymentId: string) => void
  onError: (error: string) => void
  onCancel: () => void
}

export function CirclePayment({
  amount,
  tokenType,
  serviceType,
  serviceDetails,
  onSuccess,
  onError,
  onCancel
}: CirclePaymentProps) {
  const currentAccount = useCurrentAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [walletId, setWalletId] = useState<string | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [fees, setFees] = useState<number>(0)
  const [error, setError] = useState<string>('')

  // Initialize Circle wallet for user
  useEffect(() => {
    if (currentAccount?.address) {
      initializeCircleWallet()
    }
  }, [currentAccount?.address])

  const initializeCircleWallet = async () => {
    if (!currentAccount?.address) return

    try {
      setIsLoading(true)
      setError('')

      // Create or get existing wallet for user
      const walletResult = await fetch('/api/circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-wallet',
          userId: currentAccount.address
        })
      })

      const walletData = await walletResult.json()
      
      if (walletData.success) {
        setWalletId(walletData.data.walletId)
        await fetchBalance(walletData.data.walletId)
        await estimateFees(walletData.data.walletId)
      } else {
        setError(walletData.error || 'Failed to initialize wallet')
      }
    } catch (error: any) {
      console.error('Error initializing Circle wallet:', error)
      setError('Failed to initialize payment wallet')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBalance = async (walletId: string) => {
    try {
      const response = await fetch('/api/circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-balance',
          walletId,
          tokenType
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setBalance(data.data.balance)
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const estimateFees = async (walletId: string) => {
    try {
      const response = await fetch('/api/circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'estimate-fees',
          sourceWalletId: walletId,
          destinationAddress: '0x6220763d10670deccf70079ecf12b94b5ea20c9e016975228d73807f68db10d0', // Treasury address
          amount,
          tokenType
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setFees(data.data.fees)
      }
    } catch (error) {
      console.error('Error estimating fees:', error)
    }
  }

  const handlePayment = async () => {
    if (!walletId || !currentAccount?.address) {
      setError('Wallet not initialized')
      return
    }

    const totalAmount = parseFloat(amount) + fees
    if (balance < totalAmount) {
      setError(`Insufficient balance. Required: ${totalAmount.toFixed(6)} ${tokenType}, Available: ${balance.toFixed(6)} ${tokenType}`)
      return
    }

    try {
      setIsLoading(true)
      setError('')

      const description = `${serviceType.toUpperCase()} payment - ${JSON.stringify(serviceDetails)}`

      const response = await fetch('/api/circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-payment',
          sourceWalletId: walletId,
          destinationAddress: '0x6220763d10670deccf70079ecf12b94b5ea20c9e016975228d73807f68db10d0', // Treasury address
          amount,
          tokenType,
          description
        })
      })

      const data = await response.json()
      
      if (data.success) {
        logger.info('Circle payment initiated', {
          paymentId: data.data.paymentId,
          amount,
          tokenType,
          serviceType,
          userAddress: currentAccount.address
        })
        
        onSuccess(data.data.paymentId)
      } else {
        setError(data.error || 'Payment failed')
        onError(data.error || 'Payment failed')
      }
    } catch (error: any) {
      console.error('Error processing Circle payment:', error)
      setError('Payment processing failed')
      onError('Payment processing failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentAccount?.address) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <span className="material-icons text-red-500 mr-2">error</span>
          <p className="text-red-700 dark:text-red-300">Please connect your wallet to proceed with payment</p>
        </div>
      </div>
    )
  }

  if (isLoading && !walletId) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
          <p className="text-blue-700 dark:text-blue-300">Initializing Circle wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Payment Summary</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Amount:</span>
            <span className="font-medium">{amount} {tokenType}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Network Fee:</span>
            <span className="font-medium">{fees.toFixed(6)} {tokenType}</span>
          </div>
          
          <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Total:</span>
            <span className="font-semibold">{(parseFloat(amount) + fees).toFixed(6)} {tokenType}</span>
          </div>
        </div>
      </div>

      {/* Balance Check */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Available Balance:</span>
          <span className="font-medium">{balance.toFixed(6)} {tokenType}</span>
        </div>
        
        {balance < (parseFloat(amount) + fees) && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
            ⚠️ Insufficient balance for this transaction
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="material-icons text-red-500 mr-2">error</span>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handlePayment}
          disabled={isLoading || balance < (parseFloat(amount) + fees)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Pay ${(parseFloat(amount) + fees).toFixed(6)} ${tokenType}`
          )}
        </button>
        
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Circle Branding */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        Powered by <a href="https://developers.circle.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Circle</a>
      </div>
    </div>
  )
}
