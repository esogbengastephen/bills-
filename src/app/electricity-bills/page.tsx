'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TokenSelector } from '@/components/TokenSelector'
import { SUI_TOKENS, DEFAULT_TOKEN } from '@/lib/tokens'
import { GlobalWalletDisplay } from '@/components/SimpleWallet'
import { useWallet } from '@/components/WalletProvider'
import { PaymentButton as SmartPaymentButton } from '@/components/SmartPaymentButton'
import { PaymentStatus } from '@/components/PaymentButton'
import { PriceConverter, ExchangeRateTicker } from '@/components/PriceConverter'

interface ElectricityPlan {
  variation_code: string
  name: string
  variation_amount: string
  fixedPrice: string
}

interface ElectricityProvider {
  serviceID: string
  name: string
  icon: string
  shortName: string
}

const electricityProviders: ElectricityProvider[] = [
  // Real ClubKonnect electricity providers from API documentation
  { serviceID: 'eko', name: 'Eko Electric', icon: 'lightbulb', shortName: 'EKEDC' },
  { serviceID: 'ikeja', name: 'Ikeja Electric', icon: 'lightbulb', shortName: 'IKEDC' },
  { serviceID: 'abuja', name: 'Abuja Electric', icon: 'lightbulb', shortName: 'AEDC' },
  { serviceID: 'kano', name: 'Kano Electric', icon: 'lightbulb', shortName: 'KEDC' },
  { serviceID: 'portharcourt', name: 'Porthacourt Electric', icon: 'lightbulb', shortName: 'PHEDC' },
  { serviceID: 'jos', name: 'Jos Electric', icon: 'lightbulb', shortName: 'JEDC' },
  { serviceID: 'ibadan', name: 'Ibadan Electric', icon: 'lightbulb', shortName: 'IBEDC' },
  { serviceID: 'kaduna', name: 'Kaduna Electric', icon: 'lightbulb', shortName: 'KAEDC' },
  { serviceID: 'enugu', name: 'Enugu Electric', icon: 'lightbulb', shortName: 'EEDC' },
  { serviceID: 'benin', name: 'Benin Electric', icon: 'lightbulb', shortName: 'BEDC' },
  { serviceID: 'yola', name: 'Yola Electric', icon: 'lightbulb', shortName: 'YEDC' },
  { serviceID: 'aba', name: 'Aba Electric', icon: 'lightbulb', shortName: 'APLE' },
]

const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000]

export default function ElectricityBills() {
  const router = useRouter()
  const [selectedToken, setSelectedToken] = useState('SUI')
  const [selectedProvider, setSelectedProvider] = useState<ElectricityProvider | null>(null)
  const [meterNumber, setMeterNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [txDigest, setTxDigest] = useState<string | undefined>()
  const [suiAmount, setSuiAmount] = useState<number>(0)
  const [nairaAmount, setNairaAmount] = useState<number>(0)

  const handlePurchase = async () => {
    if (!selectedProvider || !meterNumber || !amount || !phoneNumber) {
      setError('Please fill in all required fields')
      return
    }

    if (parseFloat(amount) < 100) {
      setError('Minimum electricity amount is ₦100')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // VTpass API call to purchase electricity
      const purchaseData = {
        request_id: generateRequestId(),
        serviceID: selectedProvider.serviceID,
        billersCode: meterNumber,
        variation_code: 'prepaid', // Fixed variation code for prepaid electricity
        amount: amount,
        phone: phoneNumber,
      }

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      })

      if (!response.ok) {
        throw new Error('Purchase failed')
      }

      const result = await response.json()
      
      if (result.content && result.content.transactions) {
        // Success - redirect to success page
        router.push(`/success?transactionId=${result.content.transactions.transactionId}&service=Electricity&amount=${amount}`)
      } else {
        throw new Error('Purchase failed')
      }
    } catch (err) {
      setError('Purchase failed. Please try again.')
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

  const handlePaymentSuccess = (txDigest: string) => {
    setPaymentStatus('success')
    setTxDigest(txDigest)
    setError('')
    
    // Redirect to success page after a short delay
    setTimeout(() => {
      router.push(`/success?transactionId=${txDigest}&service=Electricity&amount=${amount}&phone=${phoneNumber}&meter=${meterNumber}`)
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

  // Update Naira amount when amount changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      setNairaAmount(parseFloat(amount))
    }
  }, [amount])

  return (
    
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mobile-container py-6">
        {/* Header */}
        {/* Wallet Display - Centered at top */}
        <div className="flex justify-center mb-6">
          <GlobalWalletDisplay />
        </div>

        <header className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md"
            aria-label="Go back"
          >
            <span className="material-icons text-gray-600 dark:text-gray-400">arrow_back</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <ExchangeRateTicker />
            <NetworkIndicator />
          </div>
        </header>

        {/* Main Content */}
        <main>
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
            Electricity Bills
          </h1>

          <div className="space-y-6">
            {/* Token Selection */}
            <TokenSelector
              selectedToken={selectedToken}
              onTokenSelect={setSelectedToken}
            />

            {/* Electricity Provider Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Select Electricity Provider
              </label>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {electricityProviders.map((provider) => (
                  <button
                    key={provider.serviceID}
                    onClick={() => setSelectedProvider(provider)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      selectedProvider?.serviceID === provider.serviceID
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span className="material-icons text-primary text-xl">{provider.icon}</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 text-center">
                        {provider.shortName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Meter Number */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Meter Number
              </label>
              <input
                type="text"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                placeholder="Enter meter number"
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 focus:ring-primary focus:border-primary text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your prepaid meter number
              </p>
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
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter custom amount"
                min="100"
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 focus:ring-primary focus:border-primary text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum amount: ₦100
              </p>
            </div>

            {/* Price Converter */}
            {amount && parseFloat(amount) > 0 && (
            <PriceConverter
              tokenAmount={suiAmount}
              tokenSymbol={selectedToken}
              nairaAmount={nairaAmount}
              onTokenChange={handleSuiAmountChange}
              onNairaChange={handleNairaAmountChange}
              showUsd={true}
            />
            )}

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
            {selectedProvider && amount && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Purchase Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                    <span className="text-gray-900 dark:text-gray-100">{selectedProvider.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Meter Number:</span>
                    <span className="text-gray-900 dark:text-gray-100">{meterNumber || 'Not provided'}</span>
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
              serviceType="electricity"
              serviceDetails={{
                disco: selectedProvider?.serviceID || '',
                meterNumber,
                phoneNumber,
                amount: parseFloat(amount)
              }}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              disabled={!selectedProvider || !meterNumber || !amount || !phoneNumber || parseFloat(amount) < 100 || suiAmount <= 0}
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
    
  )
}
