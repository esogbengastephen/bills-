'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction, useConnectWallet, useWallets } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { suiClient } from '@/lib/sui'
import { createBillPaymentContract } from '@/lib/bill-payment-contract'
import { transactionLogger } from '@/lib/transaction-logger'
import { TransactionActions } from '@/components/TransactionActions'

interface ContractInfo {
  admin: string
  treasuryBalance: number
  totalTransactions: number
  totalVolume: number
}

interface TransactionRecord {
  id: string
  userAddress: string
  serviceType: string
  network: string
  phoneNumber: string
  amount: number
  status: string
  timestamp: number
  txDigest: string
}

// Use the admin wallet from your connected wallet
const ADMIN_WALLET = '0x6220763d10670deccf70079ecf12b94b5ea20c9e016975228d73807f68db10d0'

export default function AdminDashboard() {
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecuteTx } = useSignAndExecuteTransaction()
  const { mutate: connectWallet } = useConnectWallet()
  const wallets = useWallets()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null)
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [transactionLogs, setTransactionLogs] = useState<any[]>([])
  const [credentials, setCredentials] = useState({
    userId: '',
    apiKey: '',
    apiUrl: 'https://www.nellobytesystems.com'
  })
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false)
  const [error, setError] = useState('')

  // Contract configuration
  const contractConfig = useMemo(() => ({
    packageId: '0x219eacf20c949bdc9587bc8a751c98ccf1c5be1084e8f17d8e80b09cf4636c63',
    contractId: '0xe32ef5c24070548d931428c37c654221ed537ea569b2cfc93638dbe078b2946e',
    adminCapId: '0x9d9c074d04ceb0bd55650cf6388d8fb2509e1d4dc5abc278b88587a8e6542c02',
    upgradeCapId: '0xdaf0163130908255b0ad958b3fc0d547dc91228a331558fe6970a20d317e4cba',
  }), [])

  // Simplified authentication - just check if admin wallet is connected
  useEffect(() => {
    if (currentAccount?.address) {
      if (currentAccount.address === ADMIN_WALLET) {
        // Admin wallet detected - automatically authenticate
        setIsAuthenticated(true)
        setAuthError('')
      } else {
        setIsAuthenticated(false)
        setAuthError('Only the admin wallet can access this dashboard')
      }
    } else {
      setIsAuthenticated(false)
      setAuthError('')
    }
  }, [currentAccount?.address])

  const loadContractInfo = useCallback(async () => {
    try {
      const contract = createBillPaymentContract(suiClient, contractConfig)
      const info = await contract.getContractInfo()
      setContractInfo(info)
    } catch (error) {
      console.error('Error loading contract info:', error)
      setError('Failed to load contract information')
    }
  }, [contractConfig])

  const loadAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/database/analytics')
      const result = await response.json()
      if (result.success) {
        setAnalytics(result.data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }, [])

  const loadTransactionLogs = useCallback(async () => {
    try {
      const logs = await transactionLogger.getTransactions()
      setTransactionLogs(logs)
    } catch (error) {
      console.error('Error loading transaction logs:', error)
    }
  }, [])

  // Load contract info
  useEffect(() => {
    if (isAuthenticated) {
      loadContractInfo()
      loadTransactionLogs()
      loadAnalytics()
    }
  }, [isAuthenticated, loadContractInfo, loadTransactionLogs, loadAnalytics])

  const handleSetCredentials = async () => {
    if (!credentials.userId || !credentials.apiKey) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoadingCredentials(true)
    setError('')

    try {
      const contract = createBillPaymentContract(suiClient, contractConfig)
      
      const result = await contract.setCredentials(
        credentials.userId,
        credentials.apiKey,
        credentials.apiUrl,
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

      if (result.success) {
        setError('')
        alert('Credentials set successfully!')
        loadContractInfo() // Reload contract info
      } else {
        setError(result.error || 'Failed to set credentials')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to set credentials')
    } finally {
      setIsLoadingCredentials(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatAmount = (amount: number) => {
    return (amount / Math.pow(10, 9)).toFixed(4) // SUI has 9 decimals
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const handleConnectWallet = async () => {
    if (wallets.length === 0) {
      alert('No Sui wallets detected. Please install Sui Wallet extension.')
      return
    }

    try {
      // Connect to the first available wallet
      const wallet = wallets[0]
      await connectWallet({ wallet })
    } catch (error: any) {
      console.error('Connection failed:', error)
      alert(`Connection failed: ${error.message}`)
    }
  }


  if (!currentAccount?.address) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600 mb-6">Connect your wallet to access the admin dashboard.</p>
            </div>
            
            <div className="w-full">
              <button
                onClick={handleConnectWallet}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Connect Wallet
              </button>
            </div>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>Only the admin wallet can access this dashboard:</p>
              <p className="font-mono text-xs mt-1">{formatAddress(ADMIN_WALLET)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-2">{authError || 'Only the admin wallet can access this dashboard.'}</p>
          <p className="text-sm text-gray-500">Connected: {formatAddress(currentAccount.address)}</p>
          <p className="text-sm text-gray-500">Required: {formatAddress(ADMIN_WALLET)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your bill payment contract and monitor transactions</p>
            </div>
            
            {/* Wallet Status */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Connected Wallet</div>
                <div className="font-mono text-sm text-gray-900">{formatAddress(currentAccount.address)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Info Cards */}
        {contractInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Treasury Balance</h3>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(contractInfo.treasuryBalance)} SUI</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
              <p className="text-2xl font-bold text-gray-900">{contractInfo.totalTransactions}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Volume</h3>
              <p className="text-2xl font-bold text-gray-900">{formatAmount(contractInfo.totalVolume)} SUI</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Admin Address</h3>
              <p className="text-sm font-mono text-gray-900">{formatAddress(contractInfo.admin)}</p>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Analytics Overview</h2>
                  <p className="text-sm text-gray-500">Database analytics and user insights</p>
                </div>
                <button
                  onClick={loadAnalytics}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-600">Total Transactions</h3>
                  <p className="text-2xl font-bold text-blue-900">{analytics.transactions?.totalTransactions || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-600">Total Volume</h3>
                  <p className="text-2xl font-bold text-green-900">{formatAmount(analytics.transactions?.totalVolume || 0)} SUI</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-purple-600">Total Wallets</h3>
                  <p className="text-2xl font-bold text-purple-900">{analytics.wallets?.totalWallets || 0}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-orange-600">Active Wallets</h3>
                  <p className="text-2xl font-bold text-orange-900">{analytics.wallets?.activeWallets || 0}</p>
                </div>
              </div>

              {/* Top Wallets */}
              {analytics.wallets?.topWallets && analytics.wallets.topWallets.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Top Wallets by Volume</h3>
                  <div className="space-y-2">
                    {analytics.wallets.topWallets.slice(0, 5).map((wallet: any, index: number) => (
                      <div key={wallet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-mono text-sm text-gray-900">{formatAddress(wallet.userAddress)}</p>
                            <p className="text-xs text-gray-500">{wallet.totalTransactions} transactions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatAmount(wallet.totalVolume)} SUI</p>
                          <p className="text-xs text-gray-500">Last seen: {formatTimestamp(wallet.lastSeen)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction Status Breakdown */}
              {analytics.transactions?.byStatus && analytics.transactions.byStatus.length > 0 && (
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Transaction Status Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analytics.transactions.byStatus.map((status: any) => (
                      <div key={status.status} className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-600 capitalize">{status.status}</p>
                        <p className="text-xl font-bold text-gray-900">{status._count.status}</p>
                        <p className="text-xs text-gray-500">{formatAmount(status._sum.amount || 0)} SUI</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction Logs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Transaction Logs</h2>
                <p className="text-sm text-gray-500">Real-time transaction monitoring</p>
              </div>
              <button
                onClick={loadTransactionLogs}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="p-6">
            {transactionLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactionLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          log.status === 'success' ? 'bg-green-100 text-green-800' :
                          log.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.status}
                        </span>
                        <span className="text-sm font-medium text-gray-900 capitalize">{log.serviceType}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{formatTimestamp(log.timestamp)}</span>
                        <TransactionActions
                          transactionId={log.id}
                          status={log.status}
                          serviceType={log.serviceType}
                          serviceDetails={log.serviceDetails}
                          onStatusUpdate={loadTransactionLogs}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <p className="font-medium">{log.amount.toFixed(4)} {log.tokenType}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">User:</span>
                        <p className="font-mono text-xs">{formatAddress(log.userAddress)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">TX ID:</span>
                        <p className="font-mono text-xs">{log.txDigest.slice(0, 8)}...{log.txDigest.slice(-8)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Service:</span>
                        <p className="capitalize">{log.serviceType}</p>
                      </div>
                    </div>
                    {log.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        Error: {log.error}
                      </div>
                    )}
                  </div>
                ))}
                {transactionLogs.length > 10 && (
                  <div className="text-center pt-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View all {transactionLogs.length} transactions
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Credentials Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">ClubKonnect Credentials</h2>
            <p className="text-sm text-gray-600">Set your ClubKonnect API credentials for the contract</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID *
                </label>
                <input
                  type="text"
                  value={credentials.userId}
                  onChange={(e) => setCredentials({ ...credentials, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter ClubKonnect User ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key *
                </label>
                <input
                  type="password"
                  value={credentials.apiKey}
                  onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter ClubKonnect API Key"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <input
                type="url"
                value={credentials.apiUrl}
                onChange={(e) => setCredentials({ ...credentials, apiUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.nellobytesystems.com"
              />
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <button
              onClick={handleSetCredentials}
              disabled={isLoadingCredentials || !credentials.userId || !credentials.apiKey}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingCredentials ? 'Setting...' : 'Set Credentials'}
            </button>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <p className="text-sm text-gray-600">Monitor all contract transactions</p>
          </div>
          <div className="p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions found</p>
                <p className="text-sm text-gray-400 mt-2">Transactions will appear here as users make payments</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {formatAddress(tx.txDigest)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tx.serviceType} - {tx.network}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatAmount(tx.amount)} SUI
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            tx.status === 'success' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTimestamp(tx.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}