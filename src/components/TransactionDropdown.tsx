'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: string
  user_address: string
  service_type: string
  token_type: string
  amount: number
  service_details: any
  tx_digest: string
  status: string
  created_at: string
}

function getServiceIcon(serviceType: string): string {
  switch (serviceType.toLowerCase()) {
    case 'airtime':
      return '📱'
    case 'data':
      return '📶'
    case 'electricity':
      return '💡'
    case 'tv':
      return '📺'
    default:
      return '💳'
  }
}

function getServiceDisplayName(serviceType: string): string {
  switch (serviceType.toLowerCase()) {
    case 'airtime':
      return 'Airtime'
    case 'data':
      return 'Data'
    case 'electricity':
      return 'Electricity'
    case 'tv':
      return 'TV Sub'
    default:
      return 'Payment'
  }
}

function formatAmount(amount: number, tokenType: string): string {
  const formattedAmount = amount.toFixed(2)
  return `${formattedAmount} ${tokenType}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return 'Today'
  } else if (diffDays === 2) {
    return 'Yesterday'
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

export default function TransactionDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const userEmail = localStorage.getItem('userEmail')
        
        if (!userEmail) {
          setError('Please log in')
          setLoading(false)
          return
        }

        const response = await fetch(`/api/transactions?email=${encodeURIComponent(userEmail)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch transactions')
        }

        // Get last 5 transactions
        setTransactions(data.transactions?.slice(0, 5) || [])
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchTransactions()
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleViewAll = () => {
    setIsOpen(false)
    router.push('/transaction-history')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <span className="material-icons text-gray-600 dark:text-gray-400">
                history
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Transaction History
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View all your payments
              </p>
            </div>
          </div>
          <span className={`material-icons text-blue-600 transition-transform ${isOpen ? 'rotate-90' : ''}`}>
            chevron_right
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No transactions yet
                </p>
              </div>
            ) : (
              <div className="py-2">
                {transactions.map((transaction: Transaction) => (
                  <div
                    key={transaction.id}
                    className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Service Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl">
                          {getServiceIcon(transaction.service_type)}
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {getServiceDisplayName(transaction.service_type)}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(transaction.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${
                              transaction.status === 'success' || transaction.status === 'confirmed'
                                ? 'text-green-600 dark:text-green-400'
                                : transaction.status === 'pending'
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {formatAmount(transaction.amount, transaction.token_type)}
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                              transaction.status === 'success' || transaction.status === 'confirmed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View All Button */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={handleViewAll}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <span className="material-icons text-sm mr-2">visibility</span>
              View All Transactions
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
