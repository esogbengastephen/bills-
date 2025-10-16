// src/hooks/useTransactionStatus.ts

import { useState, useEffect, useCallback } from 'react'

export interface TransactionStatus {
  txDigest: string
  status: 'pending' | 'success' | 'failed' | 'unknown'
  executed: boolean
  gasUsed: number
  timestamp: number
  logEntry?: any
}

export function useTransactionStatus(txDigest: string | null, pollInterval = 3000) {
  const [status, setStatus] = useState<TransactionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!txDigest) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/transactions/status?txDigest=${txDigest}`)
      const result = await response.json()

      if (result.success) {
        setStatus(result.data)
      } else {
        setError(result.error || 'Failed to fetch transaction status')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setIsLoading(false)
    }
  }, [txDigest])

  useEffect(() => {
    if (!txDigest) return

    // Initial fetch
    fetchStatus()

    // Set up polling if transaction is still pending
    const interval = setInterval(() => {
      if (status?.status === 'pending' || status?.status === 'unknown') {
        fetchStatus()
      }
    }, pollInterval)

    return () => clearInterval(interval)
  }, [txDigest, fetchStatus, pollInterval, status?.status])

  const updateStatus = useCallback(async (newStatus: 'success' | 'failed', error?: string, errorCode?: string) => {
    if (!txDigest) return

    try {
      await fetch('/api/transactions/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txDigest,
          status: newStatus,
          error,
          errorCode
        })
      })
      
      // Refresh status after update
      fetchStatus()
    } catch (err: any) {
      console.error('Failed to update transaction status:', err)
    }
  }, [txDigest, fetchStatus])

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
    updateStatus
  }
}
