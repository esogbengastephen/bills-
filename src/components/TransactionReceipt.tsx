// src/components/TransactionReceipt.tsx

'use client'

import React from 'react'
import { useTransactionStatus } from '@/hooks/useTransactionStatus'

interface TransactionReceiptProps {
  txDigest: string
  serviceType: string
  amount: number
  tokenType: string
  serviceDetails: any
  className?: string
}

export function TransactionReceipt({
  txDigest,
  serviceType,
  amount,
  tokenType,
  serviceDetails,
  className = ''
}: TransactionReceiptProps) {
  const { status, isLoading, error } = useTransactionStatus(txDigest)

  if (isLoading && !status) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Checking transaction status...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700">Error: {error}</span>
        </div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'failed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'pending':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatGasUsed = (gasUsed: number) => {
    return (gasUsed / Math.pow(10, 9)).toFixed(4) + ' SUI'
  }

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {getStatusIcon()}
          <span className="ml-2 font-semibold capitalize">
            {status.status === 'success' ? 'Transaction Successful' : 
             status.status === 'failed' ? 'Transaction Failed' : 
             status.status === 'pending' ? 'Transaction Pending' : 'Transaction Status Unknown'}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {status.timestamp && formatTimestamp(status.timestamp)}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Transaction ID:</span>
          <span className="font-mono text-xs">{txDigest.slice(0, 8)}...{txDigest.slice(-8)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Service:</span>
          <span className="capitalize">{serviceType}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span>{amount.toFixed(4)} {tokenType}</span>
        </div>

        {serviceDetails.phoneNumber && (
          <div className="flex justify-between">
            <span className="text-gray-600">Phone:</span>
            <span>{serviceDetails.phoneNumber}</span>
          </div>
        )}

        {serviceDetails.network && (
          <div className="flex justify-between">
            <span className="text-gray-600">Network:</span>
            <span>{serviceDetails.network}</span>
          </div>
        )}

        {status.gasUsed > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Gas Used:</span>
            <span>{formatGasUsed(status.gasUsed)}</span>
          </div>
        )}

        {status.executed && (
          <div className="flex justify-between">
            <span className="text-gray-600">Executed:</span>
            <span className="text-green-600">✓ Yes</span>
          </div>
        )}
      </div>

      {status.status === 'pending' && (
        <div className="mt-3 text-xs text-gray-500">
          Transaction is being processed. This may take a few minutes.
        </div>
      )}

      {status.status === 'failed' && (
        <div className="mt-3 text-xs text-red-600">
          Transaction failed. Please check the details and try again.
        </div>
      )}
    </div>
  )
}
