'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'
import { GeometricPattern } from '@/components/GeometricPattern'

interface SignInFormData {
  email: string
}

interface FormErrors {
  email?: string
}

export default function SignInPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<SignInFormData>({
    email: ''
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
        // Invalid user data, continue with sign in
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof SignInFormData, value: string) => {
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
      // Check if user exists
      const validationResponse = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email
        })
      })

      const validationResult = await validationResponse.json()

      if (!validationResponse.ok) {
        throw new Error(validationResult.error || 'Validation failed')
      }

      // Check if user exists
      if (validationResult.exists) {
        // User exists, redirect to dashboard
        const userData = {
          email: validationResult.user.email,
          name: validationResult.user.name,
          referralCode: validationResult.user.referral_code,
          authenticated: true
        }

        localStorage.setItem('user', JSON.stringify(userData))
        
        setSuccessMessage('Welcome back! Redirecting to dashboard...')
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        // User doesn't exist, show message to sign up
        setGeneralError('User does not exist. Please sign up first.')
      }

    } catch (error) {
      console.error('Sign in error:', error)
      setGeneralError(error instanceof Error ? error.message : 'An unexpected error occurred')
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Theme Toggle - Temporarily disabled */}
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
            <h1 className="text-2xl font-bold text-white">Login</h1>
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-black mr-2"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">login</span>
                  Login
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign Up
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