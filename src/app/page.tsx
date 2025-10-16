'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuiWalletProvider } from '@/components/SuiWalletProvider'
import { SimpleWalletDisplay } from '@/components/SimpleWallet'

interface AuthFormData {
  email: string
  name: string
  referralCode: string
}

export default function AuthPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    name: '',
    referralCode: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<AuthFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<AuthFormData> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Referral code validation
    if (!formData.referralCode) {
      newErrors.referralCode = 'Referral code is required'
    } else if (formData.referralCode.length < 6) {
      newErrors.referralCode = 'Referral code must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      // TODO: Implement actual authentication logic
      // For now, we'll simulate a successful authentication
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Store user data in localStorage (temporary)
      localStorage.setItem('user', JSON.stringify({
        email: formData.email,
        name: formData.name,
        referralCode: formData.referralCode,
        authenticated: true,
        authenticatedAt: new Date().toISOString()
      }))
      
      // Redirect to dashboard
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Authentication error:', error)
      // Handle error (show error message, etc.)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SuiWalletProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Wallet Display - Centered at top */}
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-md mx-auto px-4 py-4">
            <SimpleWalletDisplay />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-white text-2xl">person_add</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to PayBills
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create your account to start making payments
            </p>
          </div>

          {/* Authentication Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400 text-lg">email</span>
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.email 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Enter your email address"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400 text-lg">person</span>
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.name 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Referral Code Input */}
              <div>
                <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Referral Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400 text-lg">card_giftcard</span>
                  </div>
                  <input
                    type="text"
                    id="referralCode"
                    value={formData.referralCode}
                    onChange={(e) => handleInputChange('referralCode', e.target.value.toUpperCase())}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.referralCode 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Enter referral code"
                    disabled={isLoading}
                  />
                </div>
                {errors.referralCode && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.referralCode}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Don't have a referral code? Contact support for assistance.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">check_circle</span>
                    Create Account
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Privacy Policy
              </a>
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Why Join PayBills?</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="material-icons mr-3">security</span>
                <span className="text-sm">Secure blockchain payments</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons mr-3">speed</span>
                <span className="text-sm">Instant transactions</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons mr-3">savings</span>
                <span className="text-sm">Low transaction fees</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons mr-3">support</span>
                <span className="text-sm">24/7 customer support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Material Icons Font */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </div>
    </SuiWalletProvider>
  )
}
