'use client'

import React, { useState } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { suiClient } from '@/lib/sui'
import { createBillPaymentContract, NETWORK_MAPPINGS } from '@/lib/bill-payment-contract'
import { transactionLogger } from '@/lib/transaction-logger'
import { TransactionReceipt } from './TransactionReceipt'
import { CirclePayment } from './CirclePayment'
import { logger } from '@/lib/logger'

interface PaymentButtonProps {
  amount: string // Amount in SUI
  tokenType: string // e.g., 'SUI', 'USDC', 'USDT'
  serviceType: string // e.g., 'airtime', 'data', 'electricity'
  serviceDetails: any // Specific details for the service
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
  const { mutate: signAndExecuteTx } = useSignAndExecuteTransaction()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastTxDigest, setLastTxDigest] = useState<string | null>(null)
  const [showCirclePayment, setShowCirclePayment] = useState(false)

  // Check if this is a Circle-supported token (disabled for now, using native Sui USDC)
  const isCircleToken = false // tokenType === 'USDC' - Changed to false to use native Sui USDC

  const handlePayment = async () => {
    if (!currentAccount?.address) {
      logger.warn('Payment attempted without wallet connection')
      onError?.('No wallet connected')
      return
    }

    if (parseFloat(amount) <= 0) {
      logger.warn('Invalid payment amount', { amount, userAddress: currentAccount.address })
      onError?.('Amount must be greater than 0')
      return
    }

    // For Circle tokens, show Circle payment interface
    if (isCircleToken) {
      setShowCirclePayment(true)
      return
    }

    // Continue with Sui blockchain payment for SUI token
    await processSuiPayment()
  }

  const processSuiPayment = async () => {
    if (!currentAccount?.address) return

    logger.info('Direct payment initiated', { 
      userAddress: currentAccount.address, 
      amount, 
      tokenType, 
      serviceType, 
      serviceDetails 
    })

      // Log wallet activity
      try {
        await fetch('/api/database/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: currentAccount.address,
            action: 'purchase_attempt',
            details: {
              serviceType,
              tokenType,
              amount: parseFloat(amount),
              serviceDetails,
            },
          }),
        })
      } catch (error) {
        console.warn('Failed to log wallet activity:', error)
      }

      setIsProcessing(true)

    try {
      // DIRECT PAYMENT - Send directly to admin wallet (no escrow)
      const { Transaction } = await import('@mysten/sui/transactions')
      const { normalizeSuiAddress } = await import('@mysten/sui/utils')
      const { getTokenAddresses } = await import('@/lib/sui')
      
      // Admin wallet address
      const adminWallet = '0xd08868079ac67d47cbd6634147bdcf96ac097921b42fe2f241a168b10ce9bdb9'
      
      // Convert amount to smallest unit
      const decimals = tokenType === 'SUI' ? 9 : 6
      const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, decimals))
      
      // Create direct transfer transaction
      const tx = new Transaction()
      const tokenAddresses = getTokenAddresses()
      
      if (tokenType === 'SUI') {
        // Transfer SUI directly to admin
        const [coin] = tx.splitCoins(tx.gas, [amountInSmallestUnit])
        tx.transferObjects([coin], normalizeSuiAddress(adminWallet))
      } else if (tokenType === 'USDC') {
        console.log('🔍 Processing USDC transfer to admin wallet')
        console.log('📍 Admin wallet:', adminWallet)
        console.log('💰 Amount (smallest units):', amountInSmallestUnit)
        console.log('📍 USDC coin type:', tokenAddresses.USDC)
        
        // Check SUI balance for gas first
        const suiBalance = await suiClient.getBalance({
          owner: currentAccount.address
        })
        const balanceInSUI = parseFloat(suiBalance.totalBalance) / 1e9
        console.log('⛽ SUI balance for gas:', balanceInSUI, 'SUI')
        
        if (balanceInSUI < 0.01) {
          throw new Error('Insufficient SUI for gas fees. Please ensure you have at least 0.01 SUI in your wallet to pay for transaction fees.')
        }
        
        try {
          // Get USDC balance and coins
          const [balance, coins] = await Promise.all([
            suiClient.getBalance({
              owner: currentAccount.address,
              coinType: tokenAddresses.USDC
            }),
            suiClient.getCoins({
              owner: currentAccount.address,
              coinType: tokenAddresses.USDC
            })
          ])
          
          console.log('✅ USDC balance:', balance.totalBalance, 'smallest units')
          console.log('✅ USDC coins found:', coins.data.length)
          
          if (BigInt(balance.totalBalance) < BigInt(amountInSmallestUnit)) {
            throw new Error(`Insufficient USDC balance. Required: ${amountInSmallestUnit}, Available: ${balance.totalBalance}`)
          }
          
          if (!coins.data || coins.data.length === 0) {
            throw new Error('No USDC coins found. Please ensure you have USDC in your wallet.')
          }
          
          console.log('📦 Coin IDs:', coins.data.map(c => ({ id: c.coinObjectId, balance: c.balance })))
          
          // Use first coin
          const primaryCoin = coins.data[0]
          console.log('🎯 Using primary coin:', primaryCoin.coinObjectId)
          
          // If multiple coins, merge them first
          if (coins.data.length > 1) {
            console.log('🔗 Merging multiple USDC coins')
            tx.mergeCoins(
              primaryCoin.coinObjectId, 
              coins.data.slice(1).map(c => c.coinObjectId)
            )
          }
          
          // Split the exact amount needed
          const [paymentCoin] = tx.splitCoins(
            primaryCoin.coinObjectId, 
            [amountInSmallestUnit]
          )
          
          // Transfer to admin wallet
          tx.transferObjects(
            [paymentCoin], 
            normalizeSuiAddress(adminWallet)
          )
          
          console.log(`✅ USDC payment coin created, ${amountInSmallestUnit} will be transferred to admin wallet:`, adminWallet)
        } catch (error: any) {
          console.error('❌ Error processing USDC:', error)
          throw new Error(`Failed to process USDC payment: ${error.message}`)
        }
      } else {
        throw new Error(`Unsupported token type: ${tokenType}`)
      }
      
      // Execute direct transfer
      const result = await new Promise<any>((resolve, reject) => {
        signAndExecuteTx(
          { transaction: tx },
          {
            onSuccess: (result: any) => resolve(result),
            onError: (error: any) => reject(error),
          }
        )
      })
      
      if (!result.digest) {
        throw new Error('Transaction failed')
      }
      
      console.log('✅ Direct payment successful:', result.digest)
      
      const txDigest = result.digest

      // After on-chain payment succeeds, fulfill service via backend (ClubKonnect)
      try {
        const serviceParams = {
          network: serviceDetails.network || '',
          phoneNumber: serviceDetails.phoneNumber || '',
          amount: serviceDetails.amount || 0,
          dataPlan: serviceDetails.dataPlan || '',
          meterNumber: serviceDetails.meterNumber || '',
          disco: serviceDetails.disco || '',
        }
        
        const body: any = { transactionDigest: txDigest }
        if (serviceType === 'airtime') {
          body.action = 'airtime'
          body.phone = serviceParams.phoneNumber
          body.amount = serviceParams.amount
          body.serviceID = serviceParams.network
        } else if (serviceType === 'data') {
          body.action = 'data'
          body.network = serviceParams.network
          body.phoneNumber = serviceParams.phoneNumber
          body.dataPlan = serviceParams.dataPlan
        } else if (serviceType === 'electricity') {
          body.action = 'electricity'
          body.disco = serviceParams.disco
          body.meterNumber = serviceParams.meterNumber
          body.amount = serviceParams.amount
        }

        const resp = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const apiRes = await resp.json()
        if (!apiRes.success) throw new Error(apiRes.error || 'Service purchase failed')
      } catch (e: any) {
        onError?.(e.message || 'Service purchase failed')
        return
      }

      // Log successful transaction
      transactionLogger.logTransaction({
        userAddress: currentAccount.address,
        serviceType: serviceType as any,
        tokenType,
        amount: parseFloat(amount),
        serviceDetails,
        txDigest: txDigest,
        status: 'success'
      })

      logger.logServicePurchase(
        currentAccount.address,
        serviceType,
        parseFloat(amount),
        tokenType,
        'success'
      )

      setLastTxDigest(txDigest)
      setShowReceipt(true)
      onSuccess?.(txDigest)
    } catch (error: any) {
      logger.error('Payment processing failed', {
        userAddress: currentAccount.address,
        amount,
        tokenType,
        serviceType,
        serviceDetails,
        error: error.message
      })

      logger.logServicePurchase(
        currentAccount.address,
        serviceType,
        parseFloat(amount),
        tokenType,
        'failed',
        error.message
      )

      console.error('Error processing payment:', error)
      onError?.(error.message || 'Failed to process payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCirclePaymentSuccess = (paymentId: string) => {
    logger.info('Circle payment successful', { 
      paymentId, 
      userAddress: currentAccount?.address,
      amount, 
      tokenType, 
      serviceType 
    })
    
    setShowCirclePayment(false)
    onSuccess?.(paymentId)
  }

  const handleCirclePaymentError = (error: string) => {
    logger.error('Circle payment failed', { 
      error, 
      userAddress: currentAccount?.address,
      amount, 
      tokenType, 
      serviceType 
    })
    
    onError?.(error)
  }

  const handleCirclePaymentCancel = () => {
    setShowCirclePayment(false)
  }

  // Show Circle payment interface for USDC/USDT
  if (showCirclePayment) {
    return (
      <div className={className}>
        <CirclePayment
          amount={amount}
          tokenType={tokenType as 'USDC' | 'USDT'}
          serviceType={serviceType as 'airtime' | 'data' | 'electricity' | 'tv'}
          serviceDetails={serviceDetails}
          onSuccess={handleCirclePaymentSuccess}
          onError={handleCirclePaymentError}
          onCancel={handleCirclePaymentCancel}
        />
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={disabled || isProcessing || !currentAccount?.address}
        className={`w-full bg-primary text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <span className="material-icons text-xl mr-2" style={{ fontSize: '20px' }}>
              payment
            </span>
            {isCircleToken ? `Pay with ${tokenType}` : `Pay ${parseFloat(amount).toFixed(2)} ${tokenType}`}
          </>
        )}
      </button>

      {showReceipt && lastTxDigest && (
        <div className="mt-4">
          <TransactionReceipt
            txDigest={lastTxDigest}
            serviceType={serviceType}
            amount={parseFloat(amount)}
            tokenType={tokenType}
            serviceDetails={serviceDetails}
          />
          <button
            onClick={() => setShowReceipt(false)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Hide Receipt
          </button>
        </div>
      )}
    </div>
  )
}

export function PaymentStatus({ status, txDigest, error }: { status: 'idle' | 'processing' | 'success' | 'error', txDigest?: string, error?: string }) {
  if (status === 'idle') return null

  return (
    <div className={`mt-4 p-4 rounded-lg ${status === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
      <div className="flex items-center">
        <span className="material-icons mr-2">{status === 'success' ? 'check_circle' : 'error'}</span>
        <div>
          <p className="font-semibold">{status === 'success' ? 'Payment Successful!' : 'Payment Failed'}</p>
          {txDigest && <p className="text-sm">Transaction ID: {txDigest.slice(0, 6)}...{txDigest.slice(-4)}</p>}
          {error && <p className="text-sm">{error}</p>}
        </div>
      </div>
    </div>
  )
}
