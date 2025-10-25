'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'
import { GeometricPattern } from '@/components/GeometricPattern'

interface AuthFormData {
  email: string
  name: string
  referralCode: string
}

interface FormErrors {
  email?: string
  name?: string
  referralCode?: string
}

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    name: '',
    referralCode: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already authenticated
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        if (userData.authenticated) {
          router.push('/dashboard')
        }
      } catch {
        // Invalid user data, continue with signup
      }
    }
  }, [router])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
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
    setGeneralError(null)
    setSuccessMessage(null)
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
      // First, validate the user input
      const validationResponse = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          referralCode: formData.referralCode || undefined
        })
      })

      const validationResult = await validationResponse.json()

      if (!validationResponse.ok) {
        throw new Error(validationResult.error || 'Validation failed')
      }

      // Check if user already exists
      if (validationResult.exists) {
        throw new Error('User already exists. Please sign in instead.')
      }

      // Check referral code validity
      if (formData.referralCode && !validationResult.validReferral) {
        throw new Error('Invalid referral code. Please check and try again.')
      }

      // Send verification email
      const emailResponse = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          referralCode: formData.referralCode || undefined
        })
      })

      const emailResult = await emailResponse.json()

      if (!emailResponse.ok) {
        throw new Error(emailResult.error || 'Failed to send verification email')
      }

      // Store user data temporarily for verification
      const tempUserData = {
        email: formData.email,
        name: formData.name,
        referralCode: formData.referralCode || undefined,
        userReferralCode: emailResult.userReferralCode,
        verificationCode: emailResult.verificationCode,
        authenticated: false
      }

      localStorage.setItem('user', JSON.stringify(tempUserData))

      setSuccessMessage('Verification code sent! Please check your email.')
      
      // Redirect to verification page after a short delay
      setTimeout(() => {
        router.push('/verify-email')
      }, 2000)

    } catch (error) {
      console.error('Signup error:', error)
      setGeneralError(error instanceof Error ? error.message : 'An unexpected error occurred')
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Theme Toggle - Temporarily disabled to fix context error */}
      {/* <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div> */}

      {/* Header with Geometric Pattern */}
      <div className="relative h-48 bg-gray-900 dark:bg-black">
        <GeometricPattern />
        
        {/* Logo and Title */}
        <div className="relative z-10 flex items-center justify-center h-full px-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="SwitcherFi Logo"
                width={64}
                height={64}
                className="rounded-lg"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-white">Sign Up</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Form */}
        <div className="space-y-6">
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
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your full name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your email address"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Referral Code Field */}
            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Referral Code
              </label>
              <input
                type="text"
                id="referralCode"
                value={formData.referralCode}
                onChange={(e) => handleInputChange('referralCode', e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter referral code (optional)"
                disabled={isLoading}
              />
              {errors.referralCode && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.referralCode}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional: Enter a referral code if you have one
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-black mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">check</span>
                  Sign Up
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign In
              </button>
            </p>
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