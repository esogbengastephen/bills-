'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TokenSelector } from '@/components/TokenSelector'
import { SimpleWalletDisplay, NetworkIndicator, WalletProvider } from '@/components/SimpleWallet'
import { PaymentButton as SmartPaymentButton } from '@/components/SmartPaymentButton'
import { PaymentStatus } from '@/components/PaymentButton'
import { PriceConverter, PriceDisplay, ExchangeRateTicker } from '@/components/PriceConverter'

interface AirtimePlan {
  variation_code: string
  name: string
  variation_amount: string
  fixedPrice: string
}

interface Network {
  serviceID: string
  name: string
  icon: string
}

const networks: Network[] = [
  { serviceID: 'mtn', name: 'MTN Airtime', icon: 'phone_iphone' },
  { serviceID: 'airtel', name: 'Airtel Airtime', icon: 'phone_iphone' },
  { serviceID: 'glo', name: 'GLO Airtime', icon: 'phone_iphone' },
  { serviceID: '9mobile', name: '9mobile Airtime', icon: 'phone_iphone' },
]

const quickAmounts = [100, 200, 500, 1000, 2000, 5000]

export default function AirtimePurchase() {
  const router = useRouter()
  const [selectedToken, setSelectedToken] = useState('SUI')
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [txDigest, setTxDigest] = useState<string | undefined>()
  const [suiAmount, setSuiAmount] = useState<number>(0)
  const [nairaAmount, setNairaAmount] = useState<number>(0)

  const handlePurchase = async () => {
    if (!selectedNetwork || !phoneNumber || !amount) {
      setError('Please fill in all required fields')
      return
    }

    if (parseFloat(amount) < 50) {
      setError('Minimum airtime amount is ₦50')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // VTpass API call to purchase airtime
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'airtime',
          phone: phoneNumber,
          amount: parseFloat(amount),
          serviceID: selectedNetwork.serviceID
        }),
      })

      const result = await response.json()
      
      if (result.success && result.data) {
        // Success - redirect to success page
        router.push(`/success?transactionId=${result.data.requestId}&service=Airtime&amount=${amount}&phone=${phoneNumber}`)
      } else {
        throw new Error(result.error || 'Purchase failed')
      }
    } catch (err: any) {
      setError(err.message || 'Purchase failed. Please try again.')
      console.error('Purchase error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const generateRequestId = () => {
    return `VT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const formatAmount = (amount: string) => {
    return `₦${parseFloat(amount).toLocaleString()}`
  }

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString())
    setNairaAmount(quickAmount)
  }

  // Convert Naira amount to SUI when amount changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      setNairaAmount(parseFloat(amount))
    }
  }, [amount])

  const handlePaymentSuccess = (txDigest: string) => {
    setPaymentStatus('success')
    setTxDigest(txDigest)
    setError('')
    
    // Redirect to success page after a short delay
    setTimeout(() => {
      router.push(`/success?transactionId=${txDigest}&service=Airtime&amount=${amount}&phone=${phoneNumber}`)
    }, 2000)
  }

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error')
    setError(error)
  }

  const handleSuiAmountChange = (amount: number) => {
    setSuiAmount(amount)
  }

  const handleNairaAmountChange = (amount: number) => {
    setNairaAmount(amount)
  }

  // Convert Naira amount to SUI for payment
  const getSuiPaymentAmount = (): number => {
    return suiAmount > 0 ? suiAmount : 0
  }

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mobile-container py-6">
        {/* Header */}
        {/* Wallet Display - Centered at top */}
        <div className="flex justify-center mb-6">
          <SimpleWalletDisplay />
        </div>

        <header className="mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md"
              aria-label="Go back"
            >
              <span className="material-icons text-gray-600 dark:text-gray-400">arrow_back</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <ExchangeRateTicker />
              <NetworkIndicator />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
            Buy Airtime
          </h1>

          <div className="space-y-6">
            {/* Token Selection */}
            <TokenSelector
              selectedToken={selectedToken}
              onTokenSelect={setSelectedToken}
            />

            {/* Network Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Select Network
              </label>
              <div className="grid grid-cols-2 gap-3">
                {networks.map((network) => (
                  <button
                    key={network.serviceID}
                    onClick={() => setSelectedNetwork(network)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedNetwork?.serviceID === network.serviceID
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="material-icons text-primary text-2xl">{network.icon}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {network.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number (e.g., 08012345678)"
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 focus:ring-primary focus:border-primary text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Amount Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Amount
              </label>
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => handleQuickAmount(quickAmount)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      amount === quickAmount.toString()
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-sm font-semibold">₦{quickAmount.toLocaleString()}</span>
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  if (e.target.value && parseFloat(e.target.value) > 0) {
                    setNairaAmount(parseFloat(e.target.value))
                  }
                }}
                placeholder="Enter custom amount"
                min="50"
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 focus:ring-primary focus:border-primary text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum amount: ₦50
              </p>
            </div>

            {/* Price Converter */}
            <PriceConverter
              tokenAmount={suiAmount}
              tokenSymbol={selectedToken}
              nairaAmount={nairaAmount}
              onTokenChange={handleSuiAmountChange}
              onNairaChange={handleNairaAmountChange}
              showUsd={true}
            />

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="material-icons text-red-500 mr-2">error</span>
                  <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Purchase Summary */}
            {selectedNetwork && amount && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Purchase Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Network:</span>
                    <span className="text-gray-900 dark:text-gray-100">{selectedNetwork.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="text-gray-900 dark:text-gray-100">{phoneNumber || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatAmount(amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-gray-900 dark:text-gray-100">Total:</span>
                    <span className="text-primary">{formatAmount(amount)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Status */}
          <PaymentStatus 
            status={paymentStatus}
            txDigest={txDigest}
            error={error}
          />

          {/* Payment Button */}
          <div className="mt-8">
            <SmartPaymentButton
              amount={getSuiPaymentAmount().toString()}
              tokenType={selectedToken}
              serviceType="airtime"
              serviceDetails={{
                network: selectedNetwork?.serviceID || '',
                phoneNumber,
                amount: parseFloat(amount)
              }}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              disabled={!selectedNetwork || !phoneNumber || !amount || parseFloat(amount) < 50 || suiAmount <= 0}
            />
          </div>
        </main>
      </div>

      {/* Material Icons Font */}
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />
    </div>
    </WalletProvider>
  )
}
