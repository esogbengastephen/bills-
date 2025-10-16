'use client'

import React, { useState } from 'react'
import { useCurrentAccount, useSignTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { normalizeSuiAddress } from '@mysten/sui/utils'
import { suiClient, getTokenAddresses } from '@/lib/sui'

interface PaymentButtonProps {
  amount: string
  tokenType: string
  serviceType: string
  serviceDetails: any
  onSuccess?: (txDigest: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export function PaymentButton({
  amount,
  tokenType,
  serviceType,
  serviceDetails,
  onSuccess,
  onError,
  disabled = false,
  className = ''
}: PaymentButtonProps) {
  const currentAccount = useCurrentAccount()
  const { mutate: signTransaction } = useSignTransaction()
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    if (!currentAccount?.address) {
      onError?.('No wallet connected')
      return
    }

    setIsProcessing(true)

    try {
      // Create payment transaction
      const txb = new Transaction()
      const tokenAddresses = getTokenAddresses()
      
      // Convert amount to smallest unit
      const decimals = tokenType === 'SUI' ? 9 : 6
      const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, decimals))
      
      // Treasury address (admin wallet)
      const treasuryAddress = '0x6220763d10670deccf70079ecf12b94b5ea20c9e016975228d73807f68db10d0'
      
      if (tokenType === 'SUI') {
        // Transfer SUI to treasury
        const [coin] = txb.splitCoins(txb.gas, [amountInSmallestUnit])
        txb.transferObjects([coin], normalizeSuiAddress(treasuryAddress))
      } else {
        // Transfer other tokens to treasury
        const tokenAddress = tokenType === 'USDC' ? tokenAddresses.USDC : tokenAddresses.USDT
        
        const [coin] = txb.splitCoins(
          txb.object(tokenAddress),
          [amountInSmallestUnit]
        )
        txb.transferObjects([coin], normalizeSuiAddress(treasuryAddress))
      }

      // Execute the transaction
      signTransaction(
        {
          transaction: txb
        },
        {
          onSuccess: async (result: any) => {
            console.log('✅ Payment transaction successful:', result)
            
            // Call the treasury API to credit the user
            try {
              const response = await fetch('/api/treasury', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userAddress: currentAccount.address,
                  amount,
                  tokenType,
                  userId: currentAccount.address, // Using address as userId for now
                  serviceType,
                  serviceDetails,
                  txDigest: result.digest
                })
              })

              const data = await response.json()
              
              if (data.success) {
                onSuccess?.(result.digest)
              } else {
                onError?.(data.error || 'Failed to credit account')
              }
            } catch (apiError) {
              console.error('Error calling treasury API:', apiError)
              onError?.('Payment successful but failed to credit account')
            }
          },
          onError: (error: any) => {
            console.error('❌ Payment transaction failed:', error)
            onError?.(error.message || 'Transaction failed')
          }
        }
      )
    } catch (error) {
      console.error('Error creating payment transaction:', error)
      onError?.(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || isProcessing || !currentAccount?.address}
      className={`w-full bg-primary text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isProcessing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing Payment...
        </>
      ) : (
        <>
          <span className="material-icons text-xl mr-2" style={{ fontSize: '20px' }}>
            payment
          </span>
          Pay {amount} {tokenType}
        </>
      )}
    </button>
  )
}

// Payment status component
export function PaymentStatus({ 
  status, 
  txDigest, 
  error 
}: { 
  status: 'idle' | 'processing' | 'success' | 'error'
  txDigest?: string
  error?: string 
}) {
  if (status === 'idle') return null

  return (
    <div className={`p-4 rounded-lg ${
      status === 'success' ? 'bg-green-50 border border-green-200' :
      status === 'error' ? 'bg-red-50 border border-red-200' :
      'bg-blue-50 border border-blue-200'
    }`}>
      {status === 'processing' && (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-800">Processing payment...</span>
        </div>
      )}
      
      {status === 'success' && txDigest && (
        <div className="text-green-800">
          <div className="flex items-center mb-2">
            <span className="material-icons text-green-600 mr-2">check_circle</span>
            <span className="font-semibold">Payment Successful!</span>
          </div>
          <div className="text-sm">
            Transaction: <code className="bg-green-100 px-2 py-1 rounded">{txDigest}</code>
          </div>
        </div>
      )}
      
      {status === 'error' && error && (
        <div className="text-red-800">
          <div className="flex items-center mb-2">
            <span className="material-icons text-red-600 mr-2">error</span>
            <span className="font-semibold">Payment Failed</span>
          </div>
          <div className="text-sm">{error}</div>
        </div>
      )}
    </div>
  )
}
