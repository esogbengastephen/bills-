'use client'

import { useState } from 'react'
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

      // Referral code validation (only for signup)
      if (!formData.referralCode) {
        newErrors.referralCode = 'Referral code is required'
      } else if (formData.referralCode.length < 6) {
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      if (isLogin) {
        // Login logic
        console.log('Login attempt:', { email: formData.email })
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Store user data
        localStorage.setItem('user', JSON.stringify({
          email: formData.email,
          name: 'User', // In real app, get from API response
          authenticated: true,
          authenticatedAt: new Date().toISOString()
        }))
        
        // Redirect to dashboard
        router.push('/dashboard')
        
      } else {
        // Signup logic - send verification email
        console.log('Signup attempt:', formData)
        
        // Send verification email
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

        const emailResult = await emailResponse.json()

        if (!emailResult.success) {
          throw new Error(emailResult.error || 'Failed to send verification email')
        }

        // Generate verification code (in production, this would come from the server)
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
        
        // Redirect to verification page
        router.push('/verify-email')
      }
      
    } catch (error) {
      console.error('Authentication error:', error)
      // Handle error (show error message, etc.)
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
            {isLogin ? 'Sign in to your account' : 'Create your account to start making payments'}
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
                  Don't have a referral code? Contact support for assistance.
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
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">check</span>
                  {isLogin ? 'Sign In' : 'Create Account'}
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