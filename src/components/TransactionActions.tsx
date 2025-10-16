// src/components/TransactionActions.tsx

'use client'

import React, { useState } from 'react'

interface TransactionActionsProps {
  transactionId: string
  status: 'pending' | 'success' | 'failed'
  serviceType: string
  serviceDetails: any
  onStatusUpdate?: () => void
  className?: string
}

export function TransactionActions({
  transactionId,
  status,
  serviceType,
  serviceDetails,
  onStatusUpdate,
  className = ''
}: TransactionActionsProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRetry = async () => {
    if (status !== 'failed') return

    setIsRetrying(true)
    setError(null)

    try {
      const response = await fetch('/api/transactions/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txId: transactionId,
          serviceType,
          serviceDetails
        })
      })

      const result = await response.json()

      if (result.success) {
        onStatusUpdate?.()
      } else {
        setError(result.error || 'Retry failed')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setIsRetrying(false)
    }
  }

  const handleCancel = async () => {
    if (status !== 'pending') return

    setIsCancelling(true)
    setError(null)

    try {
      const response = await fetch('/api/transactions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txId: transactionId,
          reason: 'Cancelled by admin'
        })
      })

      const result = await response.json()

      if (result.success) {
        onStatusUpdate?.()
      } else {
        setError(result.error || 'Cancel failed')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setIsCancelling(false)
    }
  }

  if (status === 'success') {
    return (
      <div className={`flex items-center text-green-600 ${className}`}>
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm">Completed</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {status === 'failed' && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      )}

      {status === 'pending' && (
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCancelling ? 'Cancelling...' : 'Cancel'}
        </button>
      )}

      {error && (
        <div className="text-xs text-red-600 max-w-32 truncate" title={error}>
          {error}
        </div>
      )}
    </div>
  )
}
