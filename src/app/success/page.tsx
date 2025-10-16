'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { SimpleWalletDisplay, WalletProvider } from '@/components/SimpleWallet'

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [service, setService] = useState<string | null>(null)
  const [amount, setAmount] = useState<string | null>(null)

  useEffect(() => {
    const id = searchParams.get('transactionId')
    const serviceType = searchParams.get('service')
    const transactionAmount = searchParams.get('amount')
    
    setTransactionId(id)
    setService(serviceType)
    setAmount(transactionAmount)
  }, [searchParams])

  const handleGoHome = () => {
    router.push('/')
  }

  const handleViewHistory = () => {
    router.push('/')
  }

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType?.toLowerCase()) {
      case 'airtime':
        return 'phone_iphone'
      case 'data':
        return 'wifi'
      case 'tv subscription':
        return 'tv'
      case 'electricity':
        return 'lightbulb'
      default:
        return 'check_circle'
    }
  }

  const getServiceMessage = (serviceType: string) => {
    switch (serviceType?.toLowerCase()) {
      case 'airtime':
        return 'Your airtime has been credited successfully'
      case 'data':
        return 'Your data bundle has been activated successfully'
      case 'tv subscription':
        return 'Your TV subscription has been renewed successfully'
      case 'electricity':
        return 'Your electricity has been purchased successfully'
      default:
        return 'Your purchase has been completed successfully'
    }
  }

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mobile-container py-6">
          {/* Wallet Display - Centered at top */}
          <div className="flex justify-center mb-6">
            <SimpleWalletDisplay />
          </div>

          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <button
              onClick={handleGoHome}
              className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md"
              aria-label="Go home"
            >
              <span className="material-icons text-gray-600 dark:text-gray-400">home</span>
            </button>
          </header>

        {/* Main Content */}
        <main className="text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-green-500 text-5xl">
                {getServiceIcon(service || '')}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Purchase Successful!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {getServiceMessage(service || '')}
            </p>
          </div>

          {/* Transaction Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Transaction Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Service:</span>
                <span className="text-gray-900 dark:text-gray-100">{service || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {amount ? `₦${parseFloat(amount).toLocaleString()}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                  {transactionId || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="text-green-500 font-semibold">Completed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Date:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Time:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleGoHome}
              className="w-full bg-primary text-white font-bold py-4 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors duration-300"
            >
              Back to Home
            </button>
            
            <button
              onClick={handleViewHistory}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold py-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
            >
              View Transaction History
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start">
              <span className="material-icons text-blue-500 mr-2 mt-1">info</span>
              <div className="text-left">
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  <strong>Note:</strong> {service?.toLowerCase() === 'data' 
                    ? 'Your data bundle will be activated within 5-10 minutes. You will receive a confirmation SMS from your network provider.'
                    : service?.toLowerCase() === 'airtime'
                    ? 'Your airtime has been credited instantly. You will receive a confirmation SMS from your network provider.'
                    : service?.toLowerCase() === 'tv subscription'
                    ? 'Your TV subscription will be activated within 5-10 minutes. You will receive a confirmation SMS.'
                    : service?.toLowerCase() === 'electricity'
                    ? 'Your electricity token will be generated within 5-10 minutes. You will receive a confirmation SMS with your token.'
                    : 'You will receive a confirmation SMS for your purchase.'
                  }
                </p>
              </div>
            </div>
          </div>
        </main>
        </div>
      </div>

      {/* Material Icons Font */}
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />
    </WalletProvider>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}
