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

  // Check if this is a Circle-supported token
  const isCircleToken = tokenType === 'USDC'

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

    logger.info('Payment initiated', { 
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
      // Use hardcoded contract configuration (Multi-token Support)
      const contractConfig = {
        packageId: '0x219eacf20c949bdc9587bc8a751c98ccf1c5be1084e8f17d8e80b09cf4636c63',
        contractId: '0xe32ef5c24070548d931428c37c654221ed537ea569b2cfc93638dbe078b2946e',
        adminCapId: '0x9d9c074d04ceb0bd55650cf6388d8fb2509e1d4dc5abc278b88587a8e6542c02',
        upgradeCapId: '0xdaf0163130908255b0ad958b3fc0d547dc91228a331558fe6970a20d317e4cba',
      }

      if (!contractConfig.packageId || !contractConfig.contractId) {
        throw new Error('Contract not deployed. Please deploy the smart contract first.')
      }

      // Create contract instance
      const contract = createBillPaymentContract(suiClient, contractConfig)

      // Check if contract has credentials
      const hasCredentials = await contract.hasCredentials()
      if (!hasCredentials) {
        throw new Error('Contract credentials not set. Please contact admin.')
      }

      // Convert amount to smallest unit (SUI has 9 decimals)
      const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, 9))

      // Prepare service parameters
      const serviceParams = {
        network: serviceDetails.network || '',
        phoneNumber: serviceDetails.phoneNumber || '',
        amount: serviceDetails.amount || 0,
        dataPlan: serviceDetails.dataPlan || '',
        meterNumber: serviceDetails.meterNumber || '',
        disco: serviceDetails.disco || '',
      }

      // Call appropriate contract function based on service type
      let result
      switch (serviceType) {
        case 'airtime':
          result = await contract.purchaseAirtime(
            amountInSmallestUnit,
            serviceParams,
            async (tx: Transaction) => {
              return new Promise((resolve, reject) => {
                signAndExecuteTx(
                  { transaction: tx },
                  {
                    onSuccess: (result: any) => resolve(result),
                    onError: (error: any) => reject(error),
                  }
                )
              })
            }
          )
          break

        case 'data':
          result = await contract.purchaseData(
            amountInSmallestUnit,
            serviceParams,
            async (tx: Transaction) => {
              return new Promise((resolve, reject) => {
                signAndExecuteTx(
                  { transaction: tx },
                  {
                    onSuccess: (result: any) => resolve(result),
                    onError: (error: any) => reject(error),
                  }
                )
              })
            }
          )
          break

        case 'electricity':
          result = await contract.purchaseElectricity(
            amountInSmallestUnit,
            serviceParams,
            async (tx: Transaction) => {
              return new Promise((resolve, reject) => {
                signAndExecuteTx(
                  { transaction: tx },
                  {
                    onSuccess: (result: any) => resolve(result),
                    onError: (error: any) => reject(error),
                  }
                )
              })
            }
          )
          break

        default:
          throw new Error(`Unsupported service type: ${serviceType}`)
      }

      if (!result.success || !result.txDigest) {
        onError?.(result.error || 'Transaction failed')
        return
      }

      // After on-chain payment succeeds, fulfill service via backend (ClubKonnect)
      try {
        const body: any = { transactionDigest: result.txDigest }
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
        txDigest: result.txDigest,
        status: 'success'
      })

      logger.logServicePurchase(
        currentAccount.address,
        serviceType,
        parseFloat(amount),
        tokenType,
        'success'
      )

      setLastTxDigest(result.txDigest)
      setShowReceipt(true)
      onSuccess?.(result.txDigest)
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
