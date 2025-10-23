'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SignInFormData {
  email: string
}

export default function SignInPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<SignInFormData>({
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<SignInFormData>>({})
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
    const newErrors: Partial<SignInFormData> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof SignInFormData, value: string) => {
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
          referralCode: null
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
        // Email exists - redirect directly to dashboard
        const userData = {
          email: formData.email,
          name: validationResult.user.name,
          referralCode: validationResult.user.referralCode,
          authenticated: true,
          authenticatedAt: new Date().toISOString()
        }
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(userData))
        
        setSuccessMessage('Welcome back! Redirecting to dashboard...')
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
        
      } else {
        // Email doesn't exist - ask user to sign up
        throw new Error('User does not exist. Please sign up instead.')
      }
      
    } catch (error) {
      console.error('Sign in error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      setGeneralError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: ''
    })
    setErrors({})
    setGeneralError(null)
    setSuccessMessage(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-white text-2xl">
              login
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your email to continue
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
                    Sign In Error
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {generalError}
                  </p>
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                    <strong>Possible solutions:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Check your email address</li>
                      <li>Make sure you have an account</li>
                      <li>Try signing up if you're new</li>
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">check</span>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Link to Sign Up */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Terms and Privacy */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            By signing in, you agree to our{' '}
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
          <h3 className="font-bold text-lg mb-4">Why Choose PayBills?</h3>
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
