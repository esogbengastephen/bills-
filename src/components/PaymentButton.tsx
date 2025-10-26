'use client'

import React, { useState } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
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
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    if (!currentAccount?.address) {
      onError?.('No wallet connected')
      return
    }

    setIsProcessing(true)

    try {
      // Check SUI balance for gas if paying with non-SUI token
      if (tokenType !== 'SUI') {
        const suiBalance = await suiClient.getBalance({
          owner: currentAccount.address
        })
        
        const balanceInSUI = parseFloat(suiBalance.totalBalance) / 1e9
        
        // Require at least 0.01 SUI for gas
        if (balanceInSUI < 0.01) {
          onError?.('Insufficient SUI for gas fees. Please ensure you have at least 0.01 SUI in your wallet to pay for transaction fees.')
          setIsProcessing(false)
          return
        }
        
        console.log(`SUI balance check: ${balanceInSUI} SUI (minimum 0.01 required for gas)`)
      }

      // Create payment transaction
      const txb = new Transaction()
      const tokenAddresses = getTokenAddresses()
      
      // Convert amount to smallest unit
      const decimals = tokenType === 'SUI' ? 9 : 6
      const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, decimals))
      
      // Treasury address (admin wallet)
      const treasuryAddress = '0xd08868079ac67d47cbd6634147bdcf96ac097921b42fe2f241a168b10ce9bdb9'
      
      if (tokenType === 'SUI') {
        // Transfer SUI to treasury
        const [coin] = txb.splitCoins(txb.gas, [amountInSmallestUnit])
        txb.transferObjects([coin], normalizeSuiAddress(treasuryAddress))
      } else {
        // Transfer other tokens (USDC/USDT) to treasury
        // First, we need to get the user's coin objects for the token
        const balanceResult = await suiClient.getBalance({
          owner: currentAccount.address,
          coinType: tokenType === 'USDC' ? tokenAddresses.USDC : tokenAddresses.USDT
        })
        
        if (BigInt(balanceResult.totalBalance) < BigInt(amountInSmallestUnit)) {
          throw new Error(`Insufficient ${tokenType} balance`)
        }
        
        // Get the coin objects for the specific token
        const coinType = tokenType === 'USDC' ? tokenAddresses.USDC : tokenAddresses.USDT
        const coins = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType
        })
        
        // Merge coins if needed
        if (coins.data.length > 0) {
          const primaryCoin = coins.data[0]
          
          // If we have multiple coins, merge them first
          if (coins.data.length > 1) {
            txb.mergeCoins(primaryCoin.coinObjectId, coins.data.slice(1).map(c => c.coinObjectId))
          }
          
          // Split the required amount
          const [coin] = txb.splitCoins(primaryCoin.coinObjectId, [amountInSmallestUnit])
          txb.transferObjects([coin], normalizeSuiAddress(treasuryAddress))
        } else {
          throw new Error(`No ${tokenType} coins found in wallet`)
        }
      }

      // Execute the transaction
      signAndExecuteTransaction(
        {
          transaction: txb
        },
        {
          onSuccess: async (result: any) => {
            console.log('✅ Payment transaction successful:', result)
            
            // Get user email from localStorage
            const userEmail = localStorage.getItem('userEmail')
            
            if (!userEmail) {
              console.warn('No user email found in localStorage')
              onSuccess?.(result.digest)
              return
            }

            // Create transaction record in Supabase
            try {
              const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userEmail,
                  userAddress: currentAccount.address,
                  serviceType,
                  tokenType,
                  amount: parseFloat(amount),
                  serviceDetails,
                  txDigest: result.digest,
                  status: 'success'
                })
              })

              const data = await response.json()
              
              if (data.success) {
                console.log('✅ Transaction recorded successfully:', data.transaction)
                onSuccess?.(result.digest)
              } else {
                console.error('Failed to record transaction:', data.error)
                onSuccess?.(result.digest) // Still call success since payment went through
              }
            } catch (apiError) {
              console.error('Error recording transaction:', apiError)
              onSuccess?.(result.digest) // Still call success since payment went through
            }
          },
          onError: async (error: any) => {
            console.error('❌ Payment transaction failed:', error)
            
            // Record failed transaction if we have user email
            const userEmail = localStorage.getItem('userEmail')
            if (userEmail) {
              try {
                await fetch('/api/transactions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    userEmail,
                    userAddress: currentAccount.address,
                    serviceType,
                    tokenType,
                    amount: parseFloat(amount),
                    serviceDetails,
                    txDigest: `failed_${Date.now()}`, // Generate a unique ID for failed transactions
                    status: 'failed',
                    error: error.message || 'Transaction failed'
                  })
                })
              } catch (apiError) {
                console.error('Error recording failed transaction:', apiError)
              }
            }
            
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
