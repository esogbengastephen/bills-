'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingData, setPendingData] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    // Get pending verification data
    const data = localStorage.getItem('pendingVerification')
    if (!data) {
      router.push('/')
      return
    }

    const parsedData = JSON.parse(data)
    setPendingData(parsedData)

    // Calculate time left
    const expiresAt = new Date(parsedData.expiresAt)
    const now = new Date()
    const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
    setTimeLeft(diff)

    // Set up timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // Code expired, redirect back to auth
          localStorage.removeItem('pendingVerification')
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verificationCode) {
      setError('Please enter the verification code')
      return
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check if code matches (in real app, verify with server)
      if (verificationCode === pendingData.verificationCode) {
        // Store user data
        localStorage.setItem('user', JSON.stringify({
          email: pendingData.email,
          name: pendingData.name,
          referralCode: pendingData.referralCode,
          userReferralCode: pendingData.userReferralCode,
          authenticated: true,
          authenticatedAt: new Date().toISOString()
        }))

        // Referral email will be sent from dashboard

        // Clear pending verification
        localStorage.removeItem('pendingVerification')

        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        setError('Invalid verification code')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError('Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Send new verification email
      const emailResponse = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: pendingData.email,
          name: pendingData.name,
          referralCode: pendingData.referralCode
        })
      })

      const emailResult = await emailResponse.json()

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to resend verification email')
      }

      // Generate new code (in production, this would come from the server)
      const newCode = emailResult.verificationCode || Math.floor(100000 + Math.random() * 900000).toString()
      
      // Update pending data with new code
      const updatedData = {
        ...pendingData,
        verificationCode: newCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      }
      
      localStorage.setItem('pendingVerification', JSON.stringify(updatedData))
      setPendingData(updatedData)
      setTimeLeft(600) // 10 minutes

      alert(`New verification code sent! Code: ${newCode}`)
    } catch (error) {
      console.error('Resend error:', error)
      setError('Failed to resend code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!pendingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-white text-2xl">email</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a verification code to
          </p>
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            {pendingData.email}
          </p>
        </div>

        {/* Verification Code Display for Testing */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="material-icons text-yellow-600 dark:text-yellow-400 mr-2">info</span>
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Testing Mode</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your verification code is: <span className="font-mono font-bold text-lg">{pendingData.verificationCode}</span>
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                In production, this code would be sent to your email.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Verification Code Input */}
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-400 text-lg">security</span>
                </div>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value)
                    setError('')
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    error 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg tracking-widest`}
                  placeholder="123456"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>

            {/* Timer */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Code expires in: <span className="font-mono text-red-600 dark:text-red-400">{formatTime(timeLeft)}</span>
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || timeLeft === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">check</span>
                  Verify Email
                </>
              )}
            </button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Resend Code
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Check your spam folder if you don't see the email.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Back to Sign Up
          </button>
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
