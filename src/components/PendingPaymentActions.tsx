'use client'

import React, { useState } from 'react'
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit'
import { getSuiClient } from '@/lib/sui'
import { createBillPaymentContract } from '@/lib/bill-payment-contract'

interface PendingPaymentActionsProps {
  transactionId: string
  pendingPaymentId: string
  tokenType: string
  amount: number
  userAddress: string
  serviceType: string
  onActionComplete: () => void
}

export default function PendingPaymentActions({
  transactionId,
  pendingPaymentId,
  tokenType,
  amount,
  userAddress,
  serviceType,
  onActionComplete
}: PendingPaymentActionsProps) {
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  
  const [isConfirming, setIsConfirming] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check if user is admin
  const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '0x84716bc5b17eafc9efe7dd18cc62896808ec7725c13caf598da166a262710580'
  const isAdmin = currentAccount?.address === ADMIN_WALLET

  if (!isAdmin) {
    return null
  }

  const handleConfirm = async () => {
    if (!currentAccount) {
      setError('Please connect your wallet')
      return
    }

    setIsConfirming(true)
    setError(null)
    setSuccess(null)

    try {
      const suiClient = getSuiClient()
      const contract = createBillPaymentContract(suiClient, {
        packageId: process.env.NEXT_PUBLIC_CONTRACT_PACKAGE_ID || '',
        contractId: process.env.NEXT_PUBLIC_CONTRACT_OBJECT_ID || '',
        adminCapId: process.env.NEXT_PUBLIC_ADMIN_CAP_ID || '',
        upgradeCapId: process.env.NEXT_PUBLIC_UPGRADE_CAP_ID || ''
      })

      const result = await contract.confirmPayment(
        pendingPaymentId,
        tokenType,
        async (tx) => {
          return new Promise((resolve, reject) => {
            signAndExecuteTransaction(
              { transaction: tx },
              {
                onSuccess: (result) => {
                  resolve(result)
                },
                onError: (error) => {
                  reject(error)
                }
              }
            )
          })
        }
      )

      if (result.success) {
        setSuccess(`✅ Payment confirmed! Funds released to treasury.`)
        setTimeout(() => {
          onActionComplete()
        }, 2000)
      } else {
        setError(`Failed to confirm payment: ${result.error}`)
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleRefund = async () => {
    if (!currentAccount) {
      setError('Please connect your wallet')
      return
    }

    if (!refundReason.trim()) {
      setError('Please provide a refund reason')
      return
    }

    setIsRefunding(true)
    setError(null)
    setSuccess(null)

    try {
      const suiClient = getSuiClient()
      const contract = createBillPaymentContract(suiClient, {
        packageId: process.env.NEXT_PUBLIC_CONTRACT_PACKAGE_ID || '',
        contractId: process.env.NEXT_PUBLIC_CONTRACT_OBJECT_ID || '',
        adminCapId: process.env.NEXT_PUBLIC_ADMIN_CAP_ID || '',
        upgradeCapId: process.env.NEXT_PUBLIC_UPGRADE_CAP_ID || ''
      })

      const result = await contract.refundPayment(
        pendingPaymentId,
        tokenType,
        refundReason,
        async (tx) => {
          return new Promise((resolve, reject) => {
            signAndExecuteTransaction(
              { transaction: tx },
              {
                onSuccess: (result) => {
                  resolve(result)
                },
                onError: (error) => {
                  reject(error)
                }
              }
            )
          })
        }
      )

      if (result.success) {
        setSuccess(`✅ Payment refunded to user!`)
        setShowRefundDialog(false)
        setTimeout(() => {
          onActionComplete()
        }, 2000)
      } else {
        setError(`Failed to refund payment: ${result.error}`)
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`)
    } finally {
      setIsRefunding(false)
    }
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          ⏳ Pending Payment Actions
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Transaction ID:</strong> {transactionId}</p>
          <p><strong>Service:</strong> {serviceType}</p>
          <p><strong>Amount:</strong> {amount} {tokenType}</p>
          <p><strong>User:</strong> {userAddress.slice(0, 10)}...{userAddress.slice(-8)}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm">{success}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleConfirm}
          disabled={isConfirming || isRefunding}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isConfirming ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Confirming...
            </span>
          ) : (
            '✅ Confirm & Release Funds'
          )}
        </button>

        <button
          onClick={() => setShowRefundDialog(true)}
          disabled={isConfirming || isRefunding}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          🔄 Refund to User
        </button>
      </div>

      {/* Refund Dialog */}
      {showRefundDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Refund Payment
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Refund
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g., ClubKonnect service failed, insufficient balance, user request, etc."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRefundDialog(false)
                  setRefundReason('')
                  setError(null)
                }}
                disabled={isRefunding}
                className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={isRefunding || !refundReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isRefunding ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Confirm Refund'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

