'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TokenSelector } from '@/components/TokenSelector'
import { SUI_TOKENS, DEFAULT_TOKEN } from '@/lib/tokens'
import { GlobalWalletDisplay } from '@/components/GlobalWalletDisplay'
import { NetworkIndicator } from '@/components/SimpleWallet'
import { useWallet } from '@/components/WalletProvider'
import { PaymentButton as SmartPaymentButton } from '@/components/SmartPaymentButton'
import { PaymentStatus } from '@/components/PaymentButton'
import { PriceConverter, ExchangeRateTicker } from '@/components/PriceConverter'

interface DataPlan {
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
  { serviceID: 'mtn-data', name: 'MTN Data', icon: 'phone_iphone' },
  { serviceID: 'airtel-data', name: 'Airtel Data', icon: 'phone_iphone' },
  { serviceID: 'glo-data', name: 'GLO Data', icon: 'phone_iphone' },
  { serviceID: '9mobile-data', name: '9mobile Data', icon: 'phone_iphone' },
]

export default function DataPurchase() {
  const router = useRouter()
  const [selectedToken, setSelectedToken] = useState('SUI')
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [error, setError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [txDigest, setTxDigest] = useState<string | undefined>()
  const [suiAmount, setSuiAmount] = useState<number>(0)
  const [nairaAmount, setNairaAmount] = useState<number>(0)

  // Fetch data plans when network is selected
  useEffect(() => {
    if (selectedNetwork) {
      fetchDataPlans(selectedNetwork.serviceID)
    }
  }, [selectedNetwork])

  const fetchDataPlans = async (serviceID: string) => {
    setIsLoadingPlans(true)
    setError('')
    
    try {
      // Extract network name from serviceID (e.g., 'mtn-data' -> 'mtn')
      const networkName = serviceID.replace('-data', '')
      
      const response = await fetch(`/api/services?action=data-plans&network=${networkName}`)
      const result = await response.json()
      
      if (result.success) {
        // Transform the data to match our interface
        const plans = result.content.variations.map((plan: any) => ({
          variation_code: plan.variation_code,
          name: plan.name,
          variation_amount: plan.variation_amount,
          fixedPrice: plan.variation_amount
        }))
        setDataPlans(plans)
      } else {
        throw new Error(result.error || 'Failed to fetch data plans')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data plans')
      console.error('Error fetching data plans:', err)
    } finally {
      setIsLoadingPlans(false)
    }
  }

  const handlePurchase = async () => {
    if (!selectedNetwork || !selectedPlan || !phoneNumber) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // VTpass API call to purchase data
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'data',
          phone: phoneNumber,
          variationCode: selectedPlan.variation_code,
          serviceID: selectedNetwork.serviceID
        }),
      })

      if (!response.ok) {
        throw new Error('Purchase failed')
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        // Success - redirect to success page
        router.push(`/success?transactionId=${result.data.requestId}&service=Data&amount=${selectedPlan.variation_amount}&phone=${phoneNumber}`)
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

  const handlePaymentSuccess = (txDigest: string) => {
    setPaymentStatus('success')
    setTxDigest(txDigest)
    setError('')
    
    // Redirect to success page after a short delay
    setTimeout(() => {
      router.push(`/success?transactionId=${txDigest}&service=Data&amount=${selectedPlan?.variation_amount}&phone=${phoneNumber}`)
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

  // Update Naira amount when plan is selected
  useEffect(() => {
    if (selectedPlan) {
      setNairaAmount(parseFloat(selectedPlan.variation_amount))
    }
  }, [selectedPlan])

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
            Buy Data
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

            {/* Data Plans */}
            {selectedNetwork && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Select Data Plan
                </label>
                {isLoadingPlans ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {dataPlans.map((plan) => (
                      <button
                        key={plan.variation_code}
                        onClick={() => setSelectedPlan(plan)}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          selectedPlan?.variation_code === plan.variation_code
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {plan.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {plan.variation_code}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">
                              {formatAmount(plan.variation_amount)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

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

            {/* Price Converter */}
            {selectedPlan && (
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
            {selectedPlan && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Purchase Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Network:</span>
                    <span className="text-gray-900 dark:text-gray-100">{selectedNetwork?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                    <span className="text-gray-900 dark:text-gray-100">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="text-gray-900 dark:text-gray-100">{phoneNumber || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-gray-900 dark:text-gray-100">Total:</span>
                    <span className="text-primary">{formatAmount(selectedPlan.variation_amount)}</span>
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
              serviceType="data"
              serviceDetails={{
                network: selectedNetwork?.serviceID || '',
                phoneNumber,
                dataPlan: selectedPlan?.variation_code || '',
                amount: selectedPlan ? parseFloat(selectedPlan.variation_amount) : 0
              }}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              disabled={!selectedNetwork || !selectedPlan || !phoneNumber || suiAmount <= 0}
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
