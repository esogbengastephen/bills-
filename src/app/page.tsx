'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AuthFormData {
  email: string
  name: string
  referralCode: string
}

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(false)
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    name: '',
    referralCode: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<AuthFormData>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Check if user is already authenticated
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.authenticated) {
          router.push('/dashboard')
        }
      } catch (error) {
        // Invalid data, clear it
        localStorage.removeItem('user')
      }
    }
  }, [router])

  const validateForm = (): boolean => {
    const newErrors: Partial<AuthFormData> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }


    // Name validation (only for signup)
    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Name is required'
      } else if (formData.name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters'
      }

      // Referral code validation (optional for signup)
      if (formData.referralCode && formData.referralCode.length < 6) {
        newErrors.referralCode = 'Referral code must be at least 6 characters'
      }
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
    // Clear general error and success message when user starts typing
    if (generalError) {
      setGeneralError(null)
    }
    if (successMessage) {
      setSuccessMessage(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setGeneralError(null)
    setSuccessMessage(null)
    
    try {
      // Check if email exists in database
      const validationResponse = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          referralCode: formData.referralCode || null
        })
      })

      if (!validationResponse.ok) {
        if (validationResponse.status === 500) {
          throw new Error('Server configuration error. Please try again later or contact support.')
        }
        throw new Error('Network error. Please check your connection and try again.')
      }

      const validationResult = await validationResponse.json()

      if (validationResult.exists) {
        // Email exists - send verification code and redirect to dashboard
        const emailResponse = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            name: validationResult.user.name,
            referralCode: null // Existing user, no referral code needed
          })
        })

        if (!emailResponse.ok) {
          throw new Error('Failed to send verification email')
        }

        const emailResult = await emailResponse.json()
        const verificationCode = emailResult.verificationCode || '123456'
        
        // Store pending verification data
        localStorage.setItem('pendingVerification', JSON.stringify({
          email: formData.email,
          name: validationResult.user.name,
          referralCode: null,
          userReferralCode: validationResult.user.referralCode,
          verificationCode: verificationCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        }))
        
        setSuccessMessage('Verification email sent! Redirecting to verification page...')
        
        setTimeout(() => {
          router.push('/verify-email')
        }, 1500)
        
      } else {
        // Email doesn't exist - check referral code and proceed with signup
        if (formData.referralCode && !validationResult.validReferral) {
          throw new Error('Invalid referral code. Please check and try again.')
        }

        // Send verification email for new signup
        const emailResponse = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            referralCode: formData.referralCode
          })
        })

        if (!emailResponse.ok) {
          throw new Error('Failed to send verification email')
        }

        const emailResult = await emailResponse.json()
        const verificationCode = emailResult.verificationCode || '123456'
        const userReferralCode = emailResult.userReferralCode || 'ABC12345'
        
        // Store pending verification data
        localStorage.setItem('pendingVerification', JSON.stringify({
          email: formData.email,
          name: formData.name,
          referralCode: formData.referralCode,
          userReferralCode: userReferralCode,
          verificationCode: verificationCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        }))
        
        setSuccessMessage('Verification email sent! Redirecting to verification page...')
        
        setTimeout(() => {
          router.push('/verify-email')
        }, 1500)
      }
      
    } catch (error) {
      console.error('Authentication error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      setGeneralError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      referralCode: ''
    })
    setErrors({})
    setGeneralError(null)
    setSuccessMessage(null)
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-white text-2xl">
              {isLogin ? 'login' : 'person_add'}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Welcome to PayBills'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isLogin ? 'Enter your email to continue' : 'Enter your email to get started'}
          </p>
        </div>

        {/* Authentication Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* General Error Display */}
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <span className="material-icons text-red-600 dark:text-red-400 mr-2 mt-0.5">error</span>
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Authentication Error
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {generalError}
                  </p>
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                    <strong>Possible solutions:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Check your internet connection</li>
                      <li>Verify your email and referral code</li>
                      <li>Try refreshing the page</li>
                      <li>Contact support if the problem persists</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Message Display */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start">
                <span className="material-icons text-green-600 dark:text-green-400 mr-2 mt-0.5">check_circle</span>
                <div>
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                    Success!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {successMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

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

            {/* Name Input - Only for Signup */}
            {!isLogin && (
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
            )}

            {/* Referral Code Input - Only for Signup */}
            {!isLogin && (
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
                    onChange={(e) => handleInputChange('referralCode', e.target.value)}
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
                  Referral code is optional. Leave blank if you don't have one.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">check</span>
                  Continue
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Signup */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Terms and Privacy */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="font-bold text-lg mb-4">Why Join PayBills?</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="material-icons mr-3">security</span>
              <span>Secure blockchain payments</span>
            </div>
            <div className="flex items-center">
              <span className="material-icons mr-3">check_circle</span>
              <span>Instant transactions</span>
            </div>
            <div className="flex items-center">
              <span className="material-icons mr-3">savings</span>
              <span>Low transaction fees</span>
            </div>
            <div className="flex items-center">
              <span className="material-icons mr-3">support_agent</span>
              <span>24/7 customer support</span>
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
  )
}